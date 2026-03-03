# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2026-03-03

#### CLI - Daemon (Auto-Upload Service)
- **Added**: `token-viz daemon` command for background auto-upload
- **Features**:
  - `daemon start` - Start background service (default: hourly uploads)
  - `daemon start --interval <minutes>` - Custom upload interval
  - `daemon stop` - Stop running daemon
  - `daemon status` - Check if daemon is running
  - `daemon logs` - Show recent log entries
- **Implementation**:
  - Detached child process using `spawn()` with `detached: true`
  - PID file: `~/.token-visualizer/daemon.pid`
  - Log file: `~/.token-visualizer/daemon.log`
  - Automatic cleanup of stale PID files

#### Server - CSP Fix
- **Fixed**: Content Security Policy blocking ECharts CDN
- **Changed**: Added `https://cdn.jsdelivr.net` to `scriptSrc` directive
- **Location**: `server.js` helmet configuration
- **Impact**: Dashboard charts now render correctly

#### CLI - Simplified Push Flow
- **Added**: `--key` option to `push` and `dash` commands
- **Benefit**: No need to run `config` before first use
- **Behavior**: Valid keys are automatically saved for future use

#### Documentation
- **Added**: Comprehensive inline comments for daemon architecture
- **Added**: CSP configuration documentation in server.js
- **Added**: ECharts dependency notes in dashboard.ejs

---

## Keywords Reference

| Keyword | Description |
|---------|-------------|
| `daemon` | Background auto-upload service |
| `csp-fix` | Content Security Policy ECharts fix |
| `push-key` | Direct API key option for push command |
