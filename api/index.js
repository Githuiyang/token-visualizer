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
app.get('/api/debug-date', async (req, res) => {
  // Debug endpoint to check date calculations
  const days = 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  // Test SQLite date function
  const { getDb } = await import('../packages/server/db/index.js');
  const db = await getDb();
  const sqliteDate = db.get("SELECT DATE('now') as today, DATE('now', '-7 days') as week_ago").get();

  res.json({
    local: { today: new Date().toISOString().split('T')[0], cutoff: cutoffDateStr },
    sqlite: sqliteDate,
    usage: 'Debug endpoint'
  });
});

app.post('/api/key', (req, res) => {
  const apiKey = generateApiKey();
  createUser(apiKey);
  res.json({ apiKey });
});

// Export for Vercel
export default app;
