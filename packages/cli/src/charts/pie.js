/**
 * Pie chart component - shows model cost distribution
 */
import { GITHUB_THEME, FONTS, DIMENSIONS } from '../config/theme.js';
import { formatTokens, formatCost } from '../calculator.js';

/**
 * Generate ECharts option for pie chart
 */
export function generatePieOption(stats) {
  const data = stats.byModel.slice(0, 8).map((m, i) => ({
    value: m.cost,
    name: m.displayName,
    itemStyle: { color: GITHUB_THEME.chartColors[i % GITHUB_THEME.chartColors.length] },
  }));

  // Add "Others" if more than 8 models
  if (stats.byModel.length > 8) {
    const othersCost = stats.byModel.slice(8).reduce((sum, m) => sum + m.cost, 0);
    data.push({
      value: othersCost,
      name: 'Others',
      itemStyle: { color: GITHUB_THEME.textDim },
    });
  }

  return {
    backgroundColor: 'transparent',
    title: {
      text: 'Cost by Model',
      left: 'center',
      top: 10,
      textStyle: {
        color: GITHUB_THEME.text,
        fontSize: 16,
        fontFamily: FONTS.family,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c} ({d}%)',
      backgroundColor: GITHUB_THEME.cardBg,
      borderColor: GITHUB_THEME.border,
      textStyle: { color: GITHUB_THEME.text },
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: {
        color: GITHUB_THEME.textMuted,
        fontSize: 12,
        fontFamily: FONTS.family,
      },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: GITHUB_THEME.background,
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: GITHUB_THEME.text,
          },
        },
        labelLine: { show: false },
        data,
      },
    ],
  };
}

/**
 * Generate SVG pie chart (fallback without ECharts canvas)
 */
export function generatePieSVG(stats, width = 580, height = 340) {
  const cx = width * 0.35;
  const cy = height * 0.6;
  const radius = Math.min(width, height) * 0.28;

  const data = stats.byModel.slice(0, 6);
  const total = data.reduce((sum, m) => sum + m.cost, 0);
  const othersCost = stats.byModel.slice(6).reduce((sum, m) => sum + m.cost, 0);

  if (othersCost > 0) {
    data.push({ displayName: 'Others', cost: othersCost });
  }

  let startAngle = -Math.PI / 2;
  const slices = [];
  const legendItems = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const percentage = item.cost / total;
    const angle = percentage * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const color = GITHUB_THEME.chartColors[i % GITHUB_THEME.chartColors.length];

    // Draw slice
    const largeArc = angle > Math.PI ? 1 : 0;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    if (percentage > 0.01) {
      slices.push(`
        <path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"
              fill="${color}" stroke="${GITHUB_THEME.background}" stroke-width="2" rx="6"/>
      `);
    }

    startAngle = endAngle;

    // Legend item
    legendItems.push(`
      <rect x="${width - 160}" y="${80 + i * 28}" width="12" height="12" rx="2" fill="${color}"/>
      <text x="${width - 140}" y="${91 + i * 28}" font-family="${FONTS.family}" font-size="12" fill="${GITHUB_THEME.textMuted}">${item.displayName}</text>
      <text x="${width - 30}" y="${91 + i * 28}" font-family="${FONTS.family}" font-size="12" fill="${GITHUB_THEME.text}" text-anchor="end">${formatCost(item.cost)}</text>
    `);
  }

  // Inner circle for donut effect
  const innerRadius = radius * 0.6;
  slices.push(`
    <circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${GITHUB_THEME.background}"/>
    <text x="${cx}" y="${cy - 10}" font-family="${FONTS.family}" font-size="24" font-weight="600" fill="${GITHUB_THEME.text}" text-anchor="middle">${formatCost(stats.totalCost)}</text>
    <text x="${cx}" y="${cy + 15}" font-family="${FONTS.family}" font-size="12" fill="${GITHUB_THEME.textMuted}" text-anchor="middle">Total Cost</text>
  `);

  return `
    <!-- Title -->
    <text x="${width / 2}" y="30" font-family="${FONTS.family}" font-size="16" font-weight="600" fill="${GITHUB_THEME.text}" text-anchor="middle">Cost by Model</text>

    <!-- Pie slices -->
    ${slices.join('')}

    <!-- Legend -->
    ${legendItems.join('')}
  `;
}
