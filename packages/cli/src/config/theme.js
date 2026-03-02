/**
 * GitHub-inspired theme configuration
 */
export const GITHUB_THEME = {
  // Background colors
  background: '#0d1117',
  cardBg: '#161b22',
  cardBgHover: '#1c2128',

  // Text colors
  text: '#c9d1d9',
  textMuted: '#8b949e',
  textDim: '#6e7681',

  // Brand colors
  green: '#238636',
  greenLight: '#2ea043',
  greenDark: '#1a6327',
  greenGlow: '#3fb950',

  // Border colors
  border: '#30363d',
  borderLight: '#384147',

  // Accent colors
  blue: '#58a6ff',
  purple: '#bc8cff',
  orange: '#d29922',
  red: '#f85149',

  // Gradients
  gradient: ['#238636', '#2ea043', '#3fb950'],
  gradientSoft: ['rgba(35, 134, 54, 0.2)', 'rgba(46, 160, 67, 0.1)', 'rgba(63, 185, 80, 0.05)'],

  // Heatmap colors (GitHub-style green scale)
  heatmap: [
    '#161b22', // empty
    '#0e4429', // level 1
    '#006d32', // level 2
    '#26a641', // level 3
    '#39d353', // level 4
  ],

  // Chart colors (multi-model)
  chartColors: [
    '#238636', // green
    '#58a6ff', // blue
    '#bc8cff', // purple
    '#d29922', // orange
    '#f85149', // red
    '#3fb950', // light green
    '#a5d6ff', // light blue
    '#ffd78d', // yellow
  ],
};

/**
 * Font configuration
 */
export const FONTS = {
  family: '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
  mono: 'SF Mono, Segoe UI Mono, Roboto Mono, monospace',
};

/**
 * Layout dimensions
 */
export const DIMENSIONS = {
  width: 1200,
  height: 800,
  padding: 48,
  cardPadding: 32,
  borderRadius: 12,
};
