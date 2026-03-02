# Token Visualizer Project Memory

**Created**: 2026-03-02
**Purpose**: Standalone tool for AI token usage visualization

## Architecture

- **Runtime**: Node.js + ES Modules
- **Visualization**: SVG + sharp (PNG conversion)
- **Parsers**: ccusage (Claude Code), custom (OpenClaw)

## Key Files

| File | Purpose |
|------|---------|
| `bin/token-viz.js` | CLI entry point |
| `src/parsers/*.js` | Data parsers for different AI tools |
| `src/config/models.js` | Model pricing configuration |
| `src/config/theme.js` | GitHub-inspired theme colors |
| `src/calculator.js` | Statistics aggregation |
| `src/charts/*.js` | SVG chart components |
| `src/export.js` | SVG/PNG export |

## Changes

### 2026-03-02
- Initial implementation
- Claude Code and OpenClaw parsers
- GitHub-style theme
- PNG export via sharp
