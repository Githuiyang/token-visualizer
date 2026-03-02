/**
 * Claude Code parser using ccusage library
 */
import { loadSessionData } from 'ccusage/data-loader';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync, existsSync } from 'node:fs';
import { aggregateToBuckets } from './index.js';
import { calculateCost } from '../config/models.js';

const STATE_FILE = join(homedir(), '.token-visualizer', 'claude-code-state.json');

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

async function saveState(state) {
  const fs = await import('node:fs');
  const dir = join(homedir(), '.token-visualizer');
  if (!existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8');
}

/**
 * Resolve project name from ccusage session data.
 */
function resolveProject(session) {
  if (session.projectPath === 'Unknown Project') {
    return cleanProjectDir(session.sessionId);
  }
  return cleanProjectDir(session.projectPath);
}

/**
 * Clean a raw project directory name from ccusage.
 */
function cleanProjectDir(raw) {
  if (!raw || raw === 'unknown' || raw === 'Unknown Project') return 'unknown';
  const slashIdx = raw.indexOf('/');
  if (slashIdx !== -1) raw = raw.slice(0, slashIdx);
  return raw;
}

/**
 * Parse Claude Code usage data
 */
export async function parse() {
  let sessions;
  try {
    sessions = await loadSessionData({ mode: 'display' });
  } catch (error) {
    console.warn(`Could not load Claude Code data: ${error.message}`);
    return [];
  }

  if (!sessions || sessions.length === 0) return [];

  const state = loadState();
  const nextState = { ...state };
  const entries = [];

  for (const session of sessions) {
    const project = resolveProject(session);
    const sessionKey = `${session.projectPath}\0${session.sessionId}`;
    const prev = state[sessionKey] || {};

    for (const breakdown of session.modelBreakdowns || []) {
      const model = breakdown.modelName;
      const prevModel = prev[model] || { i: 0, o: 0, c: 0 };

      const deltaInput = (breakdown.inputTokens || 0) - (prevModel.i || 0);
      const deltaOutput = (breakdown.outputTokens || 0) - (prevModel.o || 0);
      const deltaCached = (breakdown.cacheReadTokens || 0) - (prevModel.c || 0);

      // Always record current cumulative totals for next run
      if (!nextState[sessionKey]) nextState[sessionKey] = {};
      nextState[sessionKey][model] = {
        i: breakdown.inputTokens || 0,
        o: breakdown.outputTokens || 0,
        c: breakdown.cacheReadTokens || 0,
      };

      // Only emit entries with positive deltas
      if (deltaInput <= 0 && deltaOutput <= 0 && deltaCached <= 0) continue;

      const cost = calculateCost(model, deltaInput, deltaOutput, deltaCached);

      entries.push({
        source: 'claude-code',
        model,
        project,
        timestamp: new Date(session.lastActivity),
        inputTokens: Math.max(0, deltaInput),
        outputTokens: Math.max(0, deltaOutput),
        cachedInputTokens: Math.max(0, deltaCached),
        reasoningOutputTokens: 0,
        cost,
      });
    }
  }

  // Save state for next run
  await saveState(nextState);

  return aggregateToBuckets(entries);
}
