/**
 * Smart proxy auto-detection - works across platforms and proxy software
 */

// Common proxy ports used by various proxy software
const COMMON_PORTS = [
  7890,    // Clash / Surge
  7891,    //
  1087,    // Clash
  7892,    // Clash
  10808,   //
  8888,    // Surge (yours!)
  10809,
  7893,    //
  1086,    //
  10888,
  8080,    // Fiddler
  8118,    // Charles Proxy
];

// Track the first working proxy we found (to avoid redundant testing)
let workingProxyUrl = null;

/**
 * Test if a proxy port actually works by making a real request
 * This creates a temporary dispatcher for testing without affecting global state
 */
async function testProxyPort(host, port) {
  // Skip if we already found a working proxy
  if (workingProxyUrl) return false;

  try {
    const { setGlobalDispatcher, ProxyAgent } = await import('undici');

    // Set up temporary proxy for this test
    setGlobalDispatcher(new ProxyAgent(`http://${host}:${port}`));

    // Quick connectivity test with timeout
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });

    const works = response.ok || response.status === 404 || response.status === 302;
    if (works) {
      workingProxyUrl = `http://${host}:${port}`;
    }
    return works;
  } catch {
    return false;
  }
}

// Detect macOS system proxy
async function detectMacOSProxy() {
  if (process.platform !== 'darwin') return null;

  try {
    const { execSync } = await import('child_process');
    const output = execSync('scutil --proxy', {
      encoding: 'utf8',
      timeout: 2000
    });

    // Parse macOS proxy settings
    const enabledMatch = output.match(/HTTPEnable\s*:\s*(\d)/);
    if (!enabledMatch || enabledMatch[1] !== '1') return null;

    const proxyMatch = output.match(/HTTPProxy\s*:\s*(\S+)/);
    const portMatch = output.match(/HTTPPort\s*:\s*(\d+)/);

    if (proxyMatch && portMatch) {
      return `http://${proxyMatch[1]}:${portMatch[1]}`;
    }
  } catch {
    // Ignore silently
  }
  return null;
}

// Detect Windows system proxy
async function detectWindowsProxy() {
  if (process.platform !== 'win32') return null;

  try {
    const { execSync } = await import('child_process');

    // Check IE/WinHTTP proxy settings
    const output = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer', {
      encoding: 'utf16le',
      timeout: 1000
    });

    if (output.includes('ProxyServer')) {
      const match = output.match(/ProxyServer\s+REG_SZ\s+(.+)/);
      if (match) {
        const proxy = match[1].trim();
        if (!proxy.startsWith('http')) {
          return `http://${proxy}`;
        }
        return proxy;
      }
    }
  } catch {
    // Ignore silently
  }
  return null;
}

// Detect Linux system proxy (environment variables usually)
async function detectLinuxProxy() {
  if (process.platform !== 'linux') return null;

  // Check environment variables (many Linux proxy tools set these)
  const envVars = ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy', 'ALL_PROXY', 'all_proxy'];
  for (const envVar of envVars) {
    if (process.env[envVar]) {
      return process.env[envVar];
    }
  }

  // Check common desktop environment proxy configs
  try {
    const { existsSync, readFileSync } = await import('fs');
    const { homedir } = await import('os');
    const { join } = await import('path');

    // GNOME proxy settings
    const gnomeProxy = join(homedir(), '.gconf', 'desktop', 'gnome');
    // Could add more checks here...
  } catch {
    // Ignore
  }

  return null;
}

// Try all common ports until one works
async function tryCommonPorts() {
  for (const port of COMMON_PORTS) {
    if (await testProxyPort('127.0.0.1', port)) {
      return workingProxyUrl || `http://127.0.0.1:${port}`;
    }
  }
  return null;
}

// Main auto-detect function
export async function autoDetectProxy() {
  // 1. Check environment variables first (user can override)
  if (process.env.HTTPS_PROXY) return process.env.HTTPS_PROXY;
  if (process.env.HTTP_PROXY) return process.env.HTTP_PROXY;

  // 2. Try system proxy settings
  const systemProxy = await detectMacOSProxy()
                   || await detectWindowsProxy()
                   || await detectLinuxProxy();
  if (systemProxy) {
    return systemProxy;
  }

  // 3. Try common ports (test each one)
  const workingProxy = await tryCommonPorts();
  if (workingProxy) {
    return workingProxy;
  }

  return null;
}

export async function setupProxy() {
  let proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

  // Auto-detect if no env var
  if (!proxyUrl) {
    proxyUrl = await autoDetectProxy();
  }

  if (!proxyUrl) {
    // No proxy found - give helpful hints
    console.log('\\n📡 Network: No proxy detected. If you need a proxy:\\n');
    console.log('  Option 1: Set environment variable');
    console.log('    HTTPS_PROXY=http://127.0.0.1:8888 token-viz push\\n');
    console.log('  Option 2: Pass --proxy option');
    console.log('    token-viz push --proxy http://127.0.0.1:8888\\n');
    console.log('  Common proxy ports: 7890 (Clash), 7891, 1087, 8888 (Surge)\\n');
    return false;
  }

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
    console.log(`✓ Using proxy: ${proxyUrl}`);
    return true;
  } catch (e) {
    console.warn(`⚠️  Proxy setup failed: ${e.message}`);
    console.log('  Try: HTTPS_PROXY=http://127.0.0.1:8888 token-viz push\\n');
    return false;
  }
}

// Auto-setup at module load
await setupProxy();
