/**
 * Profile Generator with Conversation Analysis
 * Generates user profiles from session data with optional conversation analysis
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { detectGitHubRepos, fetchGitHubStats, aggregateGitHubStats } from './github-detector.js';

/**
 * Analyze conversation patterns from session files
 * @param {Array<string>} sessionFiles - List of .jsonl files
 * @returns {Object} User style analysis
 */
export function analyzeConversationPatterns(sessionFiles) {
  const patterns = {
    workHabits: {
      activeHours: [], // Active hours distribution [0-23]
      avgSessionLength: 0, // Average session length in minutes
      workStyle: 'unknown', // 'night-owl' | 'early-bird' | 'regular'
      totalSessions: 0,
      totalMessages: 0,
    },
    communicationStyle: {
      avgMessageLength: 0, // Average message length in characters
      emojiUsage: 0, // Emoji usage frequency (0-1)
      style: 'unknown', // 'concise' | 'detailed' | 'balanced'
      codeBlockUsage: 0, // Code block frequency
    },
    technicalPreference: {
      focusAreas: [], // ['architecture', 'testing', 'debugging', 'optimization']
      toolsUsed: [], // Tools inferred from conversations
      keywords: {}, // Keyword frequency map
    },
    commonTasks: [], // Common task types
  };

  if (!sessionFiles || sessionFiles.length === 0) {
    return patterns;
  }

  // Analysis accumulators
  const hourCounts = new Array(24).fill(0);
  const messageLengths = [];
  let messagesWithEmoji = 0;
  let messagesWithCode = 0;
  let totalMessages = 0;
  const keywords = {};
  const sessions = new Map();

  // Keywords for technical focus detection
  const focusKeywords = {
    architecture: ['architecture', 'design', 'pattern', 'structure', 'refactor', 'clean code', 'solid', 'microservice'],
    testing: ['test', 'spec', 'jest', 'mocha', 'cypress', 'coverage', 'unit test', 'integration'],
    debugging: ['debug', 'error', 'bug', 'fix', 'issue', 'crash', 'exception', 'traceback', 'stack trace'],
    optimization: ['optimize', 'performance', 'speed', 'memory', 'cache', 'lazy', 'efficient', 'benchmark'],
    deployment: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'pipeline', 'release', 'production'],
    documentation: ['docs', 'readme', 'comment', 'documentation', 'explain', 'describe'],
  };

  // Tool detection patterns
  const toolPatterns = [
    { pattern: /\b(git|github|gitlab|bitbucket)\b/gi, tool: 'git' },
    { pattern: /\b(docker|kubernetes|k8s)\b/gi, tool: 'containers' },
    { pattern: /\b(npm|yarn|pnpm)\b/gi, tool: 'package-manager' },
    { pattern: /\b(jest|mocha|vitest|cypress)\b/gi, tool: 'testing' },
    { pattern: /\b(webpack|vite|rollup|esbuild)\b/gi, tool: 'bundler' },
    { pattern: /\b(typescript|ts)\b/gi, tool: 'typescript' },
    { pattern: /\b(python|py)\b/gi, tool: 'python' },
    { pattern: /\b(node|nodejs)\b/gi, tool: 'nodejs' },
    { pattern: /\b(react|vue|angular|svelte)\b/gi, tool: 'frontend-framework' },
    { pattern: /\b(express|fastify|koa|nestjs)\b/gi, tool: 'backend-framework' },
    { pattern: /\b(postgres|mysql|mongodb|redis)\b/gi, tool: 'database' },
  ];

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

  // Process each session file
  for (const filePath of sessionFiles) {
    try {
      if (!existsSync(filePath)) continue;

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          
          // Handle different session file formats
          let message = null;
          let timestamp = null;
          
          // Format 1: Direct role/content (simple format)
          if (entry.role === 'user' && entry.content) {
            message = entry.content;
            timestamp = entry.timestamp;
          }
          // Format 2: Claude Code format with nested message
          else if (entry.type === 'user' && entry.message && entry.message.role === 'user') {
            message = entry.message.content;
            timestamp = entry.timestamp;
          }
          // Format 3: OpenClaw format
          else if (entry.type === 'user_message' && entry.content) {
            message = entry.content;
            timestamp = entry.timestamp;
          }
          
          // Skip if no valid message found
          if (!message) continue;
          
          // Handle message as string or object
          if (typeof message === 'object') {
            // Some formats have message as {text: "..."} or similar
            message = message.text || message.content || JSON.stringify(message);
          }

          totalMessages++;
          const messageLength = message.length;
          messageLengths.push(messageLength);

          // Track emoji usage
          if (emojiRegex.test(message)) {
            messagesWithEmoji++;
          }

          // Track code block usage
          if (message.includes('```') || message.includes('`')) {
            messagesWithCode++;
          }

          // Extract keywords (simple word frequency)
          const words = message.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
          for (const word of words) {
            keywords[word] = (keywords[word] || 0) + 1;
          }

          // Track active hours
          if (timestamp) {
            const hour = new Date(timestamp).getHours();
            hourCounts[hour]++;
            
            // Track session by date
            const dateKey = new Date(timestamp).toDateString();
            if (!sessions.has(dateKey)) {
              sessions.set(dateKey, { start: timestamp, end: timestamp, count: 0 });
            }
            const session = sessions.get(dateKey);
            session.end = timestamp;
            session.count++;
          }

        } catch (parseError) {
          // Skip invalid JSON lines
        }
      }
    } catch (readError) {
      // Skip files that can't be read
    }
  }

  // Calculate work habits
  patterns.workHabits.totalMessages = totalMessages;
  patterns.workHabits.totalSessions = sessions.size;

  // Find active hours (hours with above-average activity)
  const avgHourCount = hourCounts.reduce((a, b) => a + b, 0) / 24;
  patterns.workHabits.activeHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter(h => h.count > avgHourCount)
    .map(h => h.hour);

  // Determine work style
  const nightHours = [22, 23, 0, 1, 2, 3, 4, 5];
  const morningHours = [6, 7, 8, 9, 10, 11];
  const nightActivity = nightHours.reduce((sum, h) => sum + hourCounts[h], 0);
  const morningActivity = morningHours.reduce((sum, h) => sum + hourCounts[h], 0);

  if (nightActivity > morningActivity * 1.5) {
    patterns.workHabits.workStyle = 'night-owl';
  } else if (morningActivity > nightActivity * 1.5) {
    patterns.workHabits.workStyle = 'early-bird';
  } else {
    patterns.workHabits.workStyle = 'regular';
  }

  // Calculate average session length
  if (sessions.size > 0) {
    let totalLength = 0;
    for (const session of sessions.values()) {
      const start = new Date(session.start);
      const end = new Date(session.end);
      totalLength += (end - start) / 60000; // Convert to minutes
    }
    patterns.workHabits.avgSessionLength = Math.round(totalLength / sessions.size);
  }

  // Calculate communication style
  if (messageLengths.length > 0) {
    const avgLength = messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length;
    patterns.communicationStyle.avgMessageLength = Math.round(avgLength);
    
    if (avgLength < 50) {
      patterns.communicationStyle.style = 'concise';
    } else if (avgLength > 200) {
      patterns.communicationStyle.style = 'detailed';
    } else {
      patterns.communicationStyle.style = 'balanced';
    }
  }

  patterns.communicationStyle.emojiUsage = totalMessages > 0 
    ? messagesWithEmoji / totalMessages 
    : 0;
  
  patterns.communicationStyle.codeBlockUsage = totalMessages > 0 
    ? messagesWithCode / totalMessages 
    : 0;

  // Extract technical preferences
  const sortedKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100);
  
  patterns.technicalPreference.keywords = Object.fromEntries(sortedKeywords);

  // Detect focus areas
  const focusScores = {};
  for (const [area, areaKeywords] of Object.entries(focusKeywords)) {
    focusScores[area] = areaKeywords.reduce((sum, kw) => sum + (keywords[kw] || 0), 0);
  }
  
  patterns.technicalPreference.focusAreas = Object.entries(focusScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area);

  // Detect tools used
  const toolsCount = {};
  for (const { pattern, tool } of toolPatterns) {
    const matches = Object.keys(keywords).join(' ').match(pattern);
    if (matches) {
      toolsCount[tool] = (toolsCount[tool] || 0) + matches.length;
    }
  }
  
  patterns.technicalPreference.toolsUsed = Object.entries(toolsCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tool]) => tool);

  // Extract common tasks (simplified - based on verb patterns)
  const taskVerbs = {
    'debugging': ['fix', 'debug', 'solve', 'resolve', 'error'],
    'refactoring': ['refactor', 'improve', 'clean', 'optimize', 'simplify'],
    'feature-development': ['add', 'implement', 'create', 'build', 'develop'],
    'code-review': ['review', 'check', 'verify', 'validate', 'analyze'],
    'documentation': ['document', 'write', 'explain', 'describe'],
    'testing': ['test', 'verify', 'ensure', 'validate'],
  };

  const taskScores = {};
  for (const [task, verbs] of Object.entries(taskVerbs)) {
    taskScores[task] = verbs.reduce((sum, verb) => sum + (keywords[verb] || 0), 0);
  }

  patterns.commonTasks = Object.entries(taskScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([task]) => task);

  return patterns;
}

/**
 * Generate user profile from session data
 * @param {Object} options - Generation options
 * @param {boolean} options.analyzeConversations - Enable conversation analysis (default: false)
 * @param {boolean} options.includeGitHubStats - Enable GitHub stats (default: false)
 * @param {string} options.githubToken - GitHub API token (optional)
 * @param {string} options.projectPath - Project path for GitHub detection
 * @param {Array<string>} options.sessionFiles - List of session files to analyze
 * @returns {Object} Generated profile
 */
export async function generateProfile(options = {}) {
  const {
    analyzeConversations = false,
    includeGitHubStats = false,
    githubToken = process.env.GITHUB_TOKEN,
    projectPath = process.cwd(),
    sessionFiles = []
  } = options;

  const profile = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    metadata: {
      analyzerVersion: '1.0.0',
      options: {
        analyzeConversations,
        includeGitHubStats
      }
    }
  };

  // Conversation analysis (privacy-controlled)
  if (analyzeConversations && sessionFiles.length > 0) {
    try {
      profile.conversationAnalysis = analyzeConversationPatterns(sessionFiles);
    } catch (error) {
      console.warn(`Conversation analysis failed: ${error.message}`);
      profile.conversationAnalysis = null;
    }
  }

  // GitHub stats (optional)
  if (includeGitHubStats) {
    try {
      const repos = await detectGitHubRepos(projectPath, sessionFiles);
      
      if (repos.length > 0) {
        const repoStats = await fetchGitHubStats(repos, githubToken);
        profile.githubStats = aggregateGitHubStats(repoStats);
      } else {
        profile.githubStats = null;
      }
    } catch (error) {
      console.warn(`GitHub stats failed: ${error.message}`);
      profile.githubStats = null;
    }
  }

  return profile;
}

/**
 * Find session files in standard locations
 * @returns {Array<string>} List of session file paths
 */
export function findSessionFiles() {
  const sessionFiles = [];
  const homeDir = homedir();

  // Claude Code sessions
  const claudeDir = join(homeDir, '.claude', 'projects');
  if (existsSync(claudeDir)) {
    const projects = readdirSync(claudeDir, { withFileTypes: true });
    for (const project of projects) {
      if (project.isDirectory()) {
        const sessionsDir = join(claudeDir, project.name);
        const files = readdirSync(sessionsDir);
        for (const file of files) {
          if (file.endsWith('.jsonl')) {
            sessionFiles.push(join(sessionsDir, file));
          }
        }
      }
    }
  }

  // OpenClaw sessions
  const openclawDir = join(homeDir, '.openclaw', 'sessions');
  if (existsSync(openclawDir)) {
    const files = readdirSync(openclawDir);
    for (const file of files) {
      if (file.endsWith('.jsonl')) {
        sessionFiles.push(join(openclawDir, file));
      }
    }
  }

  return sessionFiles;
}
