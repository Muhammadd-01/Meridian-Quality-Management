/**
 * Traffic data-provider interface.
 *
 * The Traffic Overview UI only talks to a provider object, so a real analytics
 * backend (GA4 Data API proxy, Plausible, Matomo, a warehouse query, …) can be
 * connected later by adding a provider here — no UI rewrite needed.
 *
 * Provider shape:
 *   {
 *     id: string,
 *     label: string,
 *     kind: 'demo' | 'imported' | 'live',
 *     getDailyRows({ from, to }): Promise<TrafficRow[]>,
 *     getRealtime(): Promise<Realtime | null>   // null → provider has no realtime feed
 *   }
 *
 * TrafficRow (daily aggregate for one landing page + source):
 *   { date: 'YYYY-MM-DD', page: '/path', source: 'google.com' | '(direct)',
 *     sessions, users, bounces, durationSec, pageviews, conversions }
 *
 * Realtime:
 *   { activeVisitors: number, pages: [{ path, visitors }], updatedAt: ISO string }
 *
 * No provider in this file connects to an external service. None of them
 * fabricates realtime visitors: getRealtime() returns null.
 */
import { addDays, format, parseISO, differenceInCalendarDays } from 'date-fns';
import { getStorageItem, setStorageItem, removeStorageItem } from '../../lib/storage';

export const TRAFFIC_IMPORT_KEY = 'meridian-traffic-rows';
export const MAX_TRAFFIC_ROWS = 25000;

// ---------------------------------------------------------------------------
// Demo provider — deterministic, clearly labelled sample data.
// The same date range always yields the same numbers (seeded PRNG), so values
// do not jump around between renders and are never presented as live.
// ---------------------------------------------------------------------------

const DEMO_PAGES = [
  { path: '/', weight: 1.0, bounce: 0.38, dur: 134, conv: 0.012 },
  { path: '/services/iso-9001-certification', weight: 0.55, bounce: 0.41, dur: 168, conv: 0.034 },
  { path: '/training/internal-auditor-course', weight: 0.42, bounce: 0.36, dur: 192, conv: 0.041 },
  { path: '/pricing', weight: 0.38, bounce: 0.45, dur: 108, conv: 0.052 },
  { path: '/blog/iso-9001-vs-iso-14001', weight: 0.31, bounce: 0.58, dur: 205, conv: 0.006 },
  { path: '/case-studies', weight: 0.22, bounce: 0.33, dur: 160, conv: 0.018 },
  { path: '/services/six-sigma-consulting', weight: 0.19, bounce: 0.4, dur: 150, conv: 0.029 },
  { path: '/contact', weight: 0.14, bounce: 0.29, dur: 95, conv: 0.11 },
];

const DEMO_SOURCES = [
  { source: 'google.com', weight: 0.42, bounceAdj: 0, convAdj: 1 },
  { source: '(direct)', weight: 0.22, bounceAdj: 0.04, convAdj: 1.1 },
  { source: 'linkedin.com', weight: 0.11, bounceAdj: -0.03, convAdj: 0.9 },
  { source: 'bing.com', weight: 0.07, bounceAdj: 0.02, convAdj: 0.8 },
  { source: 'newsletter.meridianquality.com', weight: 0.06, bounceAdj: -0.12, convAdj: 1.6 },
  { source: 'facebook.com', weight: 0.05, bounceAdj: 0.08, convAdj: 0.5 },
  { source: 'qualitydigest.com', weight: 0.04, bounceAdj: -0.06, convAdj: 1.3 },
  { source: 'iso.org', weight: 0.03, bounceAdj: -0.08, convAdj: 1.2 },
];

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EPOCH = parseISO('2026-01-01');

function demoRowsForDate(dateStr) {
  const date = parseISO(dateStr);
  const dow = date.getDay();
  const weekdayFactor = dow === 0 ? 0.62 : dow === 6 ? 0.7 : 1;
  const growth = 1 + differenceInCalendarDays(date, EPOCH) * 0.0012; // gentle upward trend
  const rows = [];
  DEMO_PAGES.forEach(p => {
    DEMO_SOURCES.forEach(s => {
      const rand = mulberry32(hashString(`${dateStr}|${p.path}|${s.source}`));
      const noise = 0.8 + rand() * 0.4;
      const sessions = Math.max(0, Math.round(1100 * p.weight * s.weight * weekdayFactor * growth * noise));
      if (!sessions) return;
      const users = Math.max(1, Math.round(sessions * (0.68 + rand() * 0.12)));
      const bounceRate = Math.min(0.9, Math.max(0.05, p.bounce + s.bounceAdj + (rand() - 0.5) * 0.06));
      const bounces = Math.round(sessions * bounceRate);
      const durationSec = Math.round(sessions * p.dur * (0.85 + rand() * 0.3));
      const pageviews = Math.round(sessions * (1.6 + rand() * 1.4));
      const conversions = Math.round(sessions * p.conv * s.convAdj * (0.7 + rand() * 0.6));
      rows.push({ date: dateStr, page: p.path, source: s.source, sessions, users, bounces, durationSec, pageviews, conversions });
    });
  });
  return rows;
}

export const demoTrafficProvider = {
  id: 'demo',
  label: 'Demo data adapter',
  kind: 'demo',
  async getDailyRows({ from, to }) {
    const rows = [];
    const days = differenceInCalendarDays(to, from);
    for (let i = 0; i <= days; i++) rows.push(...demoRowsForDate(format(addDays(from, i), 'yyyy-MM-dd')));
    return rows;
  },
  async getRealtime() {
    return null;
  },
};

// ---------------------------------------------------------------------------
// Imported provider — rows the user uploaded from their own analytics export.
// ---------------------------------------------------------------------------

export function getImportedTrafficRows() {
  const rows = getStorageItem(TRAFFIC_IMPORT_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

export function saveImportedTrafficRows(rows) {
  if (rows.length > MAX_TRAFFIC_ROWS) {
    throw new Error(`Traffic imports are limited to ${MAX_TRAFFIC_ROWS.toLocaleString()} rows in browser storage.`);
  }
  if (!setStorageItem(TRAFFIC_IMPORT_KEY, rows)) {
    throw new Error('Browser storage is full — the imported traffic data could not be saved.');
  }
}

export function clearImportedTrafficRows() {
  removeStorageItem(TRAFFIC_IMPORT_KEY);
}

export const importedTrafficProvider = {
  id: 'imported',
  label: 'Imported traffic data',
  kind: 'imported',
  async getDailyRows({ from, to }) {
    const f = format(from, 'yyyy-MM-dd');
    const t = format(to, 'yyyy-MM-dd');
    return getImportedTrafficRows().filter(r => r.date >= f && r.date <= t);
  },
  async getRealtime() {
    return null;
  },
};

/** Imported data takes precedence over the demo adapter once present. */
export function getActiveTrafficProvider() {
  return getImportedTrafficRows().length ? importedTrafficProvider : demoTrafficProvider;
}

/** Import schema used by the generic ImportDialog. */
export const trafficImportEntity = {
  type: 'traffic',
  label: 'Traffic Data',
  singular: 'Traffic row',
  path: '/traffic-overview',
  dedupeKeys: [['date', 'page', 'source']],
  fields: [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'page', label: 'Landing Page', required: true },
    { key: 'source', label: 'Source', required: true },
    { key: 'sessions', label: 'Sessions', type: 'number', required: true },
    { key: 'users', label: 'Users', type: 'number', required: true },
    { key: 'bounces', label: 'Bounced Sessions', type: 'number' },
    { key: 'durationSec', label: 'Total Session Duration (sec)', type: 'number' },
    { key: 'pageviews', label: 'Pageviews', type: 'number' },
    { key: 'conversions', label: 'Conversions', type: 'number' },
  ],
  defaults: () => ({ bounces: 0, durationSec: 0, pageviews: 0, conversions: 0 }),
};
