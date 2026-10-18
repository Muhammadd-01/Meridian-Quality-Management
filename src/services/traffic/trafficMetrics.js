/**
 * Traffic metric definitions (all derived from daily aggregate rows):
 *
 *  Sessions            Σ sessions — one session is one visit.
 *  Users               Σ users — the provider's distinct-visitor count per
 *                      row. Summing rows can over-count people who visit on
 *                      several days or land on several pages; true unique
 *                      users need visitor-level data from the provider.
 *  Bounce rate         Σ bounced sessions ÷ Σ sessions. A bounce is a
 *                      single-page session with no engagement event.
 *  Avg. session        Σ session duration (seconds) ÷ Σ sessions.
 *  Pages / session     Σ pageviews ÷ Σ sessions.
 *  Conversion rate     Σ conversions ÷ Σ sessions.
 *  Trend               % change in sessions vs. the previous period of equal length.
 */
import { addDays, differenceInCalendarDays, format, subDays } from 'date-fns';

export const METRIC_DEFINITIONS = {
  sessions: 'Total visits in the period. One session = one visit, regardless of pages viewed.',
  users: 'Sum of distinct visitors reported per day/page/source. May over-count people who return on several days.',
  bounceRate: 'Bounced sessions ÷ sessions. A bounce is a single-page session with no engagement event. Lower is better.',
  avgSession: 'Total session duration ÷ sessions.',
  pageviews: 'Total pages viewed across all sessions.',
  conversionRate: 'Sessions that completed a tracked goal (e.g. contact form) ÷ sessions.',
};

export function emptyTotals() {
  return { sessions: 0, users: 0, bounces: 0, durationSec: 0, pageviews: 0, conversions: 0 };
}

export function sumRows(rows) {
  return rows.reduce((t, r) => {
    t.sessions += r.sessions || 0;
    t.users += r.users || 0;
    t.bounces += r.bounces || 0;
    t.durationSec += r.durationSec || 0;
    t.pageviews += r.pageviews || 0;
    t.conversions += r.conversions || 0;
    return t;
  }, emptyTotals());
}

export function deriveMetrics(t) {
  const s = t.sessions;
  return {
    ...t,
    bounceRate: s ? (t.bounces / s) * 100 : null,
    avgSessionSec: s ? t.durationSec / s : null,
    pagesPerSession: s ? t.pageviews / s : null,
    conversionRate: s ? (t.conversions / s) * 100 : null,
  };
}

/** Percentage change; null when there is no baseline. */
export function pctChange(current, previous) {
  if (current === null || previous === null || previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Period resolution: '7' | '30' | '90' | 'custom' → { from, to, prevFrom, prevTo, days } */
export function resolvePeriod(period, customFrom, customTo, today = new Date()) {
  let from;
  let to;
  if (period === 'custom' && customFrom && customTo) {
    from = new Date(`${customFrom}T00:00:00`);
    to = new Date(`${customTo}T00:00:00`);
    if (from > to) [from, to] = [to, from];
  } else {
    const n = Number(period) || 30;
    to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    from = subDays(to, n - 1);
  }
  const days = differenceInCalendarDays(to, from) + 1;
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, days - 1);
  return { from, to, prevFrom, prevTo, days };
}

export function dailySeries(rows, from, days) {
  const byDate = new Map();
  rows.forEach(r => {
    const t = byDate.get(r.date) || emptyTotals();
    t.sessions += r.sessions || 0;
    t.users += r.users || 0;
    t.bounces += r.bounces || 0;
    t.durationSec += r.durationSec || 0;
    byDate.set(r.date, t);
  });
  return Array.from({ length: days }, (_, i) => {
    const d = format(addDays(from, i), 'yyyy-MM-dd');
    const t = byDate.get(d) || emptyTotals();
    return { date: d, sessions: t.sessions, users: t.users, bounces: t.bounces, durationSec: t.durationSec };
  });
}

/** Group rows by a key ('page' | 'source') with current/previous comparison and a daily sparkline. */
export function groupBy(rows, prevRows, key, from, days) {
  const groups = new Map();
  rows.forEach(r => {
    const g = groups.get(r[key]) || { rows: [] };
    g.rows.push(r);
    groups.set(r[key], g);
  });
  const prevTotals = new Map();
  prevRows.forEach(r => prevTotals.set(r[key], (prevTotals.get(r[key]) || 0) + (r.sessions || 0)));

  return Array.from(groups.entries()).map(([name, g]) => {
    const m = deriveMetrics(sumRows(g.rows));
    const prevSessions = prevTotals.get(name) || 0;
    return {
      id: name,
      name,
      sessions: m.sessions,
      users: m.users,
      bounceRate: m.bounceRate,
      avgSessionSec: m.avgSessionSec,
      conversions: m.conversions,
      conversionRate: m.conversionRate,
      prevSessions,
      trend: pctChange(m.sessions, prevSessions),
      spark: dailySeries(g.rows, from, days).map(d => d.sessions),
    };
  });
}

export function channelOf(source = '') {
  const s = source.toLowerCase();
  if (s === '(direct)' || s === 'direct' || s === '(none)') return 'Direct';
  if (/google\.|bing\.|duckduckgo|yahoo\.|baidu|yandex/.test(s)) return 'Search';
  if (/facebook|linkedin|twitter|x\.com|instagram|youtube|reddit|t\.co/.test(s)) return 'Social';
  if (/newsletter|mail|campaign/.test(s)) return 'Email';
  return 'Referral';
}

export function formatDuration(sec) {
  if (sec === null || sec === undefined || Number.isNaN(sec)) return '—';
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}
