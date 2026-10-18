/**
 * Lead scoring — transparent, rule-based (0–100). No machine learning and no
 * external service; every point can be traced to a rule below.
 *
 *  Status          New 5 · Contacted 15 · Qualified 30 · Proposal 40 · Won 50 · Lost 0
 *  Deal value      ≥ PKR 3M 25 · ≥ 1.5M 18 · ≥ 750K 10 · > 0 5
 *  Source          Referral 15 · Conference 12 · LinkedIn 10 · Website 8 · Cold Call 4 · Other 3
 *  Recency         last contact ≤ 7 days 10 · ≤ 30 days 5 · older 0
 *
 *  Grade: Hot ≥ 70 · Warm ≥ 45 · Cold < 45
 */
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';

export const LEAD_SCORING_RULES = [
  { factor: 'Status', points: 'New 5 · Contacted 15 · Qualified 30 · Proposal 40 · Won 50 · Lost 0' },
  { factor: 'Deal value', points: '≥ PKR 3M 25 · ≥ 1.5M 18 · ≥ 750K 10 · any value 5' },
  { factor: 'Source', points: 'Referral 15 · Conference 12 · LinkedIn 10 · Website 8 · Cold Call 4 · Other 3' },
  { factor: 'Recency', points: 'Last contact ≤ 7 days 10 · ≤ 30 days 5' },
];

const STATUS_POINTS = { New: 5, Contacted: 15, Qualified: 30, Proposal: 40, Won: 50, Lost: 0 };
const SOURCE_POINTS = { Referral: 15, Conference: 12, LinkedIn: 10, Website: 8, 'Cold Call': 4 };

export function scoreLead(lead, today = new Date()) {
  const breakdown = [];
  const status = STATUS_POINTS[lead.status] ?? 0;
  breakdown.push({ factor: 'Status', points: status, detail: lead.status || '—' });

  const v = Number(lead.dealValue) || 0;
  const value = v >= 3000000 ? 25 : v >= 1500000 ? 18 : v >= 750000 ? 10 : v > 0 ? 5 : 0;
  breakdown.push({ factor: 'Deal value', points: value, detail: v ? `PKR ${v.toLocaleString()}` : 'none' });

  const source = SOURCE_POINTS[lead.source] ?? 3;
  breakdown.push({ factor: 'Source', points: source, detail: lead.source || 'Other' });

  const last = lead.lastContact ? parseISO(String(lead.lastContact).slice(0, 10)) : null;
  const days = last && isValid(last) ? differenceInCalendarDays(today, last) : null;
  const recency = days === null ? 0 : days <= 7 ? 10 : days <= 30 ? 5 : 0;
  breakdown.push({ factor: 'Recency', points: recency, detail: days === null ? 'no contact date' : `${days} day(s) ago` });

  const score = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0));
  const grade = score >= 70 ? 'Hot' : score >= 45 ? 'Warm' : 'Cold';
  return { score, grade, breakdown };
}

const norm = (s) => String(s ?? '').trim().toLowerCase();

/** Existing leads that look like the same person: same email, or same name at the same company. */
export function findDuplicateLeads(candidate, leads, ignoreId) {
  return leads.filter(l => {
    if (l.id === ignoreId) return false;
    const sameEmail = candidate.email && norm(l.email) === norm(candidate.email);
    const sameNameCompany = candidate.contactName && candidate.company
      && norm(l.contactName) === norm(candidate.contactName) && norm(l.company) === norm(candidate.company);
    return sameEmail || sameNameCompany;
  });
}
