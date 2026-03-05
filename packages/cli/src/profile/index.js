/**
 * Profile Module Index
 * Exports profile generation and analysis functions
 */
export {
  generateProfile,
  analyzeConversationPatterns,
  findSessionFiles
} from './generator.js';

export {
  detectGitHubRepos,
  fetchGitHubStats,
  aggregateGitHubStats,
  parseGitHubUrl
} from './github-detector.js';
