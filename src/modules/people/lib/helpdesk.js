/**
 * Helpdesk SLA rules used by the ticket reports and AI insights.
 * Targets are hours from ticket creation, by priority.
 */
export const TICKET_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
export const TICKET_STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
export const SLA_TARGETS = {
  Critical: { response: 1, resolution: 4 },
  High: { response: 4, resolution: 24 },
  Medium: { response: 8, resolution: 48 },
  Low: { response: 24, resolution: 72 },
};

const hoursBetween = (a, b) => (a && b ? (new Date(b) - new Date(a)) / 3600000 : null);

export const responseHours = (t) => hoursBetween(t.createdAt, t.firstResponseAt);
export const resolutionHours = (t) => hoursBetween(t.createdAt, t.resolvedAt);
export const isClosed = (t) => ['Resolved', 'Closed'].includes(t.status);

/** null = not measurable yet (no response / still open and inside target). */
export function responseMet(t) {
  const target = SLA_TARGETS[t.priority]?.response;
  const h = responseHours(t);
  if (target == null) return null;
  if (h == null) return hoursBetween(t.createdAt, new Date().toISOString()) > target ? false : null;
  return h <= target;
}
export function resolutionMet(t) {
  const target = SLA_TARGETS[t.priority]?.resolution;
  if (target == null) return null;
  const h = resolutionHours(t);
  if (h == null) return hoursBetween(t.createdAt, new Date().toISOString()) > target ? false : null;
  return h <= target;
}
