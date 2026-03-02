import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { authMiddleware, generateApiKey } from './api/auth.js';
import { handlePush } from './api/push.js';
import { handleStats } from './api/stats.js';
import { createUser, closeDb } from './db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API routes
app.post('/api/push', authMiddleware, handlePush);
app.get('/api/stats', authMiddleware, handleStats);

// Generate new API key
app.post('/api/key', (req, res) => {
  const apiKey = generateApiKey();
  createUser(apiKey);
  res.json({ apiKey });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Dashboard - no auth required, handled by frontend
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

// Start server
app.listen(PORT, () => {
  console.log(`Token Visualizer server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  closeDb();
  process.exit(0);
});
