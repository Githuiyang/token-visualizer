# Token Visualizer Project Memory

**Created**: 2026-03-02
**Purpose**: AI token usage visualization tool with web dashboard

## Architecture

Monorepo structure with two packages:
- **@token-viz/cli**: Command-line tool for parsing and uploading data
- **@token-viz/server**: Web server with SQLite database and dashboard

**Tech Stack**: Node.js, Express, better-sqlite3, EJS, ECharts

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/bin/token-viz.js` | CLI entry point with push command |
| `packages/cli/src/config.js` | Configuration management |
| `packages/cli/src/parsers/*.js` | Data parsers for different AI tools |
| `packages/server/server.js` | Express server with API routes |
| `packages/server/db/index.js` | SQLite database operations |
| `packages/server/views/dashboard.ejs` | Web dashboard template |

## Usage

```bash
# Start server
npm run dev

# Upload data (auto-configures on first run)
npm run push

# View dashboard
open http://localhost:3000/dashboard
```

## Changes

### 2026-03-02
- Initial implementation with CLI and PNG generation
- **Web service implementation**:
  - Restructured as monorepo
  - Added SQLite database module
  - Created Express server with API
  - Added CLI push command with interactive setup
  - Built web dashboard with ECharts
  - Added config management
