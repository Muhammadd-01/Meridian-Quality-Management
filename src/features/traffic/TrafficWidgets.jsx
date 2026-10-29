import React, { useId } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/** % change badge. `inverse` = a rise is bad (e.g. bounce rate). */
export function TrendBadge({ value, inverse = false, suffix = '' }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-xs text-gray-400" title="No data for the previous period">—</span>;
  }
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const good = flat ? null : up !== inverse;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const color = good === null ? 'text-gray-500' : good ? 'text-success' : 'text-danger';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon size={12} aria-hidden="true" />
      <span className="sr-only">{flat ? 'unchanged' : up ? 'up' : 'down'} </span>
      {up ? '+' : ''}{value.toFixed(1)}%{suffix}
    </span>
  );
}

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Inline SVG trend line (no chart library needed for table cells and KPI
 * cards). `responsive` stretches to the container width; `fill` adds a soft
 * gradient area. The line draws in on mount.
 */
export function Sparkline({ values = [], width = 64, height = 20, color = 'var(--chart-main)', fill = false, responsive = false, strokeWidth = 1.6 }) {
  const gradientId = useId().replace(/:/g, '');
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2]);
  const line = smoothPath(pts);
  return (
    <svg
      width={responsive ? '100%' : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={responsive ? 'none' : undefined}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${gradientId})`} className="animate-fade-in" />
        </>
      )}
      <path
        d={line}
        pathLength="1"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="animate-draw"
      />
    </svg>
  );
}
