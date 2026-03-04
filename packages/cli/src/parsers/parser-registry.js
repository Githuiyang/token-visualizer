/**
 * Parser registry - exports all available parsers
 */

// Re-export parser functions (opencode excluded from npm package - requires better-sqlite3)
export { parse as parseClaudeCode } from './claude-code.js';
export { parse as parseOpenclaw } from './openclaw.js';

// Registry mapping - each parser receives options parameter
export const registry = {
  'claude-code': async (options = {}) => {
    const { parse } = await import('./claude-code.js');
    return parse(options);
  },
  'openclaw': async (options = {}) => {
    const { parse } = await import('./openclaw.js');
    return parse(options);
  },
  'opencode': async (options = {}) => {
    try {
      const { parse } = await import('./opencode.js');
      return parse(options);
    } catch (error) {
      // opencode parser requires better-sqlite3, not included in npm package
      console.warn('OpenCode parser not available (requires better-sqlite3)');
      return [];
    }
  },
};
