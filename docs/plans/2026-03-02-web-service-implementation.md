# Token Visualizer Web Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a web service to Token Visualizer that allows uploading usage data via CLI and viewing visualizations in a browser.

**Architecture:** Monorepo with packages/cli (existing) and packages/server (new). Server uses Express + SQLite with EJS templates for server-rendered dashboards. CLI adds a `push` command to upload parsed data.

**Tech Stack:** Node.js, Express, better-sqlite3, EJS, ECharts

---

## Task 1: Restructure project as monorepo

**Files:**
- Create: `packages/cli/package.json`
- Move: `bin/*`, `src/*`, `package.json` → `packages/cli/`
- Create: `package.json` (root monorepo config)
- Create: `packages/server/package.json`

**Step 1: Create packages directory structure**

```bash
cd ~/Projects/token-visualizer
mkdir -p packages/cli packages/server
```

**Step 2: Move existing CLI files**

```bash
mv bin src package.json packages/cli/
mv node_modules packages/cli/
```

**Step 3: Create root package.json**

```bash
cat > package.json << 'EOF'
{
  "name": "token-visualizer-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=packages/server",
    "push": "npm run push --workspace=packages/cli"
  }
}
EOF
```

**Step 4: Update packages/cli/package.json**

Add to existing `packages/cli/package.json`:

```json
{
  "name": "@token-viz/cli",
  "version": "0.2.0",
  "scripts": {
    "generate": "node bin/token-viz.js generate",
    "push": "node bin/token-viz.js push"
  }
}
```

**Step 5: Create packages/server/package.json**

```bash
cat > packages/server/package.json << 'EOF'
{
  "name": "@token-viz/server",
  "version": "0.1.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "better-sqlite3": "^9.2.2",
    "dotenv": "^16.3.1"
  }
}
EOF
```

**Step 6: Install dependencies**

```bash
npm install
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: restructure as monorepo with packages/cli and packages/server"
```

---

## Task 2: Create SQLite database module

**Files:**
- Create: `packages/server/db/schema.sql`
- Create: `packages/server/db/index.js`

**Step 1: Write schema.sql**

Create `packages/server/db/schema.sql`:

```sql
-- Users table (stores API keys)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage records table
CREATE TABLE IF NOT EXISTS usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  model TEXT NOT NULL,
  project TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cached_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  bucket_start DATETIME NOT NULL,
  source TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_bucket
  ON usage_records(user_id, bucket_start);
```

**Step 2: Write database module**

Create `packages/server/db/index.js`:

```javascript
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
```

**Step 3: Create data directory .gitkeep**

```bash
mkdir -p packages/server/db && touch packages/server/db/.gitkeep
```

**Step 4: Commit**

```bash
git add packages/server/
git commit -m "feat: add SQLite database module with schema and CRUD operations"
```

---

## Task 3: Create Express server with API routes

**Files:**
- Create: `packages/server/server.js`
- Create: `packages/server/api/push.js`
- Create: `packages/server/api/auth.js`

**Step 1: Write auth middleware**

Create `packages/server/api/auth.js`:

```javascript
import { getUserByApiKey } from '../db/index.js';
import { text } from 'express';

export function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const user = getUserByApiKey(apiKey);

  if (!user) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  req.user = user;
  next();
}

export function generateApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'tv_';
  for (let i = 0; i < 29; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}
```

**Step 2: Write push API route**

Create `packages/server/api/push.js`:

```javascript
import { insertUsageRecords } from '../db/index.js';

export async function handlePush(req, res) {
  const { records } = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'records must be an array' });
  }

  if (records.length === 0) {
    return res.status(400).json({ error: 'records cannot be empty' });
  }

  // Validate record structure
  for (const record of records) {
    if (!record.model || !record.bucketStart || !record.source) {
      return res.status(400).json({
        error: 'Each record must have model, bucketStart, and source'
      });
    }
  }

  try {
    insertUsageRecords(req.user.id, records);

    res.json({
      success: true,
      processed: records.length,
      message: `Successfully uploaded ${records.length} records`
    });
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ error: 'Failed to store records' });
  }
}
```

**Step 3: Write stats API route**

Create `packages/server/api/stats.js`:

```javascript
import { getUserStats } from '../db/index.js';

export function handleStats(req, res) {
  const stats = getUserStats(req.user.id);

  res.json({
    success: true,
    data: stats
  });
}
```

**Step 4: Write main server file**

Create `packages/server/server.js`:

```javascript
import express from 'express';
import { authMiddleware, generateApiKey } from './api/auth.js';
import { handlePush } from './api/push.js';
import { handleStats } from './api/stats.js';
import { closeDb } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API routes
app.post('/api/push', authMiddleware, handlePush);
app.get('/api/stats', authMiddleware, handleStats);

// Generate new API key
app.post('/api/key', (req, res) => {
  const apiKey = generateApiKey();
  const { createUser } = await import('./db/index.js');
  createUser(apiKey);
  res.json({ apiKey });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Dashboard (will add EJS in next task)
app.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ message: 'Dashboard coming soon' });
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
```

**Step 5: Test server starts**

```bash
cd packages/server && npm start
```

Expected output: `Token Visualizer server running on port 3000`

**Step 6: Commit**

```bash
git add packages/server/
git commit -m "feat: add Express server with push and stats API endpoints"
```

---

## Task 4: Add CLI push command

**Files:**
- Modify: `packages/cli/bin/token-viz.js`

**Step 1: Add push command to CLI**

Add to `packages/cli/bin/token-viz.js` before `program.parse()`:

```javascript
program
  .command('push')
  .description('Upload usage data to web server')
  .option('-k, --api-key <key>', 'API key for authentication')
  .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    console.log(chalk.cyan('Token Visualizer - Uploading data...\n'));

    // Get API key
    let apiKey = options.apiKey;
    if (!apiKey) {
      // Try to read from config file
      try {
        const configPath = join(homedir(), '.token-visualizer', 'config.json');
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        apiKey = config.apiKey;
      } catch {}
    }

    if (!apiKey) {
      console.error(chalk.red('Error: API key required. Use --api-key or set it in config.'));
      console.log(chalk.dim('Generate one at: ') + options.server + '/api/key');
      process.exit(1);
    }

    try {
      // Parse data
      const buckets = await parseAll();

      if (buckets.length === 0) {
        console.warn(chalk.yellow('No usage data found.'));
        return;
      }

      // Filter by date
      let filteredBuckets = buckets;
      if (options.from || options.to) {
        const fromDate = options.from ? new Date(options.from) : new Date(-8640000000000000);
        const toDate = options.to ? new Date(options.to) : new Date();
        filteredBuckets = buckets.filter(b => {
          const date = new Date(b.bucketStart);
          return date >= fromDate && date <= toDate;
        });
      }

      // Upload to server
      const serverUrl = options.server.replace(/\/$/, '');
      const response = await fetch(`${serverUrl}/api/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ records: filteredBuckets }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log(chalk.green(`✓ ${result.message}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
```

**Step 2: Add required imports**

Ensure these are at the top of `packages/cli/bin/token-viz.js`:

```javascript
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
```

**Step 3: Test push command**

```bash
# First generate an API key
curl -X POST http://localhost:3000/api/key

# Then push (replace with actual key)
cd packages/cli
node bin/token-viz.js push --api-key tv_xxxxx --server http://localhost:3000
```

**Step 4: Commit**

```bash
git add packages/cli/
git commit -m "feat: add push command to CLI for uploading data to server"
```

---

## Task 5: Create dashboard web page

**Files:**
- Create: `packages/server/views/dashboard.ejs`
- Create: `packages/server/public/css/dashboard.css`
- Modify: `packages/server/server.js`

**Step 1: Install EJS**

```bash
npm install --workspace=packages/server ejs
```

**Step 2: Create dashboard template**

Create `packages/server/views/dashboard.ejs`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Token Visualizer - Dashboard</title>
  <link rel="stylesheet" href="/css/dashboard.css">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <h1>AI Token Usage</h1>
      <div class="stats-summary">
        <div class="stat">
          <span class="label">Total Tokens</span>
          <span class="value" id="total-tokens">-</span>
        </div>
        <div class="stat">
          <span class="label">Total Cost</span>
          <span class="value" id="total-cost">-</span>
        </div>
        <div class="stat">
          <span class="label">Days Active</span>
          <span class="value" id="days-active">-</span>
        </div>
        <div class="stat">
          <span class="label">Models</span>
          <span class="value" id="model-count">-</span>
        </div>
      </div>
    </header>

    <main>
      <section class="chart-section">
        <h2>Cost by Model</h2>
        <div id="pie-chart" class="chart"></div>
      </section>

      <section class="chart-section">
        <h2>Daily Token Usage</h2>
        <div id="line-chart" class="chart"></div>
      </section>

      <section class="chart-section full-width">
        <h2>Activity Heatmap</h2>
        <div id="heatmap" class="chart heatmap"></div>
      </section>
    </main>
  </div>

  <script src="/js/dashboard.js"></script>
</body>
</html>
```

**Step 3: Create dashboard CSS**

Create `packages/server/public/css/dashboard.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --text-primary: #c9d1d9;
  --text-muted: #8b949e;
  --border: #30363d;
  --green: #238636;
  --green-glow: #3fb950;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

header {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
}

header h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat .value {
  font-size: 20px;
  font-weight: 600;
}

main {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border);
}

.chart-section.full-width {
  grid-column: 1 / -1;
}

.chart-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
}

.chart {
  height: 300px;
}

.chart.heatmap {
  height: 200px;
}

@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  main {
    grid-template-columns: 1fr;
  }
}
```

**Step 4: Create dashboard JavaScript**

Create `packages/server/public/js/dashboard.js`:

```javascript
const API_KEY = localStorage.getItem('tokenVizApiKey') || prompt('Enter your API key:');
if (API_KEY) localStorage.setItem('tokenVizApiKey', API_KEY);

async function loadStats() {
  const response = await fetch('/api/stats', {
    headers: { 'X-API-Key': API_KEY }
  });

  if (!response.ok) {
    alert('Failed to load stats. Check your API key.');
    return;
  }

  const { data } = await response.json();
  return data;
}

function formatTokens(tokens) {
  if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
  if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
  return tokens.toString();
}

function formatCost(cost) {
  return '$' + cost.toFixed(2);
}

function renderPieChart(byModel) {
  const chart = echarts.init(document.getElementById('pie-chart'));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: '{b}: ${c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '55%'],
      data: byModel.map((m, i) => ({
        value: m.cost,
        name: m.model,
        itemStyle: {
          color: ['#238636', '#58a6ff', '#bc8cff', '#d29922', '#f85149'][i % 5]
        }
      })),
      label: { show: false }
    }]
  };

  chart.setOption(option);
}

function renderLineChart(byDay) {
  const chart = echarts.init(document.getElementById('line-chart'));

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: byDay.map(d => d.date),
      axisLine: { lineStyle: { color: '#30363d' } },
      axisLabel: { color: '#8b949e' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#30363d' } },
      axisLabel: { color: '#8b949e', formatter: formatTokens },
      splitLine: { lineStyle: { color: '#30363d', type: 'dashed' } }
    },
    series: [{
      type: 'line',
      data: byDay.map(d => d.tokens),
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(35, 134, 54, 0.3)' },
          { offset: 1, color: 'rgba(35, 134, 54, 0)' }
        ])
      },
      lineStyle: { color: '#238636' },
      itemStyle: { color: '#238636' }
    }]
  };

  chart.setOption(option);
}

function renderHeatmap(byDay) {
  const container = document.getElementById('heatmap');
  const maxTokens = Math.max(...byDay.map(d => d.tokens));

  const grid = document.createElement('div');
  grid.style.cssText = 'display: flex; gap: 3px; overflow-x: auto; padding: 10px 0;';

  const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

  byDay.forEach(day => {
    const cell = document.createElement('div');
    const normalized = day.tokens / maxTokens;
    let level = 0;
    if (normalized > 0) level = 1;
    if (normalized > 0.25) level = 2;
    if (normalized > 0.5) level = 3;
    if (normalized > 0.75) level = 4;

    cell.style.cssText = `
      width: 14px; height: 14px; border-radius: 2px;
      background: ${colors[level]};
      flex-shrink: 0;
      cursor: pointer;
    `;
    cell.title = `${day.date}: ${formatTokens(day.tokens)} · $${day.cost.toFixed(2)}`;

    grid.appendChild(cell);
  });

  container.appendChild(grid);
}

async function init() {
  const stats = await loadStats();

  // Update summary
  document.getElementById('total-tokens').textContent = formatTokens(stats.total.total_tokens);
  document.getElementById('total-cost').textContent = formatCost(stats.total.total_cost);
  document.getElementById('days-active').textContent = stats.total.days_active;
  document.getElementById('model-count').textContent = stats.total.model_count;

  // Render charts
  renderPieChart(stats.byModel);
  renderLineChart(stats.byDay);
  renderHeatmap(stats.byDay);
}

init();
```

**Step 5: Update server to serve dashboard**

Modify `packages/server/server.js`, add EJS setup and dashboard route:

```javascript
// Add after existing imports
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Add after app.use(express.json())
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Replace the existing dashboard route
app.get('/dashboard', authMiddleware, (req, res) => {
  res.render('dashboard', { user: req.user });
});
```

**Step 6: Commit**

```bash
git add packages/server/
git commit -m "feat: add dashboard web page with ECharts visualizations"
```

---

## Task 6: Add config file support for API key

**Files:**
- Modify: `packages/cli/bin/token-viz.js`
- Create: `packages/cli/src/config.js`

**Step 1: Create config module**

Create `packages/cli/src/config.js`:

```javascript
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = join(homedir(), '.token-visualizer');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveConfig(config) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getApiKey() {
  const config = loadConfig();
  return config.apiKey;
}

export function setApiKey(apiKey, serverUrl) {
  const config = loadConfig();
  config.apiKey = apiKey;
  if (serverUrl) config.serverUrl = serverUrl;
  saveConfig(config);
}

export function getServerUrl() {
  const config = loadConfig();
  return config.serverUrl || 'http://localhost:3000';
}
```

**Step 2: Add config command to CLI**

Add to `packages/cli/bin/token-viz.js`:

```javascript
import { loadConfig, saveConfig, getApiKey, setApiKey, getServerUrl } from '../src/config.js';

program
  .command('config')
  .description('Manage configuration')
  .option('--set-key <key>', 'Set API key')
  .option('--set-server <url>', 'Set server URL')
  .option('--show', 'Show current configuration')
  .action((options) => {
    const config = loadConfig();

    if (options.setKey) {
      setApiKey(options.setKey, options.setServer || config.serverUrl);
      console.log(chalk.green('✓ API key saved'));
    }

    if (options.setServer) {
      config.serverUrl = options.setServer;
      saveConfig(config);
      console.log(chalk.green('✓ Server URL saved'));
    }

    if (options.show || (!options.setKey && !options.setServer)) {
      console.log(chalk.bold('Current configuration:'));
      console.log(`  Server: ${chalk.cyan(config.serverUrl || 'not set')}`);
      console.log(`  API Key: ${chalk.cyan(config.apiKey ? '***' + config.apiKey.slice(-4) : 'not set')}`);
    }
  });
```

**Step 3: Update push command to use config**

Modify the push command in `packages/cli/bin/token-viz.js`:

```javascript
// Replace the API key fetching logic:
let apiKey = options.apiKey || getApiKey();
let serverUrl = options.server;

if (!serverUrl) {
  serverUrl = getServerUrl();
}

if (!apiKey) {
  console.error(chalk.red('Error: API key required. Use:'));
  console.log(chalk.dim('  token-viz config --set-key YOUR_KEY'));
  console.log(chalk.dim('  token-viz push --api-key YOUR_KEY'));
  process.exit(1);
}
```

**Step 4: Test config flow**

```bash
# Set config
cd packages/cli
node bin/token-viz.js config --set-key tv_test123 --set-server http://localhost:3000

# Show config
node bin/token-viz.js config --show

# Push without flags
node bin/token-viz.js push
```

**Step 5: Commit**

```bash
git add packages/cli/
git commit -m "feat: add config command for persistent API key and server settings"
```

---

## Task 7: Add README and documentation

**Files:**
- Update: `README.md`
- Create: `packages/server/README.md`
- Create: `packages/cli/README.md`

**Step 1: Update main README**

Update `README.md`:

```markdown
# Token Visualizer

AI token usage visualization tool with web dashboard.

## Quick Start

### 1. Install

\`\`\`bash
npm install
\`\`\`

### 2. Start the server

\`\`\`bash
npm run dev
\`\`\`

Server runs on http://localhost:3000

### 3. Generate API key

\`\`\`bash
curl -X POST http://localhost:3000/api/key
\`\`\`

### 4. Configure CLI

\`\`\`bash
npm run push -- config --set-key YOUR_API_KEY
\`\`\`

### 5. Upload data

\`\`\`bash
npm run push
\`\`\`

### 6. View dashboard

Open http://localhost:3000/dashboard in your browser.

## Packages

- **@token-viz/cli** - Command-line tool for parsing and uploading usage data
- **@token-viz/server** - Web server with dashboard and API

## Data Sources

- Claude Code: `~/.claude/code/projects/`
- OpenClaw: `~/.openclaw/agents/*/sessions/*.jsonl`
```

**Step 2: Create server README**

Create `packages/server/README.md`:

```markdown
# @token-viz/server

Web server for Token Visualizer with dashboard and API.

## Environment

- `PORT` - Server port (default: 3000)

## API

### POST /api/push

Upload usage data.

Headers:
- `X-API-Key`: Your API key

Body:
\`\`\`json
{
  "records": [
    {
      "model": "claude-3-opus",
      "bucketStart": "2026-03-02T00:00:00.000Z",
      "source": "claude-code",
      "inputTokens": 1000,
      "outputTokens": 500,
      "cachedInputTokens": 0,
      "cost": { "total": 0.03 }
    }
  ]
}
\`\`\`

### GET /api/stats

Get usage statistics.

Headers:
- `X-API-Key`: Your API key

### POST /api/key

Generate a new API key.

### GET /dashboard

Web dashboard (requires API key in localStorage or query param).
```

**Step 3: Create CLI README**

Create `packages/cli/README.md`:

```markdown
# @token-viz/cli

CLI tool for Token Visualizer.

## Commands

### token-viz generate

Generate a PNG visualization.

\`\`\`bash
token-viz generate -o usage.png
\`\`\`

### token-viz push

Upload usage data to server.

\`\`\`bash
token-viz push --api-key KEY --server http://localhost:3000
\`\`\`

Or use saved config:

\`\`\`bash
token-viz config --set-key KEY --set-server URL
token-viz push
\`\`\`

### token-viz config

Manage configuration.

\`\`\`bash
token-viz config --set-key YOUR_KEY
token-viz config --set-server http://localhost:3000
token-viz config --show
\`\`\`

### token-viz stats

Show statistics without uploading.

\`\`\`bash
token-viz stats
\`\`\`
```

**Step 4: Commit**

```bash
git add README.md packages/*/README.md
git commit -m "docs: add comprehensive README for monorepo packages"
```

---

## Task 8: Test end-to-end

**Step 1: Clean reinstall**

```bash
cd ~/Projects/token-visualizer
rm -rf node_modules packages/*/node_modules
npm install
```

**Step 2: Start server**

Terminal 1:
```bash
cd packages/server && npm start
```

**Step 3: Generate API key**

Terminal 2:
```bash
curl -X POST http://localhost:3000/api/key
```

**Step 4: Configure and push**

```bash
cd packages/cli
node bin/token-viz.js config --set-key YOUR_KEY --set-server http://localhost:3000
node bin/token-viz.js push
```

**Step 5: Open dashboard**

Browser: http://localhost:3000/dashboard

Enter API key when prompted.

**Step 6: Verify visualizations**

- [ ] Summary stats display correctly
- [ ] Pie chart shows model distribution
- [ ] Line chart shows daily trend
- [ ] Heatmap displays activity

**Step 7: Final commit**

```bash
git add .
git commit -m "test: verify end-to-end flow works correctly"
```

---

## Summary

This plan creates a complete web service for Token Visualizer:

1. **Monorepo structure** with separate CLI and Server packages
2. **SQLite database** for storing usage records
3. **Express API** with authentication and data upload
4. **CLI push command** for uploading data
5. **Web dashboard** with ECharts visualizations
6. **Config management** for persistent settings

Total estimated time: 2-3 hours
