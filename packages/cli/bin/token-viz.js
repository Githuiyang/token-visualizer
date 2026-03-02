#!/usr/bin/env node
/**
 * Token Visualizer CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { exec } from 'child_process';
import { parseAll } from '../src/parsers/index.js';
import { calculateStats } from '../src/calculator.js';
import { exportVisualization } from '../src/export.js';
import {
  loadConfig, saveConfig, getApiKey, setApiKey, getServerUrl, isConfigured
} from '../src/config.js';

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
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    console.log(chalk.cyan('Token Visualizer - Uploading data...\n'));

    // Check configuration
    let serverUrl = options.server || getServerUrl();
    let apiKey = getApiKey();

    // Interactive setup if not configured
    if (!apiKey) {
      console.log(chalk.yellow('First-time setup needed!\n'));

      // Prompt for server URL
      const defaultServer = 'http://localhost:3000';
      console.log(`Server URL [${defaultServer}]: ${serverUrl}`);
      console.log(chalk.dim(`Press Enter to use ${defaultServer}, or run: token-viz config --set-server <url>\n`));

      // Try to generate API key from server
      console.log(chalk.dim('Generating API key from server...'));
      try {
        const response = await fetch(`${serverUrl}/api/key`, { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          apiKey = data.apiKey;
          setApiKey(apiKey, serverUrl);
          console.log(chalk.green(`✓ API key generated and saved\n`));
        } else {
          throw new Error('Failed to generate API key');
        }
      } catch (error) {
        console.log(chalk.red(`✓ Could not connect to server at ${serverUrl}`));
        console.log(chalk.dim('\nPlease make sure the server is running:'));
        console.log(chalk.dim('  npm run dev\n'));
        console.log(chalk.dim('Or manually set your API key:'));
        console.log(chalk.dim(`  token-viz config --set-key <your-key> --set-server ${serverUrl}\n`));
        process.exit(1);
      }
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
  .action(() => {
    const config = loadConfig();
    const key = config.apiKey;
    const url = config.serverUrl || 'http://localhost:3000';
    const dashboardUrl = `${url}/dashboard?key=${key}`;
    exec(`open "${dashboardUrl}"`);
    console.log(chalk.green(`Opening dashboard: ${dashboardUrl}`));
  });

program.parse();
