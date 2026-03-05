/**
 * OpenClaw parser
 * Reads from ~/.openclaw/agents/<agentId>/sessions/*.jsonl and ~/.openclaw/sessions/*.jsonl
 *
 * Note: OpenClaw files are append-only (.jsonl), so we must read all entries each time.
 * Deduplication is handled server-side based on bucket_start + model + source + project.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { aggregateToBuckets } from './index.js';
import { calculateCost, normalizeModelName } from '../config/models.js';

// OpenClaw stores data at:
// - ~/.openclaw/agents/<agentId>/sessions/*.jsonl (per-agent sessions)
// - ~/.openclaw/sessions/*.jsonl (centralized sessions)
// Legacy paths: ~/.clawdbot, ~/.moltbot, ~/.moldbot
const POSSIBLE_ROOTS = [
  join(homedir(), '.openclaw'),
  join(homedir(), '.clawdbot'),
  join(homedir(), '.moltbot'),
  join(homedir(), '.moldbot'),
];

/** Normalize usage fields — OpenClaw supports multiple naming conventions */
function getTokens(usage, ...keys) {
  for (const key of keys) {
    if (usage[key] != null && usage[key] > 0) return usage[key];
  }
  return 0;
}

/** Extract user input characters from a message */
function extractUserChars(obj) {
  if (obj.type !== 'message') return 0;
  const msg = obj.message;
  if (!msg || msg.role !== 'user') return 0;
  
  const content = msg.content;
  if (!Array.isArray(content)) return 0;
  
  let chars = 0;
  for (const part of content) {
    if (part.type === 'text' && typeof part.text === 'string') {
      chars += part.text.length;
    }
  }
  return chars;
}

/** Process a single session file and return entries */
function processSessionFile(filePath, project) {
  const entries = [];
  let userChars = 0;

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return { entries, userChars };
  }

  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);

      // Count user input characters
      userChars += extractUserChars(obj);

      // Only process message entries with assistant role for token stats
      if (obj.type !== 'message') continue;
      const msg = obj.message;
      if (!msg || msg.role !== 'assistant') continue;

      const usage = msg.usage;
      if (!usage) continue;

      const timestamp = obj.timestamp || msg.timestamp;
      if (!timestamp) continue;
      const ts = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
      if (isNaN(ts.getTime())) continue;

      const inputTokens = getTokens(usage, 'input', 'inputTokens', 'input_tokens', 'promptTokens', 'prompt_tokens');
      const outputTokens = getTokens(usage, 'output', 'outputTokens', 'output_tokens', 'completionTokens', 'completion_tokens');
      const cachedTokens = getTokens(usage, 'cacheRead', 'cache_read', 'cache_read_input_tokens');
      const modelName = msg.model || obj.model || 'unknown';
      const normalizedModel = normalizeModelName(modelName);

      const cost = calculateCost(normalizedModel, inputTokens, outputTokens, cachedTokens);

      entries.push({
        source: 'openclaw',
        model: normalizedModel,
        project,
        timestamp: ts,
        inputTokens,
        outputTokens,
        cachedInputTokens: cachedTokens,
        reasoningOutputTokens: 0,
        cost,
      });
    } catch {
      continue;
    }
  }

  return { entries, userChars };
}

export async function parse() {
  const entries = [];
  const userCharsStats = {};

  for (const root of POSSIBLE_ROOTS) {
    // Scan agents/<agentId>/sessions/
    const agentsDir = join(root, 'agents');
    if (existsSync(agentsDir)) {
      let agentDirs;
      try {
        agentDirs = readdirSync(agentsDir, { withFileTypes: true })
          .filter(d => d.isDirectory());
      } catch {
        continue;
      }

      for (const agentDir of agentDirs) {
        const project = agentDir.name;
        const sessionsDir = join(agentsDir, agentDir.name, 'sessions');
        if (!existsSync(sessionsDir)) continue;

        let files;
        try {
          files = readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
        } catch {
          continue;
        }

        for (const file of files) {
          const filePath = join(sessionsDir, file);
          const result = processSessionFile(filePath, project);
          entries.push(...result.entries);
          
          if (result.userChars > 0) {
            userCharsStats[project] = (userCharsStats[project] || 0) + result.userChars;
          }
        }
      }
    }

    // Scan sessions/ (centralized sessions)
    const centralSessionsDir = join(root, 'sessions');
    if (existsSync(centralSessionsDir)) {
      let files;
      try {
        files = readdirSync(centralSessionsDir).filter(f => f.endsWith('.jsonl'));
      } catch {
        continue;
      }

      for (const file of files) {
        const filePath = join(centralSessionsDir, file);
        const project = 'central';
        const result = processSessionFile(filePath, project);
        entries.push(...result.entries);
        
        if (result.userChars > 0) {
          userCharsStats[project] = (userCharsStats[project] || 0) + result.userChars;
        }
      }
    }
  }

  const buckets = aggregateToBuckets(entries);
  return { buckets, userCharsStats };
}
