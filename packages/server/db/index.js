// import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const isVercel = process.env.VERCEL === '1';
const DB_PATH = process.env.DB_PATH || (isVercel ? '/tmp/data.db' : join(__dirname, 'data.db'));
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

// Database instance holder
let dbInstance = null;
let dbType = 'sqlite'; // 'sqlite' or 'libsql'

/**
 * Initialize and get the database connection
 */
export async function getDb() {
  if (dbInstance) return dbInstance;

  // Check if we should use Turso (LibSQL)
  if (TURSO_URL && TURSO_URL.startsWith('libsql://')) {
    console.log('Connecting to Turso/LibSQL database...');
    dbType = 'libsql';
    dbInstance = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });

    // Initialize schema for Turso if needed (check if users table exists)
    let needSchema = false;
    try {
      await dbInstance.execute('SELECT 1 FROM users LIMIT 1');
    } catch (e) {
      console.log('Initializing Turso schema...');
      needSchema = true;
    }

    // Check if user_groups table exists (for databases created before groups feature)
    try {
      await dbInstance.execute('SELECT 1 FROM user_groups LIMIT 1');
    } catch (e) {
      console.log('Creating user_groups table...');
      needSchema = true;
    }

    // Check if device column exists in usage_records (for databases created before device tracking)
    try {
      await dbInstance.execute('SELECT device FROM usage_records LIMIT 1');
    } catch (e) {
      console.log('Adding device column to usage_records...');
      try {
        await dbInstance.execute('ALTER TABLE usage_records ADD COLUMN device TEXT');
      } catch (alterError) {
        // Column might have been added concurrently
        if (!alterError.message.includes('duplicate column')) {
          console.warn('Warning adding device column:', alterError.message);
        }
      }
    }

    if (needSchema) {
      const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
      // Split schema by semicolon to execute statement by statement
      const statements = schema.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        try {
          await dbInstance.execute(stmt);
        } catch (tableError) {
          // Ignore errors for tables that already exist
          if (!tableError.message.includes('already exists')) {
            console.warn('Schema warning:', tableError.message);
          }
        }
      }
    }
  } else {
    // Fallback to local SQLite
    console.log(`Using local SQLite database at ${DB_PATH}`);
    dbType = 'sqlite';
    const { default: Database } = await import('better-sqlite3');
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');

    // Run schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    dbInstance.exec(schema);
    
    // Run migrations (sync only for better-sqlite3)
    runLocalMigrations(dbInstance);
  }

  return dbInstance;
}

function runLocalMigrations(db) {
  const migrations = [
    'ALTER TABLE users ADD COLUMN email TEXT',
    'ALTER TABLE users ADD COLUMN email_hash TEXT',
    'ALTER TABLE users ADD COLUMN nickname TEXT',
    'ALTER TABLE users ADD COLUMN show_email BOOLEAN DEFAULT 0',
    'ALTER TABLE users ADD COLUMN show_nickname BOOLEAN DEFAULT 1',
    'ALTER TABLE users ADD COLUMN show_on_leaderboard BOOLEAN DEFAULT 0',
    'ALTER TABLE users ADD COLUMN organization TEXT',
    `CREATE TABLE IF NOT EXISTS user_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      group_name TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, group_name)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_user_groups_user ON user_groups(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_name)',
    'ALTER TABLE usage_records ADD COLUMN device TEXT'
  ];

  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch (e) {
      // Ignore errors if column/table already exists
    }
  }
}

export async function closeDb() {
  if (dbInstance) {
    if (dbType === 'sqlite') {
      dbInstance.close();
    } else {
      // LibSQL client doesn't strictly need closing in serverless context but good practice
    }
    dbInstance = null;
  }
}

// ============================================================================
// Database Abstraction Layer (Async Wrapper)
// ============================================================================

/**
 * Execute a query that returns no result (INSERT, UPDATE, DELETE)
 */
async function dbRun(sql, args = []) {
  const db = await getDb();
  if (dbType === 'libsql') {
    await db.execute({ sql, args });
    // LibSQL doesn't return the same structure as better-sqlite3
    return { changes: 1 };
  } else {
    // better-sqlite3
    const stmt = db.prepare(sql);
    return stmt.run(...args);
  }
}

/**
 * Execute a query that returns a single row
 */
async function dbGet(sql, args = []) {
  const db = await getDb();
  if (dbType === 'libsql') {
    const rs = await db.execute({ sql, args });
    return rs.rows[0] || null;
  } else {
    const stmt = db.prepare(sql);
    return stmt.get(...args);
  }
}

/**
 * Execute a query that returns multiple rows
 */
async function dbAll(sql, args = []) {
  const db = await getDb();
  if (dbType === 'libsql') {
    const rs = await db.execute({ sql, args });
    return rs.rows;
  } else {
    const stmt = db.prepare(sql);
    return stmt.all(...args);
  }
}

// ============================================================================
// Domain Logic (Async)
// ============================================================================

// User operations
export async function createUser(apiKey) {
  return await dbRun('INSERT INTO users (api_key) VALUES (?)', [apiKey]);
}

export async function getUserByApiKey(apiKey) {
  return await dbGet('SELECT * FROM users WHERE api_key = ?', [apiKey]);
}

// Usage record operations
export async function insertUsageRecords(userId, records) {
  const db = await getDb();

  // GLM pricing fix - 官网: https://open.bigmodel.cn/pricing
  // 汇率: 1 USD ≈ 7.2 CNY
  const GLM_PRICING = {
    default: { input: 0.69, output: 0.35, cached: 0.04 },
    'glm-5': { input: 0.83, output: 3.1, cached: 0.08 },
    'glm-5-code': { input: 1.11, output: 4.44, cached: 0.11 },
    'glm-4.7': { input: 0.56, output: 2.2, cached: 0.05 },
    'glm-4.7-flashx': { input: 0.07, output: 0.42, cached: 0.005 },
    'glm-4.5': { input: 0.014, output: 0.017, cached: 0.002 },
    'glm-4.5-air': { input: 0.17, output: 1.1, cached: 0.01 },
    'glm-4-plus': { input: 0.69, output: 0.35, cached: 0.04 },
    'glm-4-air': { input: 0.07, output: 0.03, cached: 0.005 },
    'glm-4-flashx': { input: 0.014, output: 0.007, cached: 0.001 },
    'glm-4-flash': { input: 0, output: 0, cached: 0 },
    'glm-4-long': { input: 0.14, output: 0.07, cached: 0.01 },
    'glm-3': { input: 0.01, output: 0.01, cached: 0.002 },
  };
  const GLM_MODELS = ['glm-5', 'glm-4.7', 'glm-4', 'glm-4.6', 'glm-4.5', 'glm-4.5-air', 'glm-4-plus', 'glm-4-air', 'glm-4-flash', 'glm-4-flashx', 'glm-4.7-flashx', 'glm-4-long', 'glm-3', 'glm-5-code'];

  if (dbType === 'libsql') {
    // LibSQL transaction
    const batch = records.map(record => {
      // Recalculate cost for GLM models
      let cost = record.cost?.total || 0;
      if (record.model && GLM_MODELS.some(m => record.model.includes(m))) {
        // Find the specific model pricing
        let pricing = GLM_PRICING.default;
        const modelLower = record.model.toLowerCase();
        for (const [key, value] of Object.entries(GLM_PRICING)) {
          if (key !== 'default' && modelLower.includes(key)) {
            pricing = value;
            break;
          }
        }
        const inputTokens = record.inputTokens || 0;
        const outputTokens = record.outputTokens || 0;
        const cachedTokens = record.cachedInputTokens || 0;
        cost = (inputTokens / 1_000_000) * pricing.input +
              (outputTokens / 1_000_000) * pricing.output +
              (cachedTokens / 1_000_000) * pricing.cached;
      }

      return {
        sql: `
        INSERT INTO usage_records
        (user_id, model, project, input_tokens, output_tokens, cached_tokens, cost, bucket_start, source, device)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        args: [
          userId,
          record.model,
          record.project || null,
          record.inputTokens || 0,
          record.outputTokens || 0,
          record.cachedInputTokens || 0,
          cost,
          record.bucketStart,
          record.source,
          record.device || null
        ]
      };
    });
    return await db.batch(batch);
  } else {
    // better-sqlite3 transaction
    const stmt = db.prepare(`
      INSERT INTO usage_records
      (user_id, model, project, input_tokens, output_tokens, cached_tokens, cost, bucket_start, source, device)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((records) => {
      for (const record of records) {
        // Recalculate cost for GLM models
        let cost = record.cost?.total || 0;
        if (record.model && GLM_MODELS.some(m => record.model.includes(m))) {
          // Find the specific model pricing
          let pricing = GLM_PRICING.default;
          const modelLower = record.model.toLowerCase();
          for (const [key, value] of Object.entries(GLM_PRICING)) {
            if (key !== 'default' && modelLower.includes(key)) {
              pricing = value;
              break;
            }
          }
          const inputTokens = record.inputTokens || 0;
          const outputTokens = record.outputTokens || 0;
          const cachedTokens = record.cachedInputTokens || 0;
          cost = (inputTokens / 1_000_000) * pricing.input +
                (outputTokens / 1_000_000) * pricing.output +
                (cachedTokens / 1_000_000) * pricing.cached;
        }

        stmt.run(
          userId,
          record.model,
          record.project || null,
          record.inputTokens || 0,
          record.outputTokens || 0,
          record.cachedInputTokens || 0,
          cost,
          record.bucketStart,
          record.source,
          record.device || null
        );
      }
    });

    return insertMany(records);
  }
}

export async function getUserStats(userId) {
  const total = await dbGet(`
    SELECT
      SUM(input_tokens + output_tokens + cached_tokens) as total_tokens,
      SUM(cost) as total_cost,
      COUNT(DISTINCT DATE(bucket_start)) as days_active,
      COUNT(DISTINCT model) as model_count
    FROM usage_records
    WHERE user_id = ?
  `, [userId]);

  const byModel = await dbAll(`
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
  `, [userId]);

  const byDay = await dbAll(`
    SELECT
      DATE(bucket_start) as date,
      SUM(input_tokens + output_tokens + cached_tokens) as tokens,
      SUM(cost) as cost,
      COUNT(*) as requests
    FROM usage_records
    WHERE user_id = ?
    GROUP BY DATE(bucket_start)
    ORDER BY date ASC
  `, [userId]);

  const byDayDetail = await dbAll(`
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
  `, [userId]);

  // Try to get byDevice stats - gracefully handle if device column doesn't exist
  let byDevice = [];
  try {
    byDevice = await dbAll(`
      SELECT
        COALESCE(device, 'unknown') as device,
        SUM(input_tokens + output_tokens + cached_tokens) as total_tokens,
        SUM(cost) as cost,
        COUNT(*) as requests
      FROM usage_records
      WHERE user_id = ?
      GROUP BY device
      ORDER BY cost DESC
    `, [userId]);
  } catch (e) {
    // Device column might not exist in older databases
    console.debug('Device stats not available:', e.message);
    byDevice = [];
  }

  return { total, byModel, byDay, byDayDetail, byDevice };
}

export async function cleanupOldData(daysToKeep = 90) {
  return await dbRun(`
    DELETE FROM usage_records
    WHERE bucket_start < datetime('now', '-' || ? || ' days')
  `, [daysToKeep]);
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

export async function registerUser(email, nickname, organization = null, showOnLeaderboard = false) {
  const emailHash = generateEmailHash(email);
  const apiKey = generateApiKeyFromEmail(email);

  // Check if user already exists by email hash
  const existingUser = await dbGet('SELECT * FROM users WHERE email_hash = ?', [emailHash]);
  if (existingUser) {
    return {
      existing: true,
      apiKey: existingUser.api_key,
      userId: existingUser.id
    };
  }

  // Create new user
  await dbRun(`
    INSERT INTO users (api_key, email, email_hash, nickname, organization, show_on_leaderboard)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [apiKey, email, emailHash, nickname, organization, showOnLeaderboard ? 1 : 0]);

  // Get the newly created user by api_key
  const newUser = await dbGet('SELECT id FROM users WHERE api_key = ?', [apiKey]);

  return {
    existing: false,
    apiKey,
    userId: newUser?.id
  };
}

export async function getUserById(userId) {
  return await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
}

export async function getUserByEmailHash(emailHash) {
  return await dbGet('SELECT * FROM users WHERE email_hash = ?', [emailHash]);
}

export async function updateUserProfile(userId, updates) {
  const allowedFields = ['nickname', 'show_email', 'show_nickname', 'show_on_leaderboard'];
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
  return await dbRun(`
    UPDATE users
    SET ${setClause.join(', ')}
    WHERE id = ?
  `, values);
}

export async function getUserProfile(userId) {
  return await dbGet(`
    SELECT
      id, nickname, email, organization, show_email, show_nickname, show_on_leaderboard,
      created_at, api_key
    FROM users
    WHERE id = ?
  `, [userId]);
}

function formatEmail(email, showEmail) {
  if (!email) return null;
  if (showEmail) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.charAt(0)}***@${domain}`;
}

export async function getLeaderboard(sortBy = 'totalTokens', limit = 100, period = 'all') {
  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';

  // Period filter: calculate cutoff date in JS to avoid SQLite timezone issues
  let periodFilter = '';
  if (period === 'week') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    periodFilter = `AND DATE(ur.bucket_start) >= '${cutoffDateStr}'`;
  } else if (period === 'month') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    periodFilter = `AND DATE(ur.bucket_start) >= '${cutoffDateStr}'`;
  }

  const rows = await dbAll(`
    SELECT
      u.id,
      u.nickname,
      u.email,
      u.organization,
      u.show_email,
      u.show_nickname,
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost,
      COUNT(DISTINCT CASE WHEN (ur.input_tokens + ur.output_tokens + ur.cached_tokens) > 0 THEN DATE(ur.bucket_start) END) as days_active
    FROM users u
    LEFT JOIN usage_records ur ON u.id = ur.user_id
    WHERE u.show_on_leaderboard = 1 ${periodFilter}
    GROUP BY u.id
    ORDER BY ${sortColumn} DESC
    LIMIT ?
  `, [limit]);

  return rows.map((row, index) => ({
    rank: index + 1,
    nickname: row.show_nickname ? row.nickname : null,
    email: row.email ? formatEmail(row.email, row.show_email) : null,
    organization: row.organization,
    totalTokens: row.total_tokens,
    totalCost: row.total_cost,
    daysActive: row.days_active
  }));
}

export async function getUserRank(userId, sortBy = 'totalTokens') {
  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';

  // Get user's stats
  const userStats = await dbGet(`
    SELECT
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost
    FROM usage_records ur
    WHERE ur.user_id = ?
  `, [userId]);

  // Default rank for users with no data
  if (!userStats || userStats.total_tokens === 0) {
    return {
      rank: null,
      totalTokens: 0,
      totalCost: 0
    };
  }

  // Get rank
  const rankResult = await dbGet(`
    SELECT COUNT(*) + 1 as rank
    FROM users u
    LEFT JOIN usage_records ur ON u.id = ur.user_id
    WHERE u.show_on_leaderboard = 1
    GROUP BY u.id
    HAVING COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) > ?
  `, [userStats.total_tokens]);

  return {
    rank: rankResult ? rankResult.rank : 1,
    totalTokens: userStats.total_tokens,
    totalCost: userStats.total_cost
  };
}

// Group management functions
export async function getUserGroups(userId) {
  const rows = await dbAll('SELECT group_name FROM user_groups WHERE user_id = ? ORDER BY group_name', [userId]);
  return rows.map(r => r.group_name);
}

export async function addUserToGroup(userId, groupName) {
  return await dbRun('INSERT OR IGNORE INTO user_groups (user_id, group_name) VALUES (?, ?)', [userId, groupName]);
}

export async function removeUserFromGroup(userId, groupName) {
  return await dbRun('DELETE FROM user_groups WHERE user_id = ? AND group_name = ?', [userId, groupName]);
}

export async function getGroupLeaderboard(groupName, sortBy = 'totalTokens', period = 'all') {
  const sortColumn = sortBy === 'totalCost' ? 'total_cost' : 'total_tokens';

  // Period filter: calculate cutoff date in JS to avoid SQLite timezone issues
  let periodFilter = '';
  if (period === 'week') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    periodFilter = `AND DATE(ur.bucket_start) >= '${cutoffDateStr}'`;
  } else if (period === 'month') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    periodFilter = `AND DATE(ur.bucket_start) >= '${cutoffDateStr}'`;
  }

  const rows = await dbAll(`
    SELECT
      u.id,
      u.nickname,
      u.email,
      u.show_email,
      u.show_nickname,
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost,
      COUNT(DISTINCT CASE WHEN (ur.input_tokens + ur.output_tokens + ur.cached_tokens) > 0 THEN DATE(ur.bucket_start) END) as days_active
    FROM users u
    INNER JOIN user_groups ug ON u.id = ug.user_id
    LEFT JOIN usage_records ur ON u.id = ur.user_id
    WHERE ug.group_name = ? ${periodFilter}
    GROUP BY u.id
    ORDER BY ${sortColumn} DESC
  `, [groupName]);

  return rows.map((row, index) => ({
    rank: index + 1,
    nickname: row.show_nickname ? row.nickname : null,
    email: row.email ? formatEmail(row.email, row.show_email) : null,
    organization: groupName,
    totalTokens: row.total_tokens,
    totalCost: row.total_cost,
    daysActive: row.days_active
  }));
}

export async function getUserRankInGroup(userId, groupName, sortBy = 'totalTokens') {
  // Get user's stats
  const userStats = await dbGet(`
    SELECT
      COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) as total_tokens,
      COALESCE(SUM(ur.cost), 0) as total_cost
    FROM usage_records ur
    WHERE ur.user_id = ?
  `, [userId]);

  if (!userStats || userStats.total_tokens === 0) {
    return {
      rank: null,
      totalTokens: 0,
      totalCost: 0
    };
  }

  // Get rank within group
  const rankResult = await dbGet(`
    SELECT COUNT(*) + 1 as rank
    FROM users u
    INNER JOIN user_groups ug ON u.id = ug.user_id
    LEFT JOIN usage_records ur ON u.id = ur.user_id
    WHERE ug.group_name = ?
    GROUP BY u.id
    HAVING COALESCE(SUM(ur.input_tokens + ur.output_tokens + ur.cached_tokens), 0) > ?
  `, [groupName, userStats.total_tokens]);

  return {
    rank: rankResult ? rankResult.rank : 1,
    totalTokens: userStats.total_tokens,
    totalCost: userStats.total_cost
  };
}
