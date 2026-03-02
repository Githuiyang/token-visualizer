/**
 * Statistics calculator for aggregated buckets
 */
import { getModelDisplayName } from './config/models.js';

/**
 * Calculate overall statistics from buckets
 */
export function calculateStats(buckets) {
  const byModel = new Map();
  const bySource = new Map();
  const byDay = new Map();
  let totalTokens = 0;
  let totalCost = 0;

  for (const bucket of buckets) {
    const model = bucket.model;
    const source = bucket.source;
    const day = bucket.bucketStart.split('T')[0];

    // By model
    if (!byModel.has(model)) {
      byModel.set(model, {
        model,
        displayName: getModelDisplayName(model),
        source,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        cost: 0,
      });
    }
    const modelStats = byModel.get(model);
    modelStats.inputTokens += bucket.inputTokens;
    modelStats.outputTokens += bucket.outputTokens;
    modelStats.cachedTokens += bucket.cachedInputTokens;
    modelStats.totalTokens += bucket.totalTokens;
    modelStats.cost += bucket.cost.total;

    // By source
    if (!bySource.has(source)) {
      bySource.set(source, { tokens: 0, cost: 0 });
    }
    const sourceStats = bySource.get(source);
    sourceStats.tokens += bucket.totalTokens;
    sourceStats.cost += bucket.cost.total;

    // By day
    if (!byDay.has(day)) {
      byDay.set(day, { tokens: 0, cost: 0, requests: 0 });
    }
    const dayStats = byDay.get(day);
    dayStats.tokens += bucket.totalTokens;
    dayStats.cost += bucket.cost.total;
    dayStats.requests += 1;

    totalTokens += bucket.totalTokens;
    totalCost += bucket.cost.total;
  }

  // Sort models by cost
  const sortedModels = Array.from(byModel.values()).sort((a, b) => b.cost - a.cost);

  // Sort days chronologically
  const sortedDays = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return {
    totalTokens,
    totalCost,
    byModel: sortedModels,
    bySource: Object.fromEntries(bySource),
    byDay: sortedDays,
    modelCount: byModel.size,
    dayCount: byDay.size,
  };
}

/**
 * Format tokens for display (e.g., 1.2M, 450K)
 */
export function formatTokens(tokens) {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  } else if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Format cost for display (e.g., $15.35)
 */
export function formatCost(cost) {
  return `$${cost.toFixed(2)}`;
}

/**
 * Format date for display (e.g., "Jan 15")
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get date range from buckets
 */
export function getDateRange(buckets) {
  if (buckets.length === 0) {
    return { start: null, end: null, days: 0 };
  }

  const dates = buckets.map(b => new Date(b.bucketStart));
  const start = new Date(Math.min(...dates));
  const end = new Date(Math.max(...dates));
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return { start, end, days };
}
