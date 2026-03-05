# Profile Generation Feature

This module adds user profile generation capabilities to token-visualizer, including conversation analysis and GitHub project statistics.

## Features

### 1. Conversation Analysis (Privacy-Controlled)

Analyzes user conversation patterns to generate insights:

**Work Habits:**
- Active hours distribution
- Average session length
- Work style classification (night-owl / early-bird / regular)

**Communication Style:**
- Average message length
- Emoji usage frequency
- Code block usage
- Style classification (concise / detailed / balanced)

**Technical Preferences:**
- Focus areas (architecture, testing, debugging, optimization, etc.)
- Tools used (inferred from conversations)
- Keyword frequency analysis

**Common Tasks:**
- Task type detection (debugging, refactoring, feature-development, etc.)

### 2. GitHub Project Detection & Statistics

Detects and analyzes GitHub repositories:

- **Detection Sources:**
  - Git remote origin
  - package.json repository field
  - Session file content (GitHub URLs)

- **Statistics:**
  - Stars, forks, watchers
  - Language distribution
  - Repository descriptions
  - Activity timestamps

- **Caching:**
  - 24-hour local cache to minimize API calls
  - Automatic cache invalidation

## Usage

### Basic Profile (No Analysis)

```javascript
import { generateProfile, findSessionFiles } from './src/profile/index.js';

const sessionFiles = findSessionFiles();
const profile = await generateProfile({
  sessionFiles,
  analyzeConversations: false,
  includeGitHubStats: false
});
```

### With Conversation Analysis

```javascript
const profile = await generateProfile({
  sessionFiles,
  analyzeConversations: true, // Requires user consent
  includeGitHubStats: false
});
```

### Full Profile (Conversation + GitHub)

```javascript
const profile = await generateProfile({
  sessionFiles,
  analyzeConversations: true,
  includeGitHubStats: true,
  projectPath: process.cwd(),
  githubToken: process.env.GITHUB_TOKEN // Optional, for higher rate limits
});
```

## Configuration

Add to `~/.token-visualizer/config.json`:

```json
{
  "analyzeConversations": false,
  "includeGitHubStats": false,
  "githubToken": null
}
```

Or use environment variables:

```bash
export GITHUB_TOKEN="your-github-token"
```

## Privacy

**Conversation Analysis:**
- **Default:** OFF
- Requires explicit `analyzeConversations: true` option
- Only analyzes local session files
- No data sent to external servers

**GitHub Stats:**
- Only queries public repositories
- GitHub token optional (increases rate limit)
- Results cached locally (24h TTL)

## Output Structure

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-03-05T17:28:03.504Z",
  "metadata": {
    "analyzerVersion": "1.0.0",
    "options": {
      "analyzeConversations": true,
      "includeGitHubStats": true
    }
  },
  "conversationAnalysis": {
    "workHabits": {
      "activeHours": [10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22],
      "avgSessionLength": 177,
      "workStyle": "regular",
      "totalSessions": 10,
      "totalMessages": 6924
    },
    "communicationStyle": {
      "avgMessageLength": 1503,
      "emojiUsage": 0.064,
      "style": "detailed",
      "codeBlockUsage": 0.115
    },
    "technicalPreference": {
      "focusAreas": ["debugging", "optimization", "documentation"],
      "toolsUsed": ["git", "package-manager", "database", "containers"],
      "keywords": {...}
    },
    "commonTasks": ["debugging", "refactoring", "feature-development"]
  },
  "githubStats": {
    "totalStars": 560000,
    "totalForks": 94350,
    "repoCount": 43,
    "topRepos": [...],
    "languages": {
      "TypeScript": 8,
      "Python": 12,
      "JavaScript": 8
    }
  }
}
```

## Error Handling

- **Conversation Analysis:** Gracefully handles missing/invalid files
- **GitHub API:** Handles rate limits, private repos, network errors
- **Caching:** Falls back to fresh data if cache corrupted

## Testing

Run the test script:

```bash
cd packages/cli
node test-profile.js
```

This will generate three profiles:
1. Basic (no analysis)
2. With conversation analysis
3. Full profile (conversation + GitHub)
