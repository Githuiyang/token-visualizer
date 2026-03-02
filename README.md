# Token Visualizer

AI token usage visualization tool with web dashboard.

## Inspiration / Acknowledgement

**This project is inspired by [vibecafe/usage](https://github.com/vibecafe/usage)**

I came across the excellent `usage` project by vibecafe and was impressed by its design and functionality. I thought it would be perfect for tracking AI token usage within a company/team setting, so I adapted one of its modules and made some modifications to fit our needs.

This is a derivative work created with deep respect for the original project. All core design concepts and implementation patterns owe credit to the vibecafe team.

If you're looking for a more comprehensive solution, I highly recommend checking out the original [vibecafe/usage](https://github.com/vibecafe/usage) repository.

---

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

## Features

- User registration with email-based API key generation
- Personal usage dashboard with visualizations
- Organization-wide leaderboards
- Shareable usage stats cards
- Privacy controls (show/hide email, nickname)

## Packages

- **@token-viz/cli** - Command-line tool for parsing and uploading usage data
- **@token-viz/server** - Web server with dashboard and API

## Data Sources

- **Claude Code**: `~/.claude/code/projects/`
- **OpenClaw**: `~/.openclaw/agents/*/sessions/*.jsonl`

## Environment

- `PORT` - Server port (default: 3000)

## License

ISC

---

**Original Inspiration:** [vibecafe/usage](https://github.com/vibecafe/usage) - Go check it out!
