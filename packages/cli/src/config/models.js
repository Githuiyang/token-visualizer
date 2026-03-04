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
  // 官网: https://open.bigmodel.cn/pricing
  // 汇率: 1 USD ≈ 7.2 CNY

  // GLM-5 (旗舰模型，面向 Coding 与 Agent)
  // 输入: 4-6元/M, 输出: 18-22元/M
  'glm-5': { input: 0.83, output: 3.1, cached: 0.08 },
  'glm-5-code': { input: 1.11, output: 4.44, cached: 0.11 },

  // GLM-4.7 (高性能)
  // 输入: 2-4元/M, 输出: 8-16元/M
  'glm-4.7': { input: 0.56, output: 2.2, cached: 0.05 },
  'glm-4.7-free': { input: 0, output: 0, cached: 0 },

  // GLM-4.5
  'glm-4.5': { input: 0.014, output: 0.017, cached: 0.002 },

  // GLM-4.5-Air (高性价比)
  'glm-4.5-air': { input: 0.17, output: 1.1, cached: 0.01 },

  // GLM-4-Plus (高智能旗舰)
  'glm-4-plus': { input: 0.69, output: 0.35, cached: 0.04 },
  'glm-4': { input: 0.69, output: 0.35, cached: 0.04 },

  // GLM-4-Air (高性价比)
  'glm-4-air': { input: 0.07, output: 0.03, cached: 0.005 },

  // GLM-4-FlashX (高速低价)
  'glm-4-flashx': { input: 0.014, output: 0.007, cached: 0.001 },
  'glm-4-flash': { input: 0, output: 0, cached: 0 },

  // GLM-4.7-FlashX
  'glm-4.7-flashx': { input: 0.07, output: 0.42, cached: 0.005 },

  // GLM-4-Long (超长输入)
  'glm-4-long': { input: 0.14, output: 0.07, cached: 0.01 },

  // GLM-Z1 系列
  'glm-z1-air': { input: 0.07, output: 0, cached: 0 },
  'glm-z1-airx': { input: 0.69, output: 0, cached: 0 },
  'glm-z1-flashx': { input: 0.014, output: 0, cached: 0 },

  // 旧版模型
  'glm-4.6': { input: 0.69, output: 0.35, cached: 0.04 },
  'glm-3': { input: 0.01, output: 0.01, cached: 0.002 },

  // Moonshot AI (Kimi)
  'kimi-k2.5': { input: 0.5, output: 0.5, cached: 0.05 },
  'kimi-k2.5-free': { input: 0, output: 0, cached: 0 },

  // MiniMax
  'minimax-m2.5-free': { input: 0, output: 0, cached: 0 },

  // Bigmodel
  'big-pickle': { input: 0, output: 0, cached: 0 },

  // GPT variants
  'gpt-5-nano': { input: 0.1, output: 0.1, cached: 0.01 },

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
 * Normalize model name (strip provider prefixes like zai/, openai/, etc.)
 */
export function normalizeModelName(model) {
  if (!model) return 'unknown';
  // Remove provider prefixes
  return model.replace(/^(zai|openai|anthropic|provider)\//, '');
}

/**
 * Calculate cost in USD for a model
 */
export function calculateCost(model, inputTokens, outputTokens, cachedTokens = 0) {
  const normalizedModel = normalizeModelName(model);

  // Try exact match first
  let pricing = MODEL_PRICING[normalizedModel];

  // Try prefix match for model versions
  if (!pricing) {
    const baseModel = Object.keys(MODEL_PRICING).find(key => normalizedModel.startsWith(key));
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
  const normalizedModel = normalizeModelName(model);

  const nameMap = {
    'claude-opus-4': 'Claude Opus 4',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-5-nano': 'GPT-5 Nano',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'deepseek-chat': 'DeepSeek Chat',
    'deepseek-coder': 'DeepSeek Coder',
    'glm-5': 'GLM-5',
    'glm-4.7': 'GLM-4.7',
    'glm-4.7-free': 'GLM-4.7 Free',
    'glm-4.6': 'GLM-4.6',
    'glm-4.5': 'GLM-4.5',
    'glm-4.5-air': 'GLM-4.5 Air',
    'glm-4': 'GLM-4',
    'kimi-k2.5': 'Kimi K2.5',
    'kimi-k2.5-free': 'Kimi K2.5 Free',
    'minimax-m2.5-free': 'MiniMax M2.5 Free',
    'big-pickle': 'Big Pickle',
  };

  // Try exact match
  if (nameMap[normalizedModel]) return nameMap[normalizedModel];

  // Try prefix match
  const baseModel = Object.keys(nameMap).find(key => normalizedModel.startsWith(key));
  if (baseModel) return nameMap[baseModel];

  // Return first part of normalized model name
  return normalizedModel.split('-')[0]?.toUpperCase() || model;
}
