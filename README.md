# Token Visualizer

AI token usage visualization tool with GitHub-inspired theme.

## Features

- Aggregates usage from Claude Code, OpenClaw, and more
- Shows cost breakdown by model
- Daily activity heatmap (GitHub-style)
- Beautiful shareable images

## Installation

```bash
cd ~/Projects/token-visualizer
npm install
```

## Usage

```bash
# Generate visualization
npm run generate

# Or via CLI
node bin/token-viz.js generate -o usage.png

# Specify date range
node bin/token-viz.js generate --from 2026-01-01 --to 2026-03-01

# Show stats only
node bin/token-viz.js stats
```

## Data Sources

- **Claude Code**: `~/.claude/code/projects/`
- **OpenClaw**: `~/.openclaw/agents/*/sessions/*.jsonl`

## Pricing

Model pricing is configured in `src/config/models.js`.

## Theme

GitHub-inspired colors from `src/config/theme.js`.
