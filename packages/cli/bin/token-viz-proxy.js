#!/usr/bin/env node
/**
 * Token Visualizer CLI with proxy support
 * Usage: token-viz-proxy <args>...
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup proxy
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.all_proxy;

if (proxyUrl) {
  console.log(`Using proxy: ${proxyUrl}`);

  try {
    const { setGlobalDispatcher, ProxyAgent } = await import('undici');

    // Convert socks5:// to socks+ format for undici
    let agentUrl = proxyUrl;
    if (proxyUrl.startsWith('socks5://')) {
      agentUrl = proxyUrl.replace('socks5://', 'socks+');
    } else if (proxyUrl.startsWith('socks://')) {
      agentUrl = proxyUrl.replace('socks://', 'socks+');
    }

    setGlobalDispatcher(new ProxyAgent(agentUrl));
    console.log('✓ Proxy configured\n');
  } catch (e) {
    console.warn('Warning: Could not set up proxy:', e.message);
  }
}

// Run the actual CLI
const cliPath = join(__dirname, 'token-viz.js');
const proc = spawn('node', [cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

proc.on('exit', (code) => process.exit(code));
