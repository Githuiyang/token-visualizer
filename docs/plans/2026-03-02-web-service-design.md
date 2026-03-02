# Token Visualizer Web Service Design

**Date**: 2026-03-02
**Author**: huiyang
**Status**: Approved

## Overview

Add a web service component to Token Visualizer, allowing users to upload usage data via CLI and view visualizations in a browser.

## Requirements

| Dimension | Choice |
|-----------|--------|
| Deployment | Self-hosted |
| Access Control | Private (per-user) |
| Upload Method | CLI direct upload |
| Visualizations | Heatmap, Pie Chart, Line Chart, Share Card |

## Architecture

```
┌─────────────┐     HTTPS POST      ┌──────────────┐
│   CLI       │ ──────────────────> │  Web Server  │
│  (客户端)    │    /api/push       │   (Express)  │
└─────────────┘                     └──────────────┘
                                              │
                                              ▼
                                        ┌──────────────┐
                                        │   SQLite     │
                                        │  (数据库)     │
                                        └──────────────┘

┌─────────────┐     HTTPS GET       ┌──────────────┐
│  浏览器      │ ──────────────────> │  Web Server  │
│             │    /dashboard       │              │
└─────────────┘                     └──────────────┘
                                              │
                                              ▼
                                        ┌──────────────┐
                                        │   EJS 模板    │
                                        │  (渲染页面)   │
                                        └──────────────┘
```

## Directory Structure

```
token-visualizer/
├── packages/
│   ├── cli/              # Existing CLI tool
│   │   ├── bin/
│   │   └── src/
│   │
│   └── server/           # New web service
│       ├── server.js     # Express main entry
│       ├── db/           # SQLite database
│       │   ├── schema.sql
│       │   └── index.js
│       ├── api/          # API routes
│       │   ├── push.js   # Receive data uploads
│       │   └── auth.js   # Auth middleware
│       ├── views/        # EJS templates
│       │   ├── dashboard.ejs
│       │   └── charts.ejs
│       └── public/       # Static assets
│           └── css/
└── package.json
```

## Database Schema

```sql
-- users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- usage_records table
CREATE TABLE usage_records (
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

-- indexes
CREATE INDEX idx_user_bucket ON usage_records(user_id, bucket_start);
```

## API Design

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/push` | POST | Upload usage data (requires API Key) |
| `/api/stats` | GET | Get statistics (requires auth) |
| `/api/chart-data` | GET | Get chart data (requires auth) |
| `/dashboard` | GET | Web dashboard page (requires login) |
| `/api/share/:id` | GET | Public shared card |

## CLI Changes

Add `push` command:

```bash
token-viz push --api-key sk_xxxxx --server https://your-domain.com
```

## Security

1. **API Key**: 32-character random string
2. **HTTPS**: Required in production
3. **Rate Limiting**: Prevent abuse
4. **Data Cleanup**: Auto-delete data older than 90 days

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite + better-sqlite3
- **Templates**: EJS
- **Charts**: Reuse existing chart components
