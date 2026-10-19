/**
 * Small UI pieces shared by the finance group pages.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TONE_BY_STATUS = {
  success: ['active', 'cleared', 'paid', 'approved', 'reimbursed', 'completed', 'confirmed', 'matched', 'posted', 'filed', 'income', 'deposit', 'balanced'],
  warning: ['pending', 'submitted', 'scheduled', 'open', 'in transit', 'pending approval', 'locked', 'dormant'],
  info: ['sent', 'reversed', 'transfer'],
  danger: ['overdue', 'rejected', 'failed', 'returned', 'frozen', 'blocked', 'void', 'cancelled', 'expense', 'withdrawal', 'unbalanced', 'unmatched', 'expired', 'closed'],
};
const TONE_CLASS = { success: 'badge-success', warning: 'badge-warning', info: 'badge-info', danger: 'badge-danger', gray: 'badge-secondary', primary: 'badge-primary', accent: 'badge-accent' };

export function toneFor(status) {
  const s = String(status || '').toLowerCase();
  return Object.keys(TONE_BY_STATUS).find(t => TONE_BY_STATUS[t].includes(s)) || 'gray';
}

/** Status pill with finance-specific colours (Paid, Overdue, Frozen, Matched…). */
export function FinBadge({ status, tone, dot = true, className = '' }) {
  if (!status) return <span className="text-gray-400">—</span>;
  return <span className={`${TONE_CLASS[tone || toneFor(status)]} ${dot ? 'badge-dot' : ''} whitespace-nowrap ${className}`}>{status}</span>;
}

export const DemoTag = ({ show = true }) => (show ? <span className="badge-warning text-2xs" title="Seeded demo record">Demo</span> : null);

/** Signed amount, green for money in and red for money out. */
export function Amount({ value, format, className = '' }) {
  const v = Number(value) || 0;
  return (
    <span className={`font-semibold tabular-nums whitespace-nowrap ${v < 0 ? 'text-danger-600' : v > 0 ? 'text-success-600' : 'text-gray-700'} ${className}`}>
      {v < 0 ? '−' : v > 0 ? '+' : ''}{format(Math.abs(v))}
    </span>
  );
}

export function Delta({ value, suffix = '%', digits = 2, className = '' }) {
  const v = Number(value) || 0;
  const Icon = v >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${v >= 0 ? 'text-success-600' : 'text-danger-600'} ${className}`}>
      <Icon size={13} aria-hidden="true" />{v >= 0 ? '+' : '−'}{Math.abs(v).toFixed(digits)}{suffix}
    </span>
  );
}

/** Labelled form control with linked error message. */
export function Field({ id, label, error, required, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">{label}{required && <span className="text-danger"> *</span>}</label>
      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined,
      })}
      {hint && !error && <p id={`${id}-hint`} className="text-2xs text-gray-500 mt-1">{hint}</p>}
      {error && <p id={`${id}-error`} className="form-error">{error}</p>}
    </div>
  );
}

/** Pill tabs (role=tablist). */
export function PillTabs({ tabs, value, onChange, label }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label={label}>
      {tabs.map(t => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${value === t.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          {t.label}{t.count !== undefined && <span className="opacity-70"> ({t.count})</span>}
        </button>
      ))}
    </div>
  );
}

/** Row of links to sibling pages, shown under dashboard heroes. */
export function QuickLinks({ links }) {
  return (
    <nav aria-label="Related pages" className="flex flex-wrap gap-2">
      {links.map(l => (
        <Link key={l.to} to={l.to} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors">
          {l.icon && <l.icon size={13} aria-hidden="true" />}{l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Compact label/value pair used in summary strips. */
export function Stat({ label, value, sub, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5 tabular-nums break-words">{value}</p>
      {sub && <p className="text-2xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Simple usage meter. `tone` switches to warning/danger automatically when `auto`. */
export function Meter({ value, max, auto = true, tone = 'primary', label }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const t = auto ? (p >= 100 ? 'danger' : p >= 85 ? 'warning' : tone) : tone;
  const bar = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info' }[t];
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)} aria-label={label}>
      <div className={`h-full rounded-full ${bar} transition-[width] duration-700`} style={{ width: `${Math.max(p, value > 0 ? 2 : 0)}%` }} />
    </div>
  );
}
