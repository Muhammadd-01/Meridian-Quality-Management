/**
 * Shared building blocks for the Applications pages (Chat, Email, Kanban …).
 * Theme tokens only, so light and dark mode both work.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info, Users } from 'lucide-react';
import { format, isToday, isYesterday, isValid, parseISO, differenceInCalendarDays } from 'date-fns';

export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const initials = (name = '') =>
  String(name).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const AVATAR_TONES = [
  'bg-primary-50 text-primary-700',
  'bg-info-50 text-info-700',
  'bg-accent-50 text-accent-700',
  'bg-success-50 text-success-700',
  'bg-danger-50 text-danger-700',
  'bg-violet-50 text-violet-700',
  'bg-warning-50 text-warning-700',
];

export const toneFor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
};

/** Tone → classes for small dots / chips used by folders, lists and columns. */
export const TONE_CLASSES = {
  primary: { dot: 'bg-primary-500', chip: 'bg-primary-50 text-primary-700', text: 'text-primary-600' },
  info: { dot: 'bg-info-500', chip: 'bg-info-50 text-info-700', text: 'text-info-600' },
  accent: { dot: 'bg-accent-500', chip: 'bg-accent-50 text-accent-700', text: 'text-accent-600' },
  success: { dot: 'bg-success-500', chip: 'bg-success-50 text-success-700', text: 'text-success-600' },
  warning: { dot: 'bg-warning-500', chip: 'bg-warning-50 text-warning-700', text: 'text-warning-600' },
  danger: { dot: 'bg-danger-500', chip: 'bg-danger-50 text-danger-700', text: 'text-danger-600' },
  gray: { dot: 'bg-gray-400', chip: 'bg-gray-100 text-gray-600', text: 'text-gray-500' },
};
export const TONE_KEYS = ['primary', 'info', 'accent', 'success', 'warning', 'danger'];

const SIZES = { xs: 'w-6 h-6 text-[9px]', sm: 'w-8 h-8 text-[11px]', md: 'w-10 h-10 text-xs', lg: 'w-14 h-14 text-base', xl: 'w-24 h-24 text-2xl' };

export function Avatar({ name, size = 'md', online, group = false, className = '' }) {
  return (
    <span className={`relative inline-grid place-items-center shrink-0 rounded-full font-bold ${SIZES[size]} ${toneFor(name)} ${className}`} aria-hidden="true">
      {group ? <Users size={size === 'xs' || size === 'sm' ? 13 : 17} /> : initials(name)}
      {online != null && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--surface-raised)] ${online ? 'bg-success-500' : 'bg-gray-300'}`} />
      )}
    </span>
  );
}

/**
 * Full-height multi-pane frame. On large screens panes sit side by side and
 * scroll independently; on small screens pages show one pane at a time.
 */
export function AppFrame({ children, className = '' }) {
  return (
    <div className={`flex gap-4 lg:gap-5 h-[calc(100dvh-196px)] min-h-[520px] lg:h-[calc(100dvh-230px)] lg:min-h-[560px] min-w-0 ${className}`}>
      {children}
    </div>
  );
}

/** A pane inside AppFrame: a card whose body scrolls. */
export function Pane({ children, className = '', as: Tag = 'section', label }) {
  return (
    <Tag aria-label={label} className={`card flex flex-col min-h-0 min-w-0 overflow-hidden ${className}`}>
      {children}
    </Tag>
  );
}

/** Plain statement that this app keeps its data in the browser. */
export function LocalNotice({ children, className = '' }) {
  return (
    <p className={`flex items-start gap-2 text-[11.5px] leading-snug text-gray-500 ${className}`}>
      <Info size={13} className="mt-px shrink-0 text-info-500" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function DemoBadge({ show }) {
  if (!show) return null;
  return <span className="badge-warning text-2xs" title="Demo record seeded on first load">Demo</span>;
}

/** Reads and clears `?q=` (used by global search links). */
export function useQueryParam(name = 'q') {
  const [params] = useSearchParams();
  return params.get(name) || '';
}

const toDate = (v) => (v instanceof Date ? v : typeof v === 'string' ? parseISO(v) : new Date(v));

/** Compact time label for lists: 09:20, Yesterday, 12 Oct. */
export function shortTime(iso) {
  const d = toDate(iso);
  if (!isValid(d)) return '';
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  if (Math.abs(differenceInCalendarDays(new Date(), d)) < 7) return format(d, 'EEE');
  return format(d, 'dd MMM');
}

export function fullTime(iso) {
  const d = toDate(iso);
  return isValid(d) ? format(d, 'dd MMM yyyy, HH:mm') : '';
}

export function dayLabel(iso) {
  const d = toDate(iso);
  if (!isValid(d)) return '';
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, dd MMM yyyy');
}

export function formatBytes(bytes = 0) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 10240 ? 1 : 0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(sec = 0) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

/** Read a File as a data URL. */
export function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Bytes used by this app's localStorage keys (UTF-16: 2 bytes per char) against a ~5 MB browser quota. */
export function localStorageUsage() {
  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k) bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
    }
  } catch {
    /* storage unavailable */
  }
  return { bytes, quota: 5 * 1024 * 1024 };
}

/** Whether a value under `key` was actually persisted (writes fail silently when storage is full). */
export function persisted(key, predicate) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? predicate(JSON.parse(raw)) : false;
  } catch {
    return false;
  }
}

/**
 * Local camera / microphone preview through getUserMedia. Nothing is sent
 * anywhere; tracks stop when the call ends or the page unmounts.
 */
export function useLocalMedia() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const streamRef = useRef(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async ({ video = true, audio = true } = {}) => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support camera or microphone access (it needs a secure https or localhost page).');
      return null;
    }
    setPending(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video, audio });
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = s;
      setStream(s);
      return s;
    } catch (e) {
      const name = e?.name || '';
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Permission was denied. Allow camera/microphone access in your browser’s site settings to see a local preview.'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? `No ${video ? 'camera or ' : ''}microphone was found on this device.`
            : name === 'NotReadableError'
              ? 'The device is in use by another application.'
              : 'Could not start the local preview.',
      );
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  const setEnabled = useCallback((kind, enabled) => {
    streamRef.current?.getTracks().filter(t => t.kind === kind).forEach(t => { t.enabled = enabled; });
  }, []);

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  return { stream, error, pending, start, stop, setEnabled, setError };
}

/** Live microphone level 0–1 from a MediaStream (for a simple meter). */
export function useAudioLevel(stream) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) { setLevel(0); return undefined; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return undefined;
    let raf;
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i];
      setLevel(Math.min(1, sum / data.length / 90));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); src.disconnect(); ctx.close().catch(() => {}); };
  }, [stream]);
  return level;
}

/** Seconds elapsed while `running` (paused while `paused`). */
export function useTimer(running, paused = false) {
  const [sec, setSec] = useState(0);
  useEffect(() => { if (!running) setSec(0); }, [running]);
  useEffect(() => {
    if (!running || paused) return undefined;
    const t = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, paused]);
  return sec;
}

/** Round icon button used in call screens and composers. */
export function IconButton({ icon: Icon, label, onClick, active = false, tone = 'default', size = 'md', disabled, className = '', ...rest }) {
  const dims = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const tones = {
    default: active ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-danger-500 text-white hover:bg-danger-600',
    success: 'bg-success-500 text-white hover:bg-success-600',
    ghost: active ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={tone === 'default' || tone === 'ghost' ? active : undefined}
      className={`grid place-items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${dims} ${tones[tone]} ${className}`}
      {...rest}
    >
      <Icon size={size === 'lg' ? 20 : size === 'sm' ? 15 : 17} aria-hidden="true" />
    </button>
  );
}

/** Search box with an accessible label. */
export function SearchField({ id, label, value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input pl-9" autoComplete="off" />
    </div>
  );
}

/** Pill tabs used for list filters (All / Unread / Groups …). */
export function FilterPills({ items, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map(i => (
        <button
          key={i.id}
          type="button"
          role="tab"
          aria-selected={value === i.id}
          onClick={() => onChange(i.id)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${value === i.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {i.label}
          {i.count != null && i.count > 0 && <span className={`text-[10px] font-bold ${value === i.id ? 'text-white/80' : 'text-gray-400'}`}>{i.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Sidebar navigation row (folders, lists, labels). */
export function NavRow({ icon: Icon, dot, label, count, active, onClick, countTone = 'gray', children, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={`w-full flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] font-medium transition-colors text-left ${active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
      {...rest}
    >
      {Icon && <Icon size={15} className="shrink-0" aria-hidden="true" />}
      {dot && <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />}
      <span className="flex-1 truncate">{label}</span>
      {children}
      {count != null && count > 0 && (
        <span className={`text-[10.5px] font-bold rounded-full px-1.5 min-w-[20px] text-center ${countTone === 'primary' ? 'bg-primary-600 text-white' : countTone === 'danger' ? 'bg-danger-500 text-white' : 'text-gray-400'}`}>{count}</span>
      )}
    </button>
  );
}
