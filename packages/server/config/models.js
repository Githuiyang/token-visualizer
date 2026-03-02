// Model pricing configuration (per 1M tokens)
export const MODEL_PRICING = {
  // Claude models
  'claude-3-5-sonnet': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-5-sonnet-20240620': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-opus': { input: 15.0, output: 75.0, cached: 1.50 },
  'claude-3-sonnet': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-haiku': { input: 0.25, output: 1.25, cached: 0.03 },

  // GPT models
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },

  // GLM models (智谱)
  'glm-5': { input: 0.5, output: 0.5, cached: 0.05 },
  'glm-4.7': { input: 0.1, output: 0.1, cached: 0.01 },
  'glm-4': { input: 0.1, output: 0.1, cached: 0.01 },
  'glm-3-turbo': { input: 0.05, output: 0.05, cached: 0.005 },

  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28, cached: 0.014 },
  'deepseek-coder': { input: 0.14, output: 0.28, cached: 0.014 },

  // Unknown default
  'default': { input: 0.0, output: 0.0, cached: 0.0 },
};

export function getModelPricing(modelName) {
  // Try exact match first
  if (MODEL_PRICING[modelName]) {
    return MODEL_PRICING[modelName];
  }

  // Try partial match for versioned models
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelName.includes(key) || key.includes(modelName)) {
      return pricing;
    }
  }

  return MODEL_PRICING['default'];
}

export function formatModelName(modelName) {
  // Pretty print model names
  const nameMap = {
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'glm-5': 'GLM-5',
    'glm-4.7': 'GLM-4.7',
    'deepseek-chat': 'DeepSeek Chat',
    'deepseek-coder': 'DeepSeek Coder',
  };
  return nameMap[modelName] || modelName;
}

export function formatSourceName(source) {
  const sourceMap = {
    'claude-code': 'Claude Code',
    'opencode': 'OpenCode',
    'openclaw': 'OpenClaw',
    'ccusage': 'Claude Code',
  };
  return sourceMap[source] || source;
}
