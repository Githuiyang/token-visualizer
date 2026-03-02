/**
 * Overview card component - displays summary statistics
 */
import { GITHUB_THEME, FONTS, DIMENSIONS } from '../config/theme.js';
import { formatTokens, formatCost, getDateRange } from '../calculator.js';

/**
 * Generate SVG for overview card
 */
export function generateOverviewCard(stats, buckets, options = {}) {
  const { width = DIMENSIONS.width } = options;
  const dateRange = getDateRange(buckets);

  const formatDate = (d) => d?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'N/A';

  const lines = [
    // Header background
    `<rect x="0" y="0" width="${width}" height="120" fill="${GITHUB_THEME.cardBg}" rx="${DIMENSIONS.borderRadius}"/>`,
    `<rect x="0" y="120" width="${width}" height="1" fill="${GITHUB_THEME.border}"/>`,

    // Title
    `<text x="${DIMENSIONS.padding}" y="48" font-family="${FONTS.family}" font-size="24" font-weight="600" fill="${GITHUB_THEME.text}">AI Token Usage</text>`,

    // Date range
    `<text x="${DIMENSIONS.padding}" y="76" font-family="${FONTS.family}" font-size="14" fill="${GITHUB_THEME.textMuted}">${formatDate(dateRange.start)} - ${formatDate(dateRange.end)} · ${dateRange.days} days</text>`,

    // Stats - Total Tokens
    `<text x="${DIMENSIONS.padding}" y="108" font-family="${FONTS.family}" font-size="14" fill="${GITHUB_THEME.textMuted}">Total Tokens</text>`,
    `<text x="${DIMENSIONS.padding + 120}" y="108" font-family="${FONTS.family}" font-size="18" font-weight="600" fill="${GITHUB_THEME.text}">${formatTokens(stats.totalTokens)}</text>`,

    // Stats - Total Cost
    `<text x="${DIMENSIONS.padding + 280}" y="108" font-family="${FONTS.family}" font-size="14" fill="${GITHUB_THEME.textMuted}">Total Cost</text>`,
    `<text x="${DIMENSIONS.padding + 400}" y="108" font-family="${FONTS.family}" font-size="18" font-weight="600" fill="${GITHUB_THEME.greenGlow}">${formatCost(stats.totalCost)}</text>`,

    // Stats - Models
    `<text x="${DIMENSIONS.padding + 540}" y="108" font-family="${FONTS.family}" font-size="14" fill="${GITHUB_THEME.textMuted}">Models</text>`,
    `<text x="${DIMENSIONS.padding + 620}" y="108" font-family="${FONTS.family}" font-size="18" font-weight="600" fill="${GITHUB_THEME.text}">${stats.modelCount}</text>`,

    // Source badges
    ...generateSourceBadges(stats.bySource, width - DIMENSIONS.padding),
  ];

  return lines.join('\n');
}

function generateSourceBadges(bySource, xPos) {
  const sources = Object.entries(bySource);
  const badges = [];
  let xOffset = xPos;

  for (const [source, data] of sources.reverse()) {
    const displayName = source.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const text = `${displayName}: ${formatTokens(data.tokens)}`;

    // Measure text approximately (5.5 pixels per character)
    const textWidth = text.length * 6.5;
    xOffset -= textWidth + 32;

    badges.push(`
      <rect x="${xOffset}" y="86" width="${textWidth + 16}" height="24" rx="12" fill="${GITHUB_THEME.border}"/>
      <text x="${xOffset + 8}" y="103" font-family="${FONTS.family}" font-size="12" fill="${GITHUB_THEME.text}">${text}</text>
    `);
  }

  return badges;
}
