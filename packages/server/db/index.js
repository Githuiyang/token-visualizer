import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data.db');

let db = null;

export function getDb() {
  if (db) return db;

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  // Run schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// User operations
export function createUser(apiKey) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO users (api_key) VALUES (?)');
  return stmt.run(apiKey);
}

export function getUserByApiKey(apiKey) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE api_key = ?');
  return stmt.get(apiKey);
}

// Usage record operations
export function insertUsageRecords(userId, records) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO usage_records
    (user_id, model, project, input_tokens, output_tokens, cached_tokens, cost, bucket_start, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records) => {
    for (const record of records) {
      stmt.run(
        userId,
        record.model,
        record.project || null,
        record.inputTokens || 0,
        record.outputTokens || 0,
        record.cachedInputTokens || 0,
        record.cost?.total || 0,
        record.bucketStart,
        record.source
      );
    }
  });

  return insertMany(records);
}

export function getUserStats(userId) {
  const db = getDb();

  const totalStmt = db.prepare(`
    SELECT
      SUM(input_tokens + output_tokens + cached_tokens) as total_tokens,
      SUM(cost) as total_cost,
      COUNT(DISTINCT DATE(bucket_start)) as days_active,
      COUNT(DISTINCT model) as model_count
    FROM usage_records
    WHERE user_id = ?
  `);

  const byModelStmt = db.prepare(`
    SELECT
      model,
      SUM(input_tokens) as input_tokens,
      SUM(output_tokens) as output_tokens,
      SUM(cached_tokens) as cached_tokens,
      SUM(input_tokens + output_tokens + cached_tokens) as total_tokens,
      SUM(cost) as cost
    FROM usage_records
    WHERE user_id = ?
    GROUP BY model
    ORDER BY cost DESC
  `);

  const byDayStmt = db.prepare(`
    SELECT
      DATE(bucket_start) as date,
      SUM(input_tokens + output_tokens + cached_tokens) as tokens,
      SUM(cost) as cost,
      COUNT(*) as requests
    FROM usage_records
    WHERE user_id = ?
    GROUP BY DATE(bucket_start)
    ORDER BY date ASC
  `);

  return {
    total: totalStmt.get(userId),
    byModel: byModelStmt.all(userId),
    byDay: byDayStmt.all(userId),
  };
}

export function cleanupOldData(daysToKeep = 90) {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM usage_records
    WHERE bucket_start < datetime('now', '-' || ? || ' days')
  `);
  return stmt.run(daysToKeep);
}
