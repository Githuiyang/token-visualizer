#!/bin/bash
# Token Viz with proxy support
export https_proxy=http://127.0.0.1:8888
export http_proxy=http://127.0.0.1:8888
export all_proxy=socks5://127.0.0.1:8888

# Use curl instead of Node fetch by patching
node -e "
const { spawn } = require('child_process');
const { default: fetch } = require('undici');
const { HttpsProxyAgent } = require('https-proxy-agent');

const agent = new HttpsProxyAgent('http://127.0.0.1:8888');
global.fetch = (url, opts = {}) => fetch(url, { ...opts, dispatcher: agent, dispatcher: agent });

const proc = spawn('node', process.argv.slice(1), { stdio: 'inherit' });
proc.on('exit', (code) => process.exit(code));
" "$@"
