# Token Visualizer

AI token usage visualization tool with web dashboard.

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Start the server

```bash
npm run dev
```

Server runs on http://localhost:3000

### 3. Upload data

```bash
npm run push
```

First run will auto-configure and generate API key.

### 4. View dashboard

Open http://localhost:3000/dashboard in your browser.

## Commands

```bash
# Upload data to server
npm run push

# Generate local visualization
npm run generate

# Show statistics
node bin/token-viz.js stats

# Manage configuration
node bin/token-viz.js config --show
node bin/token-viz.js config --set-server <url>
node bin/token-viz.js config --set-key <key>
```

## Packages

- **@token-viz/cli** - Command-line tool for parsing and uploading usage data
- **@token-viz/server** - Web server with dashboard and API

## Data Sources

- **Claude Code**: `~/.claude/code/projects/`
- **OpenClaw**: `~/.openclaw/agents/*/sessions/*.jsonl`

## Environment

- `PORT` - Server port (default: 3000)
