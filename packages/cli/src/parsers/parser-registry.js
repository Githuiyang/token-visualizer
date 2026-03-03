/**
 * Parser registry - exports all available parsers
 */

// Re-export parser functions (opencode excluded from npm package - requires better-sqlite3)
export { parse as parseClaudeCode } from './claude-code.js';
export { parse as parseOpenclaw } from './openclaw.js';

// Registry mapping
export const registry = {
  'claude-code': async () => {
    const { parse } = await import('./claude-code.js');
    return parse();
  },
  'openclaw': async () => {
    const { parse } = await import('./openclaw.js');
    return parse();
  },
  'opencode': async () => {
    try {
      const { parse } = await import('./opencode.js');
      return parse();
    } catch (error) {
      // opencode parser requires better-sqlite3, not included in npm package
      console.warn('OpenCode parser not available (requires better-sqlite3)');
      return [];
    }
  },
};
