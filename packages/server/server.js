import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { authMiddleware, generateApiKey } from './api/auth.js';
import { handlePush } from './api/push.js';
import { handleStats } from './api/stats.js';
import { handleRegister } from './api/register.js';
import { handleLeaderboard } from './api/leaderboard.js';
import { handleGetProfile, handleUpdateProfile } from './api/profile.js';
import { handleJoinGroup, handleLeaveGroup, handleGetUserGroups } from './api/groups.js';
import { handleCheckEmail } from './api/check-email.js';
import { createUser, closeDb } from './db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Handle SES/Lockdown environment (Vercel/Next.js edge cases)
// Some serverless environments inject lockdown-install.js which can cause issues
// We just log it for now if needed, but usually ignoring it is fine.

// ============================================================================
// SECURITY MIDDLEWARE - Helmet Configuration
// ============================================================================
// Content Security Policy (CSP) controls what resources the browser can load.
//
// IMPORTANT: Dashboard uses ECharts library from CDN for data visualization.
// - CDN: https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js
// - Without this whitelist, dashboard will fail with "echarts is not defined"
//
// If changing CDN or adding external scripts, update scriptSrc whitelist below.
// ============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow scripts from: same origin, inline (EJS templates), and jsDelivr CDN (ECharts)
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase body size limit for large pushes
app.use(express.static(path.join(__dirname, 'public')));

// Favicon handler to prevent 404 logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Dashboard - no auth required, handled by frontend
app.get('/dashboard', (req, res) => {
  res.render('dashboard.ejs');
});

// Public routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/leaderboard', (req, res) => {
  res.render('leaderboard');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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

// Generate new API key (legacy endpoint)
app.post('/api/key', (req, res) => {
  const apiKey = generateApiKey();
  createUser(apiKey);
  res.json({ apiKey });
});

// Dashboard - no auth required, handled by frontend (moved up)

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`Token Visualizer server running on port ${PORT}`);
  });
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    closeDb();
    process.exit(0);
  });
}

export default app;
