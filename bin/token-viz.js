#!/usr/bin/env node
/**
 * Token Visualizer CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { parseAll } from '../src/parsers/index.js';
import { calculateStats } from '../src/calculator.js';
import { exportVisualization } from '../src/export.js';

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

// Helper function
function formatTokens(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

program.parse();
