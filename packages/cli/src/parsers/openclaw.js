/**
 * OpenClaw parser
 * Reads from ~/.openclaw/agents/<agentId>/sessions/*.jsonl
 */
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { aggregateToBuckets } from './index.js';
import { calculateCost, normalizeModelName } from '../config/models.js';

// OpenClaw stores data at ~/.openclaw/agents/<agentId>/sessions/*.jsonl
// Legacy paths: ~/.clawdbot, ~/.moltbot, ~/.moldbot
const POSSIBLE_ROOTS = [
  join(homedir(), '.openclaw'),
  join(homedir(), '.clawdbot'),
  join(homedir(), '.moltbot'),
  join(homedir(), '.moldbot'),
];

const STATE_FILE = join(homedir(), '.token-visualizer', 'openclaw-state.json');

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { processedFiles: {} };
  }
}

function saveState(state) {
  const dir = join(homedir(), '.token-visualizer');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8');
}

function getFileHash(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const stats = statSync(filePath);
    // Use file size + mtime + last 100 chars as hash
    // This ensures growing files are always detected as changed
    return `${content.length}:${stats.mtimeMs}:${content.slice(-100)}`;
  } catch {
    return '';
  }
}

/** Normalize usage fields — OpenClaw supports multiple naming conventions */
function getTokens(usage, ...keys) {
  for (const key of keys) {
    if (usage[key] != null && usage[key] > 0) return usage[key];
  }
  return 0;
}

export async function parse() {
  const entries = [];
  const state = loadState();
  const nextState = { processedFiles: { ...state.processedFiles } };

  for (const root of POSSIBLE_ROOTS) {
    const agentsDir = join(root, 'agents');
    if (!existsSync(agentsDir)) continue;

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
        const fileKey = filePath;

        // Check if file was already processed
        const currentHash = getFileHash(filePath);
        if (state.processedFiles[fileKey] === currentHash) {
          continue; // Skip unchanged files
        }
        nextState.processedFiles[fileKey] = currentHash;

        let content;
        try {
          content = readFileSync(filePath, 'utf-8');
        } catch {
          continue;
        }

        for (const line of content.split('\n')) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);

            // Only process message entries with assistant role
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
      }
    }
  }

  saveState(nextState);
  return aggregateToBuckets(entries);
}
