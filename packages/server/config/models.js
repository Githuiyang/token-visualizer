// Model pricing configuration (per 1M tokens)
// Updated 2025 - Latest pricing from official sources
export const MODEL_PRICING = {
  // ========== Claude Models ==========
  'claude-3-5-sonnet': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-5-sonnet-20240620': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-5-haiku': { input: 1.0, output: 5.0, cached: 0.10 },
  'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0, cached: 0.10 },
  'claude-3-opus': { input: 15.0, output: 75.0, cached: 1.50 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0, cached: 1.50 },
  'claude-3-sonnet': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-sonnet-20240229': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-3-haiku': { input: 0.25, output: 1.25, cached: 0.03 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25, cached: 0.03 },
  // Claude aliases
  'claude-opus': { input: 15.0, output: 75.0, cached: 1.50 },
  'claude-sonnet': { input: 3.0, output: 15.0, cached: 0.30 },
  'claude-haiku': { input: 0.25, output: 1.25, cached: 0.03 },

  // ========== GPT Models ==========
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-2024-05-13': { input: 5.0, output: 15.0 },
  'gpt-4o-2024-08-06': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o-mini-2024-07-18': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4-turbo-2024-04-09': { input: 10.0, output: 30.0 },
  'gpt-4-turbo-preview': { input: 10.0, output: 30.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-4-0613': { input: 30.0, output: 60.0 },
  'gpt-4-32k': { input: 60.0, output: 120.0 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'gpt-3.5-turbo-0125': { input: 0.50, output: 1.50 },
  'gpt-3.5-turbo-1106': { input: 1.10, output: 2.20 },
  'gpt-3.5-turbo-16k': { input: 0.30, output: 1.00 },
  'gpt-3.5-turbo-instruct': { input: 1.50, output: 2.00 },
  // GPT aliases
  'gpt4': { input: 30.0, output: 60.0 },
  'gpt35': { input: 0.50, output: 1.50 },
  'gpt-35-turbo': { input: 0.50, output: 1.50 },

  // ========== o1 Series (OpenAI) ==========
  'o1-preview': { input: 15.0, output: 60.0 },
  'o1-preview-2024-09-12': { input: 15.0, output: 60.0 },
  'o1-mini': { input: 1.10, output: 4.40 },
  'o1-mini-2024-09-12': { input: 1.10, output: 4.40 },
  'o1': { input: 15.0, output: 60.0 },

  // ========== Gemini (Google) ==========
  'gemini-2.0-flash-exp': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash-thinking-exp': { input: 0.588, output: 1.76 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-pro-001': { input: 1.25, output: 5.0 },
  'gemini-1.5-pro-002': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash-001': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash-002': { input: 0.075, output: 0.30 },
  'gemini-1.0-pro': { input: 0.50, output: 1.50 },
  'gemini-ultra': { input: 2.50, output: 10.0 },

  // ========== GLM (智谱) ==========
  // 官网: https://open.bigmodel.cn/pricing
  // 汇率: 1 USD ≈ 7.2 CNY

  // GLM-5 (旗舰模型，面向 Coding 与 Agent)
  // 输入: 4-6元/M, 输出: 18-22元/M
  'glm-5': { input: 0.83, output: 3.1, cached: 0.08 },
  'glm-5-code': { input: 1.11, output: 4.44, cached: 0.11 },

  // GLM-4.7 (高性能)
  // 输入: 2-4元/M, 输出: 8-16元/M
  'glm-4.7': { input: 0.56, output: 2.2, cached: 0.05 },

  // GLM-4.5
  // 微调: 0.1元/M 输入
  'glm-4.5': { input: 0.014, output: 0.017, cached: 0.002 },

  // GLM-4.5-Air (高性价比)
  // 输入: 0.8-1.2元/M, 输出: 2-8元/M
  'glm-4.5-air': { input: 0.17, output: 1.1, cached: 0.01 },

  // GLM-4-Plus (高智能旗舰)
  // 输入: 5元/M, 输出: 2.5元/M
  'glm-4-plus': { input: 0.69, output: 0.35, cached: 0.04 },
  'glm-4': { input: 0.69, output: 0.35, cached: 0.04 },

  // GLM-4-Air (高性价比)
  // 输入: 0.5元/M, 输出: 0.25元/M
  'glm-4-air': { input: 0.07, output: 0.03, cached: 0.005 },

  // GLM-4-FlashX (高速低价)
  // 输入: 0.1元/M, 输出: 0.05元/M
  'glm-4-flashx': { input: 0.014, output: 0.007, cached: 0.001 },

  // GLM-4.7-FlashX
  // 输入: 0.5元/M, 输出: 3元/M
  'glm-4.7-flashx': { input: 0.07, output: 0.42, cached: 0.005 },

  // GLM-4-Flash (免费)
  'glm-4-flash': { input: 0, output: 0, cached: 0 },

  // GLM-4-Long (超长输入)
  // 输入: 1元/M, 输出: 0.5元/M
  'glm-4-long': { input: 0.14, output: 0.07, cached: 0.01 },

  // GLM-Z1 系列
  'glm-z1-air': { input: 0.07, output: 0, cached: 0 },
  'glm-z1-airx': { input: 0.69, output: 0, cached: 0 },
  'glm-z1-flashx': { input: 0.014, output: 0, cached: 0 },

  // 旧版模型
  'glm-3-turbo': { input: 0.05, output: 0.05, cached: 0.005 },
  'chatglm3': { input: 0.05, output: 0.05, cached: 0.005 },
  'glm-4.6': { input: 0.69, output: 0.35, cached: 0.04 },

  // ========== DeepSeek ==========
  'deepseek-chat': { input: 0.14, output: 0.28, cached: 0.014 },
  'deepseek-coder': { input: 0.14, output: 0.28, cached: 0.014 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
  'deepseek-v3': { input: 0.14, output: 0.28 },
  'deepseek-r1': { input: 0.55, output: 2.19 },

  // ========== Qwen (阿里) ==========
  'qwen-max': { input: 0.02, output: 0.06 },
  'qwen-plus': { input: 0.004, output: 0.012 },
  'qwen-turbo': { input: 0.0008, output: 0.002 },
  'qwen-long': { input: 0.0005, output: 0.002 },
  'qwq-32b-preview': { input: 0.02, output: 0.06 },

  // ========== Llama (Meta) ==========
  'llama-3.1-405b': { input: 0.80, output: 0.80 },
  'llama-3.1-70b': { input: 0.35, output: 0.35 },
  'llama-3.1-8b': { input: 0.05, output: 0.05 },
  'llama-3-70b': { input: 0.35, output: 0.35 },
  'llama-3-8b': { input: 0.05, output: 0.05 },
  'llama-2-70b': { input: 0.35, output: 0.35 },

  // ========== Mistral ==========
  'mistral-large': { input: 4.0, output: 12.0 },
  'mistral-large-2402': { input: 4.0, output: 12.0 },
  'mistral-medium': { input: 2.70, output: 8.10 },
  'mistral-small': { input: 0.20, output: 0.60 },
  'mistral-7b': { input: 0.05, output: 0.05 },
  'mixtral-8x7b': { input: 0.50, output: 0.50 },
  'mixtral-8x22b': { input: 2.0, output: 2.0 },
  'codestral': { input: 0.50, output: 0.50 },

  // ========== Cohere ==========
  'command-r-plus': { input: 3.0, output: 15.0 },
  'command-r': { input: 0.50, output: 1.50 },
  'command': { input: 0.50, output: 1.50 },
  'command-light': { input: 0.15, output: 0.60 },

  // ========== Other Chinese Models ==========
  'baichuan2': { input: 0.05, output: 0.05 },
  'yi-large': { input: 0.25, output: 0.25 },
  'yi-medium': { input: 0.025, output: 0.025 },
  'yi-spark': { input: 0.01, output: 0.01 },
  'moonshot-v1-128k': { input: 0.012, output: 0.012 },
  'moonshot-v1-32k': { input: 0.012, output: 0.012 },
  'moonshot-v1-8k': { input: 0.012, output: 0.012 },
  'hunyuan': { input: 0.05, output: 0.15 },
  'hunyuan-lite': { input: 0.008, output: 0.008 },

  // ========== Anthropic Claude (older names) ==========
  'claude-2': { input: 8.0, output: 24.0 },
  'claude-2.1': { input: 8.0, output: 24.0 },
  'claude-instant-1.2': { input: 0.80, output: 2.40 },

  // ========== Default fallback ==========
  'default': { input: 0.0, output: 0.0, cached: 0.0 },
};

export function getModelPricing(modelName) {
  const name = modelName.toLowerCase().trim();

  // Try exact match first
  if (MODEL_PRICING[name]) {
    return MODEL_PRICING[name];
  }

  // Try partial match for versioned models
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (name.includes(key) || key.includes(name)) {
      return pricing;
    }
  }

  return MODEL_PRICING['default'];
}

export function formatModelName(modelName) {
  const name = modelName.toLowerCase();
  const nameMap = {
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku': 'Claude 3.5 Haiku',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'o1-preview': 'o1-preview',
    'o1-mini': 'o1-mini',
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash Exp',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'glm-5': 'GLM-5',
    'glm-4.7': 'GLM-4.7',
    'glm-4': 'GLM-4',
    'deepseek-chat': 'DeepSeek Chat',
    'deepseek-coder': 'DeepSeek Coder',
    'deepseek-reasoner': 'DeepSeek Reasoner',
    'qwen-max': 'Qwen Max',
    'qwen-plus': 'Qwen Plus',
    'qwen-turbo': 'Qwen Turbo',
    'llama-3.1-405b': 'Llama 3.1 405B',
    'mistral-large': 'Mistral Large',
    'mixtral-8x7b': 'Mixtral 8x7B',
    'command-r-plus': 'Command R+',
    'command-r': 'Command R',
  };
  return nameMap[name] || modelName;
}

export function formatSourceName(source) {
  const sourceMap = {
    'claude-code': 'Claude Code',
    'opencode': 'OpenCode',
    'openclaw': 'OpenClaw',
    'ccusage': 'Claude Code',
    'codex': 'Codex',
    'cursor': 'Cursor',
  };
  return sourceMap[source] || source;
}
