/**
 * Profile Generator
 * Generates a user profile from token usage data
 */

import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, hostname } from 'node:os';

const STATE_DIR = join(homedir(), '.token-visualizer');
const PROFILE_FILE = join(STATE_DIR, 'profile.json');

/**
 * Generate profile from existing token data
 */
export async function generateProfile(options = {}) {
  const { parseAll } = await import('../parsers/index.js');
  const { buckets, userCharsStats } = await parseAll();

  if (buckets.length === 0) {
    return { error: 'No token data found. Run `token-viz push` first.' };
  }

  // Calculate date range
  const dates = buckets.map(b => new Date(b.bucketStart));
  const startDate = new Date(Math.min(...dates));
  const endDate = new Date(Math.max(...dates));
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Aggregate stats
  let totalTokens = 0;
  let totalCost = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const modelUsage = new Map();
  const projectUsage = new Map();
  const dailyUsage = new Map();
  const hourlyActivity = new Array(24).fill(0);

  for (const bucket of buckets) {
    totalTokens += bucket.totalTokens;
    totalCost += bucket.cost.total;
    inputTokens += bucket.inputTokens;
    outputTokens += bucket.outputTokens;

    // Model usage
    const model = bucket.model;
    if (!modelUsage.has(model)) {
      modelUsage.set(model, { tokens: 0, cost: 0 });
    }
    modelUsage.get(model).tokens += bucket.totalTokens;
    modelUsage.get(model).cost += bucket.cost.total;

    // Project usage
    const project = bucket.project;
    if (!projectUsage.has(project)) {
      projectUsage.set(project, { tokens: 0, cost: 0, chars: 0 });
    }
    projectUsage.get(project).tokens += bucket.totalTokens;
    projectUsage.get(project).cost += bucket.cost.total;

    // Daily usage
    const day = bucket.bucketStart.split('T')[0];
    if (!dailyUsage.has(day)) {
      dailyUsage.set(day, { tokens: 0, cost: 0 });
    }
    dailyUsage.get(day).tokens += bucket.totalTokens;
    dailyUsage.get(day).cost += bucket.cost.total;

    // Hourly activity
    const hour = new Date(bucket.bucketStart).getHours();
    hourlyActivity[hour] += bucket.totalTokens;
  }

  // Add user chars to projects
  if (userCharsStats) {
    for (const [project, chars] of Object.entries(userCharsStats)) {
      if (projectUsage.has(project)) {
        projectUsage.get(project).chars = chars;
      }
    }
  }

  // Calculate averages
  const avgDailyTokens = Math.round(totalTokens / daysDiff);
  const avgDailyCost = totalCost / daysDiff;

  // Sort and format model usage
  const sortedModels = Array.from(modelUsage.entries())
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .map(([model, data]) => ({
      model,
      displayName: getModelDisplayName(model),
      tokens: data.tokens,
      cost: data.cost,
      percent: ((data.tokens / totalTokens) * 100).toFixed(1)
    }));

  // Sort and format project usage
  const sortedProjects = Array.from(projectUsage.entries())
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .map(([name, data], index) => ({
      name,
      alias: null, // User can set later
      tokens: data.tokens,
      cost: data.cost,
      chars: data.chars,
      visible: true, // Privacy control
      percent: ((data.tokens / totalTokens) * 100).toFixed(1)
    }));

  // Format daily activity for heatmap
  const activityData = Array.from(dailyUsage.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      tokens: data.tokens,
      cost: data.cost
    }));

  // Infer tags from project names and models
  const inferredTags = inferTags(sortedProjects.map(p => p.name), sortedModels.map(m => m.model));

  // Build profile
  const profile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    device: hostname(),
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      days: daysDiff
    },
    stats: {
      totalTokens,
      totalCost: totalCost.toFixed(2),
      inputTokens,
      outputTokens,
      userChars: Object.values(userCharsStats || {}).reduce((a, b) => a + b, 0),
      avgDailyTokens,
      avgDailyCost: avgDailyCost.toFixed(2),
      activeDays: dailyUsage.size
    },
    modelUsage: sortedModels,
    projects: sortedProjects,
    activity: {
      daily: activityData,
      hourly: hourlyActivity
    },
    inferredTags,
    // Privacy settings
    privacy: {
      showProjects: true,
      showModels: true,
      showActivity: true,
      showTags: true
    }
  };

  return profile;
}

/**
 * Save profile to local file
 */
export function saveProfile(profile) {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
  writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
  return PROFILE_FILE;
}

/**
 * Load local profile
 */
export function loadProfile() {
  try {
    return JSON.parse(readFileSync(PROFILE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Get display name for model
 */
function getModelDisplayName(model) {
  const nameMap = {
    'claude-opus-4': 'Claude Opus 4',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'glm-5': 'GLM-5',
    'glm-4.7': 'GLM-4.7',
    'glm-4': 'GLM-4',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'deepseek-chat': 'DeepSeek Chat',
    'deepseek-coder': 'DeepSeek Coder'
  };

  const lowerModel = model.toLowerCase();
  for (const [key, name] of Object.entries(nameMap)) {
    if (lowerModel.includes(key)) return name;
  }
  return model.split('-')[0]?.toUpperCase() || model;
}

/**
 * Infer tags from project names and models
 */
function inferTags(projectNames, models) {
  const tags = new Set();

  // From models
  const modelKeywords = {
    'claude': ['Anthropic', 'Claude'],
    'gpt': ['OpenAI', 'GPT'],
    'glm': ['智谱', 'GLM'],
    'gemini': ['Google', 'Gemini'],
    'deepseek': ['DeepSeek']
  };

  for (const model of models) {
    const lowerModel = model.toLowerCase();
    for (const [keyword, tagList] of Object.entries(modelKeywords)) {
      if (lowerModel.includes(keyword)) {
        tagList.forEach(t => tags.add(t));
      }
    }
  }

  // From project names
  const projectKeywords = {
    'api': ['API', 'Backend'],
    'web': ['Web', 'Frontend'],
    'cli': ['CLI', 'Tool'],
    'bot': ['Bot', 'Automation'],
    'ai': ['AI', 'LLM'],
    'ml': ['ML', 'Data'],
    'data': ['Data'],
    'app': ['App'],
    'mobile': ['Mobile'],
    'react': ['React', 'Frontend'],
    'vue': ['Vue', 'Frontend'],
    'node': ['Node.js', 'Backend'],
    'python': ['Python'],
    'typescript': ['TypeScript'],
    'rust': ['Rust'],
    'go': ['Go']
  };

  for (const name of projectNames) {
    const lowerName = name.toLowerCase();
    for (const [keyword, tagList] of Object.entries(projectKeywords)) {
      if (lowerName.includes(keyword)) {
        tagList.forEach(t => tags.add(t));
      }
    }
  }

  return Array.from(tags).slice(0, 10);
}
