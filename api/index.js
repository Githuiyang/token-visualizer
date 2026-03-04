/**
 * Vercel Serverless Function Entry Point
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import API handlers
import { authMiddleware, generateApiKey } from '../packages/server/api/auth.js';
import { handlePush } from '../packages/server/api/push.js';
import { handleStats } from '../packages/server/api/stats.js';
import { handleRegister } from '../packages/server/api/register.js';
import { handleLeaderboard } from '../packages/server/api/leaderboard.js';
import { handleGetProfile, handleUpdateProfile } from '../packages/server/api/profile.js';
import { handleJoinGroup, handleLeaveGroup, handleGetUserGroups } from '../packages/server/api/groups.js';
import { handleCheckEmail } from '../packages/server/api/check-email.js';
import { createUser, closeDb } from '../packages/server/db/index.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '../packages/server/public')));

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// View engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, '../packages/server/views'));

// Routes
app.get('/dashboard', (req, res) => res.render('dashboard.ejs'));
app.get('/', (req, res) => res.render('index'));
app.get('/leaderboard', (req, res) => res.render('leaderboard'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.get('/api/check-email', handleCheckEmail);
app.post('/api/push', authMiddleware, handlePush);
app.get('/api/stats', authMiddleware, handleStats);
app.post('/api/register', handleRegister);
app.get('/api/leaderboard', handleLeaderboard);
app.get('/api/profile', authMiddleware, handleGetProfile);
app.patch('/api/profile', authMiddleware, handleUpdateProfile);
app.post('/api/groups/join', authMiddleware, handleJoinGroup);
app.post('/api/groups/leave', authMiddleware, handleLeaveGroup);
app.get('/api/groups', authMiddleware, handleGetUserGroups);

// Debug endpoint to check user data
app.get('/api/debug-user', async (req, res) => {
  try {
    const nickname = req.query.nickname;
    const { getUserStats, getUserByApiKey } = await import('../packages/server/db/index.js');

    // First get user by nickname - need to query directly
    const db = await import('../packages/server/db/index.js');
    const dbInstance = await db.getDb();

    // Execute raw queries
    let userResult;
    if (dbInstance.execute) {
      // LibSQL
      const rs = await dbInstance.execute({ sql: 'SELECT * FROM users WHERE nickname = ?', args: [nickname] });
      userResult = rs.rows[0];
    } else {
      // better-sqlite3
      const stmt = dbInstance.prepare('SELECT * FROM users WHERE nickname = ?');
      userResult = stmt.get(nickname);
    }

    if (!userResult) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get model breakdown
    let modelResult;
    if (dbInstance.execute) {
      const rs = await dbInstance.execute({
        sql: `SELECT model, SUM(input_tokens + output_tokens + cached_tokens) as tokens, SUM(cost) as cost
              FROM usage_records WHERE user_id = ? GROUP BY model ORDER BY cost DESC`,
        args: [userResult.id]
      });
      modelResult = rs.rows;
    } else {
      const stmt = dbInstance.prepare(`SELECT model, SUM(input_tokens + output_tokens + cached_tokens) as tokens, SUM(cost) as cost
              FROM usage_records WHERE user_id = ? GROUP BY model ORDER BY cost DESC`);
      modelResult = stmt.all(userResult.id);
    }

    res.json({
      nickname,
      models: modelResult.map(m => ({
        model: m.model,
        tokens: m.tokens,
        cost: m.cost
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack?.split('\n')?.slice(0, 5) });
  }
});

// Debug endpoint to check database connection
app.get('/api/debug-db', async (req, res) => {
  try {
    const { getDb } = await import('../packages/server/db/index.js');
    const db = await getDb();
    res.json({
      status: 'ok',
      dbType: typeof db,
      message: 'Database connection successful'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      stack: err.stack?.split('\n')?.slice(0, 5)
    });
  }
});

app.post('/api/key', (req, res) => {
  const apiKey = generateApiKey();
  createUser(apiKey);
  res.json({ apiKey });
});

// Admin endpoint to completely reset a user's data
app.post('/api/admin/reset-user', async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname) {
      return res.status(400).json({ error: 'nickname is required' });
    }

    const db = await import('../packages/server/db/index.js');
    const dbInstance = await db.getDb();

    // Get user by nickname
    let user;
    if (dbInstance.execute) {
      const rs = await dbInstance.execute({ sql: 'SELECT * FROM users WHERE nickname = ?', args: [nickname] });
      user = rs.rows[0];
    } else {
      const stmt = dbInstance.prepare('SELECT * FROM users WHERE nickname = ?');
      user = stmt.get(nickname);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete usage_records (CASCADE should handle this, but let's be explicit)
    if (dbInstance.execute) {
      await dbInstance.execute({ sql: 'DELETE FROM usage_records WHERE user_id = ?', args: [user.id] });
      await dbInstance.execute({ sql: 'DELETE FROM user_groups WHERE user_id = ?', args: [user.id] });
      await dbInstance.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [user.id] });
    } else {
      const stmt1 = dbInstance.prepare('DELETE FROM usage_records WHERE user_id = ?');
      stmt1.run(user.id);
      const stmt2 = dbInstance.prepare('DELETE FROM user_groups WHERE user_id = ?');
      stmt2.run(user.id);
      const stmt3 = dbInstance.prepare('DELETE FROM users WHERE id = ?');
      stmt3.run(user.id);
    }

    res.json({
      success: true,
      message: `User ${nickname} (ID: ${user.id}) has been completely reset. Please re-register.`
    });
  } catch (err) {
    console.error('Reset user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to recalculate GLM costs (fix pricing bug)
app.post('/api/admin/recalculate-glm', async (req, res) => {
  try {
    const db = await import('../packages/server/db/index.js');
    const dbInstance = await db.getDb();

    // Get all GLM usage records
    let records;
    if (dbInstance.execute) {
      const rs = await dbInstance.execute({
        sql: `SELECT id, model, input_tokens, output_tokens, cached_tokens
              FROM usage_records
              WHERE model LIKE 'glm%'
              AND (input_tokens + output_tokens + cached_tokens) > 0`,
        args: []
      });
      records = rs.rows;
    } else {
      const stmt = dbInstance.prepare(`SELECT id, model, input_tokens, output_tokens, cached_tokens
              FROM usage_records
              WHERE model LIKE 'glm%'
              AND (input_tokens + output_tokens + cached_tokens) > 0`);
      records = stmt.all();
    }

    // New GLM pricing: 0.07 USD/M for input/output, 0.014 USD/M for cached
    const NEW_PRICING = { input: 0.07, output: 0.07, cached: 0.014 };

    let updated = 0;
    for (const record of records) {
      const inputCost = (record.input_tokens / 1_000_000) * NEW_PRICING.input;
      const outputCost = (record.output_tokens / 1_000_000) * NEW_PRICING.output;
      const cachedCost = (record.cached_tokens / 1_000_000) * NEW_PRICING.cached;
      const newCost = inputCost + outputCost + cachedCost;

      if (dbInstance.execute) {
        await dbInstance.execute({
          sql: 'UPDATE usage_records SET cost = ? WHERE id = ?',
          args: [newCost, record.id]
        });
      } else {
        const stmt = dbInstance.prepare('UPDATE usage_records SET cost = ? WHERE id = ?');
        stmt.run(newCost, record.id);
      }
      updated++;
    }

    res.json({
      success: true,
      updated,
      message: `Updated ${updated} GLM records with corrected pricing`
    });
  } catch (err) {
    console.error('Recalculate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export for Vercel
export default app;
