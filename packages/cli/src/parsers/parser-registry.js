/**
 * Parser registry - exports all available parsers
 */

// Re-export parser functions
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
};
