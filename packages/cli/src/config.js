import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.token-visualizer');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function loadConfig() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    return {
      // ...existing config
      ...config,
      // New profile-related options with defaults
      githubToken: process.env.GITHUB_TOKEN || config.githubToken || null,
      analyzeConversations: config.analyzeConversations || false,
      includeGitHubStats: config.includeGitHubStats || false,
    };
  } catch {
    return {
      githubToken: process.env.GITHUB_TOKEN || null,
      analyzeConversations: false,
      includeGitHubStats: false,
    };
  }
}

export function saveConfig(config) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getApiKey() {
  const config = loadConfig();
  return config.apiKey;
}

export function setApiKey(apiKey, serverUrl) {
  const config = loadConfig();
  config.apiKey = apiKey;
  if (serverUrl) config.serverUrl = serverUrl;
  saveConfig(config);
}

export function getServerUrl() {
  const config = loadConfig();
  return config.serverUrl || 'http://localhost:3000';
}

export function isConfigured() {
  const config = loadConfig();
  return !!(config.apiKey && config.serverUrl);
}
