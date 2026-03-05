/**
 * GitHub Repository Detection and Statistics
 * Detects GitHub repositories from various sources and fetches stats
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CACHE_FILE = join(homedir(), '.token-visualizer', 'github-cache.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse GitHub URL from various formats
 * @param {string} url - URL or string to parse
 * @returns {Object|null} - {fullName, owner, repo} or null
 */
export function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;

  // Support multiple formats:
  // https://github.com/owner/repo
  // git@github.com:owner/repo.git
  // github:owner/repo
  // owner/repo
  
  // Handle github:owner/repo format first
  if (url.startsWith('github:')) {
    const fullName = url.substring(7);
    const [owner, repo] = fullName.split('/');
    if (owner && repo) {
      return { fullName, owner, repo };
    }
  }
  
  const patterns = [
    /github\.com[\/:]([^\/\s]+\/[^\/\s\.]+)/,
    /^([a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      let fullName = match[1].replace(/\.git$/, '');
      // Remove trailing slashes or query params
      fullName = fullName.split(/[?#]/)[0];
      const [owner, repo] = fullName.split('/');
      if (owner && repo) {
        return { fullName, owner, repo };
      }
    }
  }
  
  return null;
}

/**
 * Detect GitHub repositories from various sources
 * @param {string} projectPath - Project directory path
 * @param {Array<string>} sessionFiles - List of session file paths
 * @returns {Array<Object>} - List of detected repos
 */
export async function detectGitHubRepos(projectPath = process.cwd(), sessionFiles = []) {
  const repos = new Map();

  // 1. From git remote origin
  try {
    const remoteUrl = execSync('git remote get-url origin', { 
      cwd: projectPath, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    const parsed = parseGitHubUrl(remoteUrl);
    if (parsed) {
      repos.set(parsed.fullName, parsed);
    }
  } catch (error) {
    // Git not available or no remote configured
  }

  // 2. From package.json repository field
  try {
    const pkgPath = join(projectPath, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.repository) {
        const repoUrl = typeof pkg.repository === 'string' 
          ? pkg.repository 
          : pkg.repository.url;
        const parsed = parseGitHubUrl(repoUrl);
        if (parsed) {
          repos.set(parsed.fullName, parsed);
        }
      }
    }
  } catch (error) {
    // package.json not found or invalid
  }

  // 3. From session files (scan for GitHub URLs)
  const patterns = [
    /github\.com\/([a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+)/g,
    /gh repo view ([a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+)/g,
  ];

  for (const file of sessionFiles) {
    try {
      if (!existsSync(file)) continue;
      const content = readFileSync(file, 'utf-8');
      
      for (const pattern of patterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const parsed = parseGitHubUrl(match[1]);
          if (parsed) {
            repos.set(parsed.fullName, parsed);
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return Array.from(repos.values());
}

/**
 * Load cached GitHub stats
 * @returns {Object|null} - Cached stats or null
 */
function loadCache() {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    
    // Check if cache is still valid
    if (cache.timestamp && Date.now() - cache.timestamp < CACHE_TTL) {
      return cache.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save GitHub stats to cache
 * @param {Object} data - Stats to cache
 */
function saveCache(data) {
  try {
    const cacheDir = join(homedir(), '.token-visualizer');
    if (!existsSync(cacheDir)) {
      const { mkdirSync } = require('fs');
      mkdirSync(cacheDir, { recursive: true });
    }
    
    writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: Date.now(),
      data
    }, null, 2));
  } catch (error) {
    // Cache write failed - non-critical
  }
}

/**
 * Fetch repository stats from GitHub API
 * @param {Array<Object>} repos - List of repos to fetch
 * @param {string} githubToken - Optional GitHub token for higher rate limits
 * @returns {Array<Object>} - List of repo stats
 */
export async function fetchGitHubStats(repos, githubToken = null) {
  if (!repos || repos.length === 0) return [];

  // Check cache first
  const cacheKey = repos.map(r => r.fullName).sort().join(',');
  const cached = loadCache();
  if (cached && cached.key === cacheKey) {
    return cached.stats;
  }

  const stats = [];
  const headers = { 
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'token-visualizer'
  };
  
  if (githubToken) {
    headers.Authorization = `token ${githubToken}`;
  }

  // Fetch in parallel
  const fetchPromises = repos.map(async (repo) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.fullName}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          fullName: repo.fullName,
          owner: repo.owner,
          repo: repo.repo,
          stars: data.stargazers_count || 0,
          forks: data.forks_count || 0,
          watchers: data.watchers_count || 0,
          openIssues: data.open_issues_count || 0,
          language: data.language || 'Unknown',
          description: data.description || '',
          updatedAt: data.updated_at || null,
          createdAt: data.created_at || null,
          isPrivate: data.private || false,
          isFork: data.fork || false,
        };
      } else if (response.status === 404) {
        // Repo not found or private (without token)
        return null;
      } else if (response.status === 403) {
        // Rate limit exceeded
        console.warn('GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.');
        return null;
      }
    } catch (error) {
      console.warn(`Failed to fetch ${repo.fullName}: ${error.message}`);
      return null;
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);
  
  // Filter out failed requests and sort by stars
  const validStats = results
    .filter(s => s !== null)
    .sort((a, b) => b.stars - a.stars);

  // Save to cache
  saveCache({ key: cacheKey, stats: validStats });

  return validStats;
}

/**
 * Aggregate GitHub stats across all repos
 * @param {Array<Object>} repoStats - List of repo stats
 * @returns {Object} - Aggregated stats
 */
export function aggregateGitHubStats(repoStats) {
  if (!repoStats || repoStats.length === 0) {
    return {
      totalStars: 0,
      totalForks: 0,
      totalWatchers: 0,
      totalOpenIssues: 0,
      repoCount: 0,
      topRepos: [],
      languages: {}
    };
  }

  const aggregated = {
    totalStars: 0,
    totalForks: 0,
    totalWatchers: 0,
    totalOpenIssues: 0,
    repoCount: repoStats.length,
    topRepos: repoStats.slice(0, 10), // Top 10 repos by stars
    languages: {}
  };

  // Aggregate totals
  for (const repo of repoStats) {
    aggregated.totalStars += repo.stars;
    aggregated.totalForks += repo.forks;
    aggregated.totalWatchers += repo.watchers;
    aggregated.totalOpenIssues += repo.openIssues;

    // Count languages
    if (repo.language) {
      aggregated.languages[repo.language] = (aggregated.languages[repo.language] || 0) + 1;
    }
  }

  return aggregated;
}
