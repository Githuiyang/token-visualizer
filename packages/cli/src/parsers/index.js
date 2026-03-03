import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { calculateCost } from '../config/models.js';

export const AVAILABLE_PARSERS = [
  'claude-code',
  'openclaw',
  'opencode',
];

/**
 * Round date to nearest half-hour bucket
 */
export function roundToHalfHour(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
  return d;
}

/**
 * Aggregate raw entries into half-hour buckets
 */
export function aggregateToBuckets(entries) {
  const map = new Map();

  for (const e of entries) {
    const bucketStart = roundToHalfHour(e.timestamp).toISOString();
    const key = `${e.source}|${e.model}|${e.project}|${bucketStart}`;

    if (!map.has(key)) {
      map.set(key, {
        source: e.source,
        model: e.model,
        project: e.project,
        bucketStart,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        reasoningOutputTokens: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cached: 0, total: 0 },
      });
    }

    const b = map.get(key);
    b.inputTokens += e.inputTokens || 0;
    b.outputTokens += e.outputTokens || 0;
    b.cachedInputTokens += e.cachedInputTokens || 0;
    b.reasoningOutputTokens += e.reasoningOutputTokens || 0;
    b.totalTokens += (e.inputTokens || 0) + (e.outputTokens || 0);

    // Aggregate costs
    const cost = calculateCost(e.model, e.inputTokens || 0, e.outputTokens || 0, e.cachedInputTokens || 0);
    b.cost.input += cost.input;
    b.cost.output += cost.output;
    b.cost.cached += cost.cached;
    b.cost.total += cost.total;
  }

  return Array.from(map.values());
}

/**
 * Parse all enabled parsers and return aggregated buckets
 * Note: Individual parsers already aggregate their entries, so we just merge them
 */
export async function parseAll(enabledParsers = AVAILABLE_PARSERS) {
  const parsers = await import('./parser-registry.js');
  const allBuckets = [];

  for (const name of enabledParsers) {
    if (parsers.registry[name]) {
      try {
        const buckets = await parsers.registry[name]();
        allBuckets.push(...buckets);
      } catch (error) {
        console.warn(`Warning: Parser ${name} failed: ${error.message}`);
      }
    } else {
      console.warn(`Warning: Unknown parser ${name}`);
    }
  }

  // Buckets are already aggregated, just return them
  return allBuckets;
}
