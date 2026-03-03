/**
 * OpenCode parser - reads from ~/.local/share/opencode/opencode.db
 */
import { join } from 'node:path';
import { homedir } from 'node:os';
import { calculateCost, normalizeModelName } from '../config/models.js';
import { aggregateToBuckets } from './index.js';
import Database from 'better-sqlite3';

const DB_PATH = join(homedir(), '.local', 'share', 'opencode', 'opencode.db');

/**
 * Parse OpenCode usage data from SQLite database
 */
export async function parse() {
  let db;
  try {
    db = new Database(DB_PATH, { readonly: true });
  } catch (error) {
    console.warn(`Could not open OpenCode database: ${error.message}`);
    return [];
  }

  const entries = [];

  try {
    const messages = db.prepare(`
      SELECT
        m.data,
        s.directory
      FROM message m
      JOIN session s ON m.session_id = s.id
      WHERE json_extract(m.data, '$.tokens') IS NOT NULL
      ORDER BY m.time_created
    `).all();

    for (const row of messages) {
      const data = JSON.parse(row.data);
      const tokens = data.tokens || {};
      const modelId = data.modelID || 'unknown';
      const normalizedModel = normalizeModelName(modelId);
      const timestamp = data.time?.created ? new Date(data.time.created) : new Date();

      const inputTokens = tokens.input || 0;
      const outputTokens = tokens.output || 0;
      const cachedTokens = tokens.cache?.read || 0;

      if (inputTokens === 0 && outputTokens === 0) continue;

      const project = cleanProjectDir(row.directory);
      const cost = calculateCost(normalizedModel, inputTokens, outputTokens, cachedTokens);

      entries.push({
        source: 'opencode',
        model: normalizedModel,
        project,
        timestamp,
        inputTokens,
        outputTokens,
        cachedInputTokens: cachedTokens,
        reasoningOutputTokens: tokens.reasoning || 0,
        cost,
      });
    }
  } catch (error) {
    console.warn(`Error parsing OpenCode data: ${error.message}`);
  } finally {
    db.close();
  }

  return aggregateToBuckets(entries);
}

function cleanProjectDir(raw) {
  if (!raw) return 'unknown';
  const parts = raw.split(/[\/\\]+/);
  const meaningful = parts.filter(p =>
    p &&
    p !== 'Users' &&
    p !== 'Library' &&
    !p.match(/^\d+$/)
  );
  if (meaningful.length === 0) return 'unknown';
  const lastPart = meaningful[meaningful.length - 1];
  return lastPart.length > 30 ? lastPart.slice(0, 30) : lastPart;
}
