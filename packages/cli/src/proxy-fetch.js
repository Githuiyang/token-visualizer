/**
 * Proxy setup for Node.js fetch
 * This must be called before any fetch requests
 */

export async function setupProxy() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.all_proxy;
  if (!proxyUrl) return;

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
    return true;
  } catch (e) {
    console.warn('Warning: Could not set up proxy:', e.message);
    return false;
  }
}

// Call this at module load time for global effect
await setupProxy();
