/**
 * Small helpers shared by the people module pages (dates, maths, labels).
 * Dates are local-time YYYY-MM-DD strings so "today" matches the user's clock.
 */
const pad = (n) => String(n).padStart(2, '0');

export const toDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toDay(new Date());
export const dayOffset = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return toDay(d); };
export const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
export const hoursAgo = (h) => minutesAgo(h * 60);
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const monthLabel = (key) => {
  const [y, m] = String(key).split('-').map(Number);
  if (!y || !m) return String(key || '');
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
export const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);
/** Inclusive working days (Mon–Sat, Pakistani six-day week off Sunday) between two dates. */
export const leaveDays = (from, to) => {
  if (!from || !to || to < from) return 0;
  let n = 0;
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) { if (d.getDay() !== 0) n += 1; d.setDate(d.getDate() + 1); }
  return n;
};
export const minutesSince = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
export const formatWait = (mins) => (mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${Math.floor(mins / 1440)}d`);
export const timeLabel = (hhmm) => {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${suffix}`;
};
export const sum = (list, fn) => list.reduce((s, r) => s + (Number(fn(r)) || 0), 0);
export const avg = (list, fn) => (list.length ? sum(list, fn) / list.length : 0);
export const pct = (n, d, digits = 0) => (d ? Number(((n / d) * 100).toFixed(digits)) : 0);
export const pctLabel = (n, d, digits = 0) => (d ? `${((n / d) * 100).toFixed(digits)}%` : '—');
export const initials = (name = '') => String(name).replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
export const groupCount = (list, fn) => list.reduce((m, r) => { const k = fn(r) || 'Other'; m[k] = (m[k] || 0) + 1; return m; }, {});
export const nextNumber = (list, field, prefix, width = 4) => {
  const max = list.reduce((m, r) => Math.max(m, Number(String(r[field] || '').replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};
/** Last `n` calendar days ending today, oldest first. */
export const lastDays = (n) => Array.from({ length: n }, (_, i) => dayOffset(i - n + 1));
export const shortDay = (day) => new Date(`${day}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
