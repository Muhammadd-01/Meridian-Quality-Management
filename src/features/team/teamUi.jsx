import React, { useEffect, useMemo, useRef, useState } from 'react';
import useCollection from '../../hooks/useCollection';
import { useSettings } from '../../lib/settings';
import { deptColor } from '../../data/teamData';

// Fixed avatar colours (not theme variables) so initials stay legible in both modes.
const AVATAR_TONES = [
  'bg-teal-800 text-primrose',
  'bg-primrose text-primary-ink',
  'bg-teal-500 text-white',
  'bg-accent text-white',
  'bg-teal-300 text-teal-900',
  'bg-rust text-white',
];

export const initialsOf = (name = '') => name.replace(/^Dr\.\s*/, '').split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
const toneFor = (key = '') => AVATAR_TONES[[...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES.length];

export function MemberAvatar({ name, size = 'md', ring = false, status }) {
  const sizes = { xs: 'w-6 h-6 text-[9px]', sm: 'w-8 h-8 text-[11px]', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-sm', xl: 'w-16 h-16 text-lg' };
  return (
    <span className="relative inline-flex shrink-0" title={name}>
      <span className={`${sizes[size]} rounded-full grid place-items-center font-bold ${toneFor(name)} ${ring ? 'ring-2 ring-[color:var(--surface-raised)]' : ''}`} aria-hidden="true">
        {initialsOf(name)}
      </span>
      {status && <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[color:var(--surface-raised)] ${status}`} />}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = 'sm' }) {
  const shown = names.slice(0, max);
  return (
    <span className="flex -space-x-2">
      {shown.map(n => <MemberAvatar key={n} name={n} size={size} ring />)}
      {names.length > max && (
        <span className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold bg-gray-100 text-gray-600 ring-2 ring-[color:var(--surface-raised)]">+{names.length - max}</span>
      )}
    </span>
  );
}

/** Circular progress meter; `color` is any CSS colour. */
export function ProgressRing({ value = 0, size = 64, stroke = 7, color = '#1C7D86', track = 'rgb(var(--c-gray-200))', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">{children}</span>
    </span>
  );
}

const PILL_TONES = {
  success: 'bg-success-50 text-success-600 ring-success/25',
  danger: 'bg-danger-50 text-danger-600 ring-danger/25',
  warning: 'bg-accent-50 text-accent-700 ring-accent/30',
  info: 'bg-info-50 text-info-600 ring-info/25',
  neutral: 'bg-gray-100 text-gray-600 ring-gray-300',
  primary: 'bg-primary-100 text-brand-strong ring-primary-400/40',
};

export function Pill({ tone = 'neutral', dot, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold ring-1 ring-inset whitespace-nowrap ${PILL_TONES[tone]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function DeptChip({ dept, className = '' }) {
  const color = deptColor(dept);
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-md text-[11.5px] font-semibold text-gray-800 whitespace-nowrap ${className}`}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {dept}
    </span>
  );
}

/** Small KPI tile used across Team pages. */
export function MiniStat({ icon: Icon, label, value, hint, tone = 'teal' }) {
  const tones = {
    teal: 'bg-teal-800 text-primrose',
    primrose: 'bg-primrose text-primary-ink',
    orange: 'bg-accent text-white',
    green: 'bg-success-500 text-white',
    red: 'bg-danger-500 text-white',
    bright: 'bg-teal-500 text-white',
  };
  return (
    <div className="card p-4 flex items-center gap-3.5 hover:-translate-y-0.5">
      <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 shadow-sm ${tones[tone]}`}><Icon size={20} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 leading-tight">{value}</p>
        {hint && <p className="text-[11.5px] text-gray-500 truncate">{hint}</p>}
      </div>
    </div>
  );
}

/** Team member names (from Project Management → Team) plus the signed-in user. */
export function useTeamMembers() {
  const [team] = useCollection('team');
  const [{ profile }] = useSettings();
  return useMemo(() => {
    const members = team.map(m => ({ name: m.name, department: m.department, role: m.role }));
    if (!members.some(m => m.name === profile.name)) members.unshift({ name: profile.name, department: 'Management', role: profile.title });
    return { members, me: profile.name, departmentOf: (name) => members.find(m => m.name === name)?.department || '' };
  }, [team, profile.name, profile.title]);
}

/** Ticking clock, updated every `ms`. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Popover state that closes on outside click or Escape. */
export function usePopover() {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (open === null) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return [open, setOpen, ref];
}

/** Segmented tab control in the primrose / teal palette. */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex p-1 rounded-lg bg-surface-raised border border-[color:var(--border-subtle)] gap-1">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
            value === o.value ? 'bg-primary text-primary-ink shadow-glow-primary' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {o.icon && <o.icon size={14} aria-hidden="true" />}
          {o.label}
          {o.count != null && (
            <span className={`min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold ${value === o.value ? 'bg-teal-800 text-primrose' : 'bg-gray-100 text-gray-600'}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
