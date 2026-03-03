import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

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

  // Ensure new columns exist (for migrations)
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN email TEXT;
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN email_hash TEXT;
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN nickname TEXT;
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN show_email BOOLEAN DEFAULT 0;
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN show_nickname BOOLEAN DEFAULT 1;
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN show_on_leaderboard BOOLEAN DEFAULT 0;
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN organization TEXT;
    `);
  } catch (e) {}

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

  // Detailed daily breakdown by model and source
  const byDayDetailStmt = db.prepare(`
    SELECT
      DATE(bucket_start) as date,
      model,
      source,
      project,
      SUM(input_tokens) as input_tokens,
      SUM(output_tokens) as output_tokens,
      SUM(cached_tokens) as cached_tokens,
      SUM(input_tokens + output_tokens + cached_tokens) as total_tokens,
      SUM(cost) as cost,
      COUNT(*) as requests
    FROM usage_records
    WHERE user_id = ?
    GROUP BY DATE(bucket_start), model, source
    ORDER BY date DESC, cost DESC
  `);

  return {
    total: totalStmt.get(userId),
    byModel: byModelStmt.all(userId),
    byDay: byDayStmt.all(userId),
    byDayDetail: byDayDetailStmt.all(userId),
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

// User registration and profile functions

export function generateEmailHash(email) {
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256')
    .update(normalized + 'token-viz-salt-2025')
    .digest('hex');
}

export function generateApiKeyFromEmail(email) {
  const normalized = email.toLowerCase().trim();
  const hash = crypto.createHash('sha256')
    .update(normalized + 'token-viz-salt-2025')
    .digest('hex');
  return 'tv_' + hash.substring(0, 29);
}

export function registerUser(email, nickname, organization = null, showOnLeaderboard = false) {
  const db = getDb();
  const emailHash = generateEmailHash(email);
  const apiKey = generateApiKeyFromEmail(email);

  // Check if user already exists by email hash
  const existingUser = db.prepare('SELECT * FROM users WHERE email_hash = ?').get(emailHash);
  if (existingUser) {
    return {
      existing: true,
      apiKey: existingUser.api_key,
      userId: existingUser.id
    };
  }

  // Create new user
  const stmt = db.prepare(`
    INSERT INTO users (api_key, email, email_hash, nickname, organization, show_on_leaderboard)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(apiKey, email, emailHash, nickname, organization, showOnLeaderboard ? 1 : 0);

  return {
    existing: false,
    apiKey,
    userId: result.lastInsertRowid
  };
}

export function getUserById(userId) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId);
}

export function getUserByEmailHash(emailHash) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE email_hash = ?');
  return stmt.get(emailHash);
}

export function updateUserProfile(userId, updates) {
  const db = getDb();
  const allowedFields = ['nickname', 'organization', 'show_email', 'show_nickname', 'show_on_leaderboard'];
  const setClause = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClause.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClause.length === 0) return null;

  values.push(userId);
  const stmt = db.prepare(`
    UPDATE users
    SET ${setClause.join(', ')}
    WHERE id = ?
  `);
  return stmt.run(...values);
}

export function getUserProfile(userId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      id, nickname, email, organization, show_email, show_nickname, show_on_leaderboard,
      created_at, api_key
    FROM users
    WHERE id = ?
  `);
  return stmt.get(userId);
}

function formatEmail(email, showEmail) {
  if (!email) return null;
  if (showEmail) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.charAt(0)}***@${domain}`;
}

export function getLeaderboard(sortBy = 'totalTokens', limit = 100, period = 'all') {
  const db = getDb();

  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';

  // Build WHERE clause for period filtering
  let periodWhere = '';
  if (period === 'week') {
    periodWhere = `AND DATE(ur.bucket_start) >= DATE('now', '-7 days')`;
  } else if (period === 'month') {
    periodWhere = `AND DATE(ur.bucket_start) >= DATE('now', '-30 days')`;
  }

  const stmt = db.prepare(`
    SELECT
      u.id,
      u.nickname,
      u.email,
      u.show_email,
      u.show_nickname,
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost,
      COUNT(DISTINCT DATE(ur.bucket_start)) as days_active
    FROM users u
    LEFT JOIN usage_records ur ON u.id = ur.user_id
    WHERE u.show_on_leaderboard = 1 ${periodWhere}
    GROUP BY u.id
    ORDER BY ${sortColumn} DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit);

  return rows.map((row, index) => ({
    rank: index + 1,
    nickname: row.show_nickname ? row.nickname : null,
    email: row.email ? formatEmail(row.email, row.show_email) : null,
    totalTokens: row.total_tokens,
    totalCost: row.total_cost,
    daysActive: row.days_active
  }));
}

export function getUserRank(userId, sortBy = 'totalTokens') {
  const db = getDb();

  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';

  // Get user's stats
  const userStats = db.prepare(`
    SELECT
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost
    FROM usage_records ur
    WHERE ur.user_id = ?
  `).get(userId);

  // Default rank for users with no data
  if (!userStats || userStats.total_tokens === 0) {
    return {
      rank: null,
      totalTokens: 0,
      totalCost: 0
    };
  }

  // Get rank
  const rankStmt = db.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM users u
    LEFT JOIN usage_records ur ON u.id = ur.user_id
    WHERE u.show_on_leaderboard = 1
    GROUP BY u.id
    HAVING COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) > ?
  `);

  const rankResult = rankStmt.get(userStats.total_tokens);

  return {
    rank: rankResult ? rankResult.rank : 1,
    totalTokens: userStats.total_tokens,
    totalCost: userStats.total_cost
  };
}

export function getOrganizationLeaderboard(organization, sortBy = 'totalTokens', period = 'all') {
  const db = getDb();

  if (!organization) return [];

  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';
  const periodFilter = period === 'all' ? '' :
    period === 'week' ? `AND DATE(ur.bucket_start) >= DATE('now', '-7 days')` :
    `AND DATE(ur.bucket_start) >= DATE('now', '-30 days')`;

  const stmt = db.prepare(`
    SELECT
      u.id,
      u.nickname,
      u.email,
      u.show_email,
      u.show_nickname,
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost,
      COUNT(DISTINCT DATE(ur.bucket_start)) as days_active
    FROM users u
    LEFT JOIN usage_records ur ON u.id = ur.user_id ${periodFilter.replace('AND', 'WHERE')}
    WHERE u.organization = ?
    GROUP BY u.id
    ORDER BY ${sortColumn} DESC
  `);

  const rows = stmt.all(organization);

  return rows.map((row, index) => ({
    rank: index + 1,
    nickname: row.show_nickname ? row.nickname : null,
    email: row.email ? formatEmail(row.email, row.show_email) : null,
    totalTokens: row.total_tokens,
    totalCost: row.total_cost,
    daysActive: row.days_active
  }));
}

export function getUserRankInOrganization(userId, organization, sortBy = 'totalTokens') {
  const db = getDb();

  if (!organization) {
    return { rank: null, totalTokens: 0, totalCost: 0 };
  }

  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';

  // Get user's stats
  const userStats = db.prepare(`
    SELECT
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost
    FROM usage_records ur
    WHERE ur.user_id = ?
  `).get(userId);

  // Default rank for users with no data
  if (!userStats || userStats.total_tokens === 0) {
    return {
      rank: null,
      totalTokens: 0,
      totalCost: 0
    };
  }

  // Get rank within organization
  const rankStmt = db.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM users u
    LEFT JOIN usage_records ur ON u.id = ur.user_id
    WHERE u.organization = ?
    GROUP BY u.id
    HAVING COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) > ?
  `);

  const rankResult = rankStmt.get(organization, userStats.total_tokens);

  return {
    rank: rankResult ? rankResult.rank : 1,
    totalTokens: userStats.total_tokens,
    totalCost: userStats.total_cost
  };
}

// Get leaderboard of organizations (aggregated by organization name)
export function getOrganizationsLeaderboard(sortBy = 'totalTokens', limit = 100, period = 'all') {
  const db = getDb();

  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';
  const periodFilter = period === 'all' ? '' :
    period === 'week' ? `AND DATE(ur.bucket_start) >= DATE('now', '-7 days')` :
    `AND DATE(ur.bucket_start) >= DATE('now', '-30 days')`;

  const stmt = db.prepare(`
    SELECT
      u.organization,
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost,
      COUNT(DISTINCT u.id) as member_count,
      COUNT(DISTINCT DATE(ur.bucket_start)) as days_active
    FROM users u
    LEFT JOIN usage_records ur ON u.id = ur.user_id ${periodFilter.replace('AND', 'WHERE')}
    WHERE u.organization IS NOT NULL AND u.organization != ''
    GROUP BY u.organization
    ORDER BY ${sortColumn} DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit);

  return rows.map((row, index) => ({
    rank: index + 1,
    organization: row.organization,
    memberCount: row.member_count,
    totalTokens: row.total_tokens,
    totalCost: row.total_cost,
    daysActive: row.days_active
  }));
}
