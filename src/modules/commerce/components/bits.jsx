/** Small presentational pieces shared by the commerce pages. */
import React from 'react';
import { Star, FileText, GraduationCap, Ruler, Gauge, BookOpen, HardHat, Package, Gift } from 'lucide-react';
import { ToneBadge } from '../../../components/module/DashboardKit';
import { stockState } from '../lib';

export function Stars({ value = 0, size = 13, label }) {
  const v = Math.round(Number(value) * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label || `${Number(value).toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} aria-hidden="true"
          className={n <= v ? 'fill-accent-400 text-accent-400' : n - 0.5 === v ? 'fill-accent-200 text-accent-400' : 'text-gray-300'} />
      ))}
    </span>
  );
}

const CATEGORY_LOOK = [
  [/toolkit|template|documentation/i, FileText, 'bg-primary-50 text-primary-600'],
  [/training|certification|course/i, GraduationCap, 'bg-info-50 text-info-600'],
  [/calibration/i, Gauge, 'bg-accent-50 text-accent-600'],
  [/measur|instrument/i, Ruler, 'bg-success-50 text-success-600'],
  [/book|standard/i, BookOpen, 'bg-warning-50 text-warning-600'],
  [/safety|5s/i, HardHat, 'bg-danger-50 text-danger-600'],
  [/gift/i, Gift, 'bg-accent-50 text-accent-600'],
];
export function categoryLook(category = '') {
  const hit = CATEGORY_LOOK.find(([re]) => re.test(category));
  return hit ? { Icon: hit[1], tile: hit[2] } : { Icon: Package, tile: 'bg-gray-100 text-gray-600' };
}

export function ProductThumb({ category, size = 36 }) {
  const { Icon, tile } = categoryLook(category);
  return (
    <span className={`grid place-items-center rounded-lg shrink-0 ${tile}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.45)} />
    </span>
  );
}

export function StockBadge({ product }) {
  const s = stockState(product);
  return <ToneBadge tone={s.tone} dot>{s.label}</ToneBadge>;
}

export function DemoTag({ show }) {
  return show ? <span className="badge-warning text-2xs" title="Seeded demo record">Demo</span> : null;
}
