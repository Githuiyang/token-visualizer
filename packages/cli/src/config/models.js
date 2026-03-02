/**
 * Model pricing configuration
 * Prices in USD per million tokens
 */
export const MODEL_PRICING = {
  // OpenAI
  'gpt-4': { input: 30, output: 60, cached: 7.5 },
  'gpt-4o': { input: 2.5, output: 10, cached: 1.25 },
  'gpt-4o-mini': { input: 0.15, output: 0.6, cached: 0.075 },
  'o1': { input: 15, output: 60, cached: 7.5 },
  'o1-mini': { input: 1.10, output: 4.40, cached: 0.55 },
  'o3-mini': { input: 1.10, output: 4.40, cached: 0.55 },

  // Anthropic
  'claude-opus-4': { input: 15, output: 75, cached: 3.75 },
  'claude-opus-4-20250514': { input: 15, output: 75, cached: 3.75 },
  'claude-sonnet-4': { input: 3, output: 15, cached: 0.3 },
  'claude-sonnet-4-20250514': { input: 3, output: 15, cached: 0.3 },
  'claude-3-5-sonnet': { input: 3, output: 15, cached: 0.3 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15, cached: 0.3 },
  'claude-3-5-sonnet-20240620': { input: 3, output: 15, cached: 0.3 },
  'claude-3-opus': { input: 15, output: 75, cached: 3.75 },
  'claude-3-opus-20240229': { input: 15, output: 75, cached: 3.75 },
  'claude-3-sonnet': { input: 3, output: 15, cached: 0.3 },
  'claude-3-haiku': { input: 0.25, output: 1.25, cached: 0.03 },

  // 智谱 AI (GLM) - 智谱AI bigmodel.cn
  // 1元 ≈ 0.14美元
  'glm-5': { input: 0.7, output: 0.7, cached: 0.14 },
  'glm-4.7': { input: 0.7, output: 0.7, cached: 0.14 },
  'glm-4': { input: 0.7, output: 0.7, cached: 0.14 },
  'glm-3': { input: 0.14, output: 0.14, cached: 0.028 },

  // Google
  'gemini-2.5-pro': { input: 1.25, output: 10, cached: 0.31 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30, cached: 0.019 },
  'gemini-1.5-pro': { input: 1.25, output: 5, cached: 0.31 },
  'gemini-1.5-flash': { input: 0.075, output: 0.15, cached: 0.019 },

  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28, cached: 0.014 },
  'deepseek-coder': { input: 0.14, output: 0.28, cached: 0.014 },
  'deepseek-reasoner': { input: 0.55, output: 2.19, cached: 0.055 },

  // OpenRouter (approximate)
  'openrouter': { input: 1, output: 1, cached: 0.1 },
};

/**
 * Calculate cost in USD for a model
 */
export function calculateCost(model, inputTokens, outputTokens, cachedTokens = 0) {
  // Try exact match first
  let pricing = MODEL_PRICING[model];

  // Try prefix match for model versions
  if (!pricing) {
    const baseModel = Object.keys(MODEL_PRICING).find(key => model.startsWith(key));
    if (baseModel) {
      pricing = MODEL_PRICING[baseModel];
    }
  }

  if (!pricing) {
    return { input: 0, output: 0, cached: 0, total: 0 };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cachedCost = (cachedTokens / 1_000_000) * pricing.cached;
  const total = inputCost + outputCost + cachedCost;

  return { input: inputCost, output: outputCost, cached: cachedCost, total };
}

/**
 * Get model display name (shorten long model names)
 */
export function getModelDisplayName(model) {
  const nameMap = {
    'claude-opus-4': 'Claude Opus 4',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'deepseek-chat': 'DeepSeek Chat',
    'deepseek-coder': 'DeepSeek Coder',
  };

  // Try exact match
  if (nameMap[model]) return nameMap[model];

  // Try prefix match
  const baseModel = Object.keys(nameMap).find(key => model.startsWith(key));
  if (baseModel) return nameMap[baseModel];

  // Return first part of model name
  return model.split('-')[0]?.toUpperCase() || model;
}
