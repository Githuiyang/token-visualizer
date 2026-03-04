/**
 * Auto-detect and setup proxy for Node.js fetch
 * Tries common proxy ports used by VPN/proxy software
 */

// Common proxy ports: Clash, Surge, V2Ray, Shadowsocks, etc.
const COMMON_PORTS = [7890, 7891, 1087, 8888, 10808, 7893, 1086, 10809, 10888];

let proxyTried = false;

async function tryProxy(port) {
  if (proxyTried) return false; // Already set up
  try {
    const { setGlobalDispatcher, ProxyAgent } = await import('undici');
    const agentUrl = `http://127.0.0.1:${port}`;
    setGlobalDispatcher(new ProxyAgent(agentUrl));
    proxyTried = true;

    // Quick test
    await fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

async function detectMacOSProxy() {
  if (process.platform !== 'darwin') return null;

  try {
    const { execSync } = await import('child_process');
    const output = execSync('scutil --proxy', { encoding: 'utf8', timeout: 1000 });

    // Parse: HTTPProxy : 127.0.0.1, HTTPPort : 8888
    const proxyMatch = output.match(/HTTPProxy\s*:\s*(\S+)/);
    const portMatch = output.match(/HTTPPort\s*:\s*(\d+)/);

    if (proxyMatch && portMatch) {
      return `http://${proxyMatch[1]}:${portMatch[1]}`;
    }
  } catch {
    // Ignore
  }
  return null;
}

async function autoDetectProxy() {
  // 1. Check environment variables first
  if (process.env.HTTPS_PROXY) return process.env.HTTPS_PROXY;
  if (process.env.HTTP_PROXY) return process.env.HTTP_PROXY;

  // 2. Check macOS system proxy
  const macProxy = await detectMacOSProxy();
  if (macProxy) return macProxy;

  // 3. Try common ports (without testing, just use first available)
  // Testing adds delay, so we'll be optimistic
  for (const port of COMMON_PORTS) {
    // Just return the first one - user will know quickly if it works
    return `http://127.0.0.1:${port}`;
  }

  return null;
}

export async function setupProxy() {
  // Check env var first
  let proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

  // Auto-detect if no env var
  if (!proxyUrl) {
    proxyUrl = await autoDetectProxy();
  }

  if (!proxyUrl) {
    // Give a helpful hint
    console.log('Tip: If you need a proxy, set HTTPS_PROXY=http://127.0.0.1:8888');
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
    console.log(`Using proxy: ${proxyUrl}`);
    return true;
  } catch (e) {
    console.warn(`Proxy setup failed: ${e.message}`);
    return false;
  }
}

// Auto-setup at module load
await setupProxy();
