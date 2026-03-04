#!/usr/bin/env node
/**
 * Token Visualizer CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import { unlinkSync, existsSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parseAll } from '../src/parsers/index.js';
import { calculateStats } from '../src/calculator.js';
import { exportVisualization } from '../src/export.js';
// Setup proxy support - must be imported before any fetch calls
import '../src/proxy-fetch.js';
import {
  loadConfig, saveConfig, getApiKey, setApiKey, getServerUrl, isConfigured
} from '../src/config.js';

// ============================================================================
// DAEMON CONFIGURATION
// ============================================================================
const DAEMON_CONFIG = {
  pidFile: join(homedir(), '.token-visualizer', 'daemon.pid'),
  logFile: join(homedir(), '.token-visualizer', 'daemon.log'),
  defaultInterval: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Handle "daemon-run" internal command first (before Commander parsing)
// This is critical because Commander might try to parse arguments meant for the daemon
if (process.argv.includes('--daemon-run')) {
  const intervalIndex = process.argv.indexOf('--daemon-run') + 1;
  const intervalMs = parseInt(process.argv[intervalIndex]) || DAEMON_CONFIG.defaultInterval;

  // Setup logging - writes to ~/.token-visualizer/daemon.log
  const log = (message) => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    try {
      writeFileSync(DAEMON_CONFIG.logFile, line, { flag: 'a' });
    } catch (e) {
      // If we can't write to log, we can't do much in detached process
    }
  };

  log(`Daemon process started (PID: ${process.pid}, Interval: ${intervalMs}ms)`);

  // Upload function - parses local data and pushes to server
  const doUpload = async () => {
    try {
      const apiKey = getApiKey();
      const serverUrl = getServerUrl();

      if (!apiKey) {
        log('ERROR: API key not configured');
        return;
      }

      // Parse and upload
      // Note: parseAll() might need to handle concurrency if files are being written to
      const buckets = await parseAll();
      if (buckets.length === 0) {
        log('No usage data found to upload');
        return;
      }

      const response = await fetch(`${serverUrl}/api/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ records: buckets }),
      });

      if (response.ok) {
        const result = await response.json();
        log(`✓ Upload successful: ${result.message}`);
      } else {
        log(`Upload failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      log(`ERROR: ${error.message}`);
    }
  };

  // Initial upload on startup
  doUpload();

  // Schedule periodic uploads
  setInterval(doUpload, intervalMs);

  process.stdin.resume();
}
// ============================================================================
// DAEMON CONFIGURATION END
// ============================================================================

if (!process.argv.includes('--daemon-run')) {
  const program = new Command();
  
  program
    .name('token-viz')
  .description('AI token usage visualization tool')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate token usage visualization')
  .option('-o, --output <path>', 'Output file path', 'usage.png')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .option('--tools <tools>', 'Comma-separated list of tools to include')
  .option('--size <size>', 'Image size (WxH)', '1200x800')
  .option('--svg', 'Export as SVG instead of PNG')
  .action(async (options) => {
    console.log(chalk.cyan('Token Visualizer - Gathering usage data...\n'));

    try {
      // Parse enabled parsers
      const enabledParsers = options.tools
        ? options.tools.split(',').map(t => t.trim().toLowerCase())
        : undefined;

      // Parse data
      const buckets = await parseAll(enabledParsers);

      if (buckets.length === 0) {
        console.warn(chalk.yellow('No usage data found. Make sure you have run AI tools that store session data.'));
        return;
      }

      // Filter by date range if specified
      let filteredBuckets = buckets;
      if (options.from || options.to) {
        const fromDate = options.from ? new Date(options.from) : new Date(-8640000000000000);
        const toDate = options.to ? new Date(options.to) : new Date();
        filteredBuckets = buckets.filter(b => {
          const date = new Date(b.bucketStart);
          return date >= fromDate && date <= toDate;
        });
      }

      // Calculate statistics
      const stats = calculateStats(filteredBuckets);

      // Print summary
      console.log(chalk.bold('Summary:'));
      console.log(`  Total Tokens: ${chalk.green(stats.totalTokens.toLocaleString())}`);
      console.log(`  Total Cost: ${chalk.green(`$${stats.totalCost.toFixed(2)}`)}`);
      console.log(`  Models Used: ${stats.modelCount}`);
      console.log(`  Days Active: ${stats.dayCount}`);
      console.log(`  Data Points: ${filteredBuckets.length}\n`);

      // Show top models
      console.log(chalk.bold('Top Models by Cost:'));
      stats.byModel.slice(0, 5).forEach((m, i) => {
        const percent = ((m.cost / stats.totalCost) * 100).toFixed(1);
        console.log(`  ${i + 1}. ${chalk.cyan(m.displayName.padEnd(20))} $${m.cost.toFixed(4).padStart(8)} (${percent}%)`);
      });

      // Parse size
      let width, height;
      if (options.size) {
        [width, height] = options.size.split('x').map(Number);
      }

      // Generate output path
      let outputPath = options.output;
      if (options.svg && !outputPath.endsWith('.svg')) {
        outputPath = outputPath.replace(/\.\w+$/, '.svg');
        if (outputPath === options.output) outputPath += '.svg';
      }

      console.log(`\n${chalk.dim('Generating visualization...')}`);

      // Export
      await exportVisualization(stats, filteredBuckets, outputPath);

      console.log(chalk.green(`\n✓ Visualization saved to: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (process.env.DEBUG) console.error(error.stack);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show usage statistics without generating image')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    console.log(chalk.cyan('Token Visualizer - Usage Statistics\n'));

    const buckets = await parseAll();

    if (buckets.length === 0) {
      console.warn(chalk.yellow('No usage data found.'));
      return;
    }

    let filteredBuckets = buckets;
    if (options.from || options.to) {
      const fromDate = options.from ? new Date(options.from) : new Date(-8640000000000000);
      const toDate = options.to ? new Date(options.to) : new Date();
      filteredBuckets = buckets.filter(b => {
        const date = new Date(b.bucketStart);
        return date >= fromDate && date <= toDate;
      });
    }

    const stats = calculateStats(filteredBuckets);

    console.log(chalk.bold('Summary:'));
    console.log(`  Total Tokens: ${chalk.green(stats.totalTokens.toLocaleString())}`);
    console.log(`  Total Cost: ${chalk.green(`$${stats.totalCost.toFixed(2)}`)}`);
    console.log(`  Models Used: ${stats.modelCount}`);
    console.log(`  Days Active: ${stats.dayCount}\n`);

    console.log(chalk.bold('By Model:'));
    stats.byModel.forEach((m, i) => {
      const percent = ((m.cost / stats.totalCost) * 100).toFixed(1);
      console.log(`  ${i + 1}. ${chalk.cyan(m.displayName.padEnd(25))} ${formatTokens(m.totalTokens).padStart(10)} · $${m.cost.toFixed(4).padStart(8)} (${percent}%)`);
    });
  });

// Config command
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

// Push command
program
  .command('push')
  .description('Upload usage data to server')
  .option('-s, --server <url>', 'Server URL')
  .option('-k, --key <api-key>', 'API key (overrides saved config)')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .option('--reindex', 'Clear state and reindex all historical data')
  .action(async (options) => {
    console.log(chalk.cyan('Token Visualizer - Uploading data...\n'));

    // Handle reindex - clear state files
    if (options.reindex) {
      const stateDir = join(homedir(), '.token-visualizer');
      const stateFiles = ['claude-code-state.json', 'openclaw-state.json'];
      let cleared = 0;
      for (const file of stateFiles) {
        const filePath = join(stateDir, file);
        if (existsSync(filePath)) {
          try {
            unlinkSync(filePath);
            cleared++;
          } catch (e) {
            console.log(chalk.dim(`  Could not clear ${file}`));
          }
        }
      }
      if (cleared > 0) {
        console.log(chalk.yellow(`✓ Cleared ${cleared} state file(s) - reindexing all data\n`));
      }
    }

    // Check configuration
    let serverUrl = options.server || getServerUrl();
    let apiKey = options.key || getApiKey();

    // If no API key provided, try interactive setup
    if (!apiKey) {
      console.log(chalk.yellow('API key required!\n'));
      console.log(chalk.dim('Options:'));
      console.log(chalk.dim(`  1. Use --key option:    ${chalk.cyan('token-viz push --key YOUR_API_KEY')}`));
      console.log(chalk.dim(`  2. Save config first:    ${chalk.cyan('token-viz config --set-key YOUR_API_KEY')}`));
      console.log(chalk.dim(`  3. Register at:          ${chalk.cyan(`${serverUrl}`)}\n`));
      process.exit(1);
    }

    // Validate API key before uploading
    if (options.key) {
      console.log(chalk.dim('Validating API key...'));
      try {
        const testResponse = await fetch(`${serverUrl}/api/profile`, {
          headers: { 'X-API-Key': apiKey }
        });
        if (!testResponse.ok) {
          console.error(chalk.red('✗ Invalid API key'));
          console.error(chalk.dim('\nPlease check your API key and try again.'));
          console.error(chalk.dim(`Get your API key at: ${serverUrl}\n`));
          process.exit(1);
        }
        console.log(chalk.green('✓ API key valid\n'));

        // Save valid key for future use
        setApiKey(apiKey, serverUrl);
        console.log(chalk.dim('API key saved for future use\n'));
      } catch (error) {
        console.error(chalk.red(`✗ Could not validate API key: ${error.message}`));
        console.error(chalk.dim(`\nMake sure server is running at: ${serverUrl}\n`));
        process.exit(1);
      }
    }

    try {
      // Parse data - pass fullUpload option when reindexing
      const buckets = await parseAll(AVAILABLE_PARSERS, { fullUpload: !!options.reindex });

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
      console.log(chalk.dim(`\nView your dashboard: ${serverUrl}/dashboard\n`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Helper function
function formatTokens(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

// Dash command - open dashboard in browser
program
  .command('dash')
  .description('Open dashboard in browser')
  .option('-k, --key <api-key>', 'API key (overrides saved config)')
  .option('-s, --server <url>', 'Server URL')
  .action(async (options) => {
    const config = loadConfig();
    const url = options.server || config.serverUrl || 'http://localhost:3000';
    let key = options.key || config.apiKey;

    if (!key) {
      console.error(chalk.red('API key required!'));
      console.error(chalk.dim('\nOptions:'));
      console.error(chalk.dim(`  1. Use --key option:    ${chalk.cyan('token-viz dash --key YOUR_API_KEY')}`));
      console.error(chalk.dim(`  2. Save config first:    ${chalk.cyan('token-viz config --set-key YOUR_API_KEY')}`));
      console.error(chalk.dim(`  3. Register at:          ${chalk.cyan(`${url}`)}\n`));
      process.exit(1);
    }

    const dashboardUrl = `${url}/dashboard?key=${key}`;
    exec(`open "${dashboardUrl}"`);
    console.log(chalk.green(`Opening dashboard: ${dashboardUrl}`));
  });

// ============================================================================
// DAEMON COMMANDS - Background auto-upload service
// ============================================================================
//
// The daemon runs as a detached background process and periodically uploads
// AI usage data to the server. This eliminates the need for manual push commands.
//
// Architecture:
//   - Main process spawns a detached child process with --daemon-run flag
//   - Child process runs independently (parent can exit)
//   - PID stored in ~/.token-visualizer/daemon.pid for lifecycle management
//   - Logs written to ~/.token-visualizer/daemon.log
//
// Usage:
//   token-viz daemon start [--interval 60]  - Start daemon (default: hourly)
//   token-viz daemon stop                   - Stop running daemon
//   token-viz daemon status                 - Check if daemon is running
//   token-viz daemon logs                   - Show recent log entries
//
// Implementation notes:
//   - Uses spawn() with detached:true to create orphaned process
//   - process.kill(pid, 0) is a non-destructive way to check if process exists
//   - Stale PID files are automatically cleaned up
//
// ============================================================================

program
  .command('daemon')
  .description('Manage background auto-upload service')
  .argument('<action>', 'Action to perform: start|stop|status|logs')
  .option('-i, --interval <minutes>', 'Upload interval in minutes (default: 60)', '60')
  .action(async (action, options) => {
    const intervalMs = parseInt(options.interval) * 60 * 1000;

    switch (action) {
      case 'start':
        await startDaemon(intervalMs);
        break;
      case 'stop':
        await stopDaemon();
        break;
      case 'status':
        await daemonStatus();
        break;
      case 'logs':
        await showLogs();
        break;
      default:
        console.error(chalk.red(`Unknown action: ${action}`));
        console.log(chalk.dim('Valid actions: start, stop, status, logs'));
        process.exit(1);
    }
  });

// Start the daemon
async function startDaemon(intervalMs) {
  // Check if already running
  if (existsSync(DAEMON_CONFIG.pidFile)) {
    const pid = parseInt(readFileSync(DAEMON_CONFIG.pidFile, 'utf-8'));
    try {
      // Check if process is still alive
      process.kill(pid, 0);
      console.warn(chalk.yellow('Daemon is already running (PID: ' + pid + ')'));
      console.log(chalk.dim('Use "token-viz daemon stop" to stop it first.\n'));
      return;
    } catch (e) {
      // Process is dead, clean up stale PID file
      rmSync(DAEMON_CONFIG.pidFile);
    }
  }

  // Check configuration
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(chalk.red('API key required!'));
    console.error(chalk.dim('Configure first: token-viz config --set-key YOUR_API_KEY\n'));
    process.exit(1);
  }

  // Spawn daemon process
  const daemon = spawn(process.execPath, [__filename, '--daemon-run', String(intervalMs)], {
    detached: true,
    stdio: 'ignore',
  });

  // Write PID file
  writeFileSync(DAEMON_CONFIG.pidFile, String(daemon.pid));

  // Detach child process
  daemon.unref();

  console.log(chalk.green('✓ Daemon started'));
  console.log(chalk.dim(`  PID: ${daemon.pid}`));
  console.log(chalk.dim(`  Interval: ${intervalMs / 60000} minutes`));
  console.log(chalk.dim(`  Log: ${DAEMON_CONFIG.logFile}\n`));
  console.log(chalk.dim('Use "token-viz daemon status" to check status.'));
  console.log(chalk.dim('Use "token-viz daemon logs" to view logs.\n'));
}

// Stop the daemon
async function stopDaemon() {
  if (!existsSync(DAEMON_CONFIG.pidFile)) {
    console.warn(chalk.yellow('Daemon is not running.\n'));
    return;
  }

  const pid = parseInt(readFileSync(DAEMON_CONFIG.pidFile, 'utf-8'));

  try {
    process.kill(pid, 'SIGTERM');
    rmSync(DAEMON_CONFIG.pidFile);
    console.log(chalk.green('✓ Daemon stopped\n'));
  } catch (e) {
    console.error(chalk.red('Failed to stop daemon'));
    console.error(chalk.dim(`Process ${pid} may not be running.\n`));
    // Clean up stale PID file anyway
    rmSync(DAEMON_CONFIG.pidFile, { force: true });
  }
}

// Show daemon status
async function daemonStatus() {
  if (!existsSync(DAEMON_CONFIG.pidFile)) {
    console.log(chalk.dim('Daemon: ') + chalk.red('not running\n'));
    return;
  }

  const pid = parseInt(readFileSync(DAEMON_CONFIG.pidFile, 'utf-8'));

  try {
    process.kill(pid, 0); // Check if process exists
    console.log(chalk.dim('Daemon: ') + chalk.green('running'));
    console.log(chalk.dim(`  PID: ${pid}\n`));

    // Show last upload time from log
    if (existsSync(DAEMON_CONFIG.logFile)) {
      const logs = readFileSync(DAEMON_CONFIG.logFile, 'utf-8');
      const lastUpload = logs.split('\n').filter(l => l.includes('✓ Upload')).pop();
      if (lastUpload) {
        console.log(chalk.dim('Last upload: ') + lastUpload.split('] ').pop());
      }
    }
  } catch (e) {
    console.log(chalk.dim('Daemon: ') + chalk.red('stopped (stale PID file)'));
    rmSync(DAEMON_CONFIG.pidFile);
  }
}

// Show daemon logs
async function showLogs() {
  if (!existsSync(DAEMON_CONFIG.logFile)) {
    console.log(chalk.dim('No logs found.\n'));
    return;
  }

  const logs = readFileSync(DAEMON_CONFIG.logFile, 'utf-8');
  const lines = logs.split('\n').filter(l => l).slice(-20); // Last 20 lines

  console.log(chalk.bold('Recent logs:\n'));
  lines.forEach(line => console.log(chalk.dim(line)));
  console.log('');
}

// Parse command line arguments (only when not running as daemon)
program.parse();
}
