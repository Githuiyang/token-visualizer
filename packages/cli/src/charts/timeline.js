/**
 * Timeline chart component - shows daily usage trends (GitHub-style heatmap)
 */
import { GITHUB_THEME, FONTS } from '../config/theme.js';
import { formatDate, formatTokens } from '../calculator.js';

/**
 * Generate GitHub-style contribution heatmap
 */
export function generateHeatmapSVG(byDay, width = 1200, height = 200, startY = 480) {
  if (byDay.length === 0) {
    return `
      <text x="${width / 2}" y="${startY + 80}" font-family="${FONTS.family}" font-size="14" fill="${GITHUB_THEME.textMuted}" text-anchor="middle">No data available</text>
    `;
  }

  const padding = 48;
  const chartWidth = width - padding * 2;
  const cellSize = Math.min(14, Math.floor(chartWidth / byDay.length));
  const gap = 3;
  const actualCellSize = cellSize - gap;

  // Find max for scaling
  const maxTokens = Math.max(...byDay.map(([, d]) => d.tokens));
  const maxCost = Math.max(...byDay.map(([, d]) => d.cost));

  const cells = [];

  for (let i = 0; i < byDay.length; i++) {
    const [day, data] = byDay[i];
    const x = padding + i * cellSize;
    const y = startY + 40;

    // Determine color level based on tokens
    const normalized = data.tokens / maxTokens;
    let level = 0;
    if (normalized > 0) level = 1;
    if (normalized > 0.25) level = 2;
    if (normalized > 0.5) level = 3;
    if (normalized > 0.75) level = 4;

    const color = GITHUB_THEME.heatmap[level];

    cells.push(`
      <rect x="${x}" y="${y}" width="${actualCellSize}" height="${actualCellSize}" rx="2" fill="${color}">
        <title>${day}: ${formatTokens(data.tokens)} · $${data.cost.toFixed(2)}</title>
      </rect>
    `);
  }

  // Add scale labels
  const scaleY = startY + 100;
  const scaleLabels = [
    { label: 'Less', x: padding },
    { label: 'More', x: padding + (byDay.length - 1) * cellSize },
  ];

  return `
    <!-- Title -->
    <text x="${padding}" y="${startY + 20}" font-family="${FONTS.family}" font-size="16" font-weight="600" fill="${GITHUB_THEME.text}">Daily Activity</text>

    <!-- Heatmap cells -->
    ${cells.join('')}

    <!-- Scale -->
    <text x="${padding}" y="${scaleY}" font-family="${FONTS.family}" font-size="11" fill="${GITHUB_THEME.textMuted}">Less</text>
    <rect x="${padding + 35}" y="${scaleY - 8}" width="11" height="11" rx="2" fill="${GITHUB_THEME.heatmap[0]}"/>
    <rect x="${padding + 49}" y="${scaleY - 8}" width="11" height="11" rx="2" fill="${GITHUB_THEME.heatmap[1]}"/>
    <rect x="${padding + 63}" y="${scaleY - 8}" width="11" height="11" rx="2" fill="${GITHUB_THEME.heatmap[2]}"/>
    <rect x="${padding + 77}" y="${scaleY - 8}" width="11" height="11" rx="2" fill="${GITHUB_THEME.heatmap[3]}"/>
    <rect x="${padding + 91}" y="${scaleY - 8}" width="11" height="11" rx="2" fill="${GITHUB_THEME.heatmap[4]}"/>
    <text x="${padding + 108}" y="${scaleY}" font-family="${FONTS.family}" font-size="11" fill="${GITHUB_THEME.textMuted}">More</text>
  `;
}

/**
 * Generate bar chart for daily usage
 */
export function generateBarChartSVG(byDay, width = 580, height = 340) {
  if (byDay.length === 0) {
    return `
      <text x="${width / 2}" y="${height / 2}" font-family="${FONTS.family}" font-size="14" fill="${GITHUB_THEME.textMuted}" text-anchor="middle">No data available</text>
    `;
  }

  const padding = { top: 40, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Sample data if too many days
  const sampledData = byDay.length > 30
    ? byDay.filter((_, i) => i % Math.ceil(byDay.length / 30) === 0)
    : byDay;

  const maxTokens = Math.max(...sampledData.map(([, d]) => d.tokens));
  const barWidth = Math.max(2, Math.min(20, (chartWidth / sampledData.length) - 4));

  const bars = sampledData.map(([day, data], i) => {
    const barHeight = (data.tokens / maxTokens) * chartHeight;
    const x = padding.left + i * (chartWidth / sampledData.length);
    const y = padding.top + chartHeight - barHeight;

    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${GITHUB_THEME.green}">
        <title>${day}: ${formatTokens(data.tokens)} · $${data.cost.toFixed(2)}</title>
      </rect>
    `;
  }).join('');

  // Y-axis labels
  const yTicks = 5;
  const yAxis = Array.from({ length: yTicks }, (_, i) => {
    const value = (maxTokens * (i + 1)) / yTicks;
    const y = padding.top + chartHeight - (chartHeight * (i + 1)) / yTicks;
    return `
      <text x="${padding.left - 10}" y="${y + 4}" font-family="${FONTS.family}" font-size="10" fill="${GITHUB_THEME.textMuted}" text-anchor="end">${formatTokens(Math.round(value))}</text>
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${GITHUB_THEME.border}" stroke-dasharray="2,2"/>
    `;
  }).join('');

  // X-axis labels (show first, middle, last)
  const xLabels = [
    sampledData[0]?.[0],
    sampledData[Math.floor(sampledData.length / 2)]?.[0],
    sampledData[sampledData.length - 1]?.[0],
  ].filter(Boolean).map((date, i) => {
    const x = padding.left + (i * chartWidth / 2);
    return `<text x="${x}" y="${height - 10}" font-family="${FONTS.family}" font-size="10" fill="${GITHUB_THEME.textMuted}" text-anchor="middle">${formatDate(date)}</text>`;
  }).join('');

  return `
    <!-- Title -->
    <text x="${width / 2}" y="${padding.top - 10}" font-family="${FONTS.family}" font-size="16" font-weight="600" fill="${GITHUB_THEME.text}" text-anchor="middle">Daily Token Usage</text>

    <!-- Y-axis -->
    ${yAxis}

    <!-- Bars -->
    ${bars}

    <!-- X-axis -->
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${GITHUB_THEME.border}"/>
    ${xLabels}
  `;
}
