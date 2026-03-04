/**
 * OpenClaw parser
 * Reads from ~/.openclaw/agents/<agentId>/sessions/*.jsonl
 *
 * Note: OpenClaw files are append-only (.jsonl), so we must read all entries each time.
 * Deduplication is handled server-side based on bucket_start + model + source + project.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
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

/** Normalize usage fields — OpenClaw supports multiple naming conventions */
function getTokens(usage, ...keys) {
  for (const key of keys) {
    if (usage[key] != null && usage[key] > 0) return usage[key];
  }
  return 0;
}

export async function parse() {
  const entries = [];

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

  return aggregateToBuckets(entries);
}
