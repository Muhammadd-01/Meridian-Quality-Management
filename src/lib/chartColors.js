// Chart colours from the Lean Six Sigma palette. They are CSS variables
// (defined for light and dark mode in src/styles/index.css), so Recharts and
// sparkline fills and strokes follow the active theme.
export const CHART = {
  main: 'var(--chart-main)', // lead series: teal 2 on light, primrose on dark
  teal: 'var(--chart-teal)',
  primrose: 'var(--chart-primrose)',
  orange: 'var(--chart-orange)',
  soft: 'var(--chart-soft)',
  rust: 'var(--chart-rust)',
  bright: 'var(--chart-bright)',
  deep: 'var(--chart-deep)',
  wash: 'var(--chart-wash)', // primrose area fill
  success: '#1E8C55',
  danger: '#CF4A3B',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
};

// Categorical order for pies and multi-series bars.
export const CHART_SERIES = [CHART.teal, CHART.primrose, CHART.orange, CHART.soft, CHART.rust, CHART.bright];

export const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-raised)',
  boxShadow: 'var(--shadow-lg)',
  fontSize: '12px',
};
