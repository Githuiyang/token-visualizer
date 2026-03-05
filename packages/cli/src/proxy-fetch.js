/**
 * Smart proxy auto-detection - works across platforms and proxy software
 */

// Common proxy ports used by various proxy software
const COMMON_PORTS = [
  // Clash ports
  7890, 7891, 7892, 7893,
  // V2Ray / Xray ports
  10808, 10809, 10808,
  // Shadowsocks ports
  1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1088, 1089,
  // Surge ports
  8888, 8889, 8890,
  // Other common ports
  8080, 8118, 10888,
  // Loon / Quantumult X
  10809,
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
    console.log('    HTTPS_PROXY=http://127.0.0.1:<port> token-viz push\\n');
    console.log('  Option 2: Pass --proxy option');
    console.log('    token-viz push --proxy http://127.0.0.1:<port>\\n');
    console.log('  Auto-detected ports: 7890-7893 (Clash), 10808-10809 (V2Ray),');
    console.log('                      1080-1089 (Shadowsocks), 8888-8890 (Surge)\\n');
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
    console.log('  Try: HTTPS_PROXY=http://127.0.0.1:<port> token-viz push\\n');
    return false;
  }
}

// Auto-setup at module load
await setupProxy();
