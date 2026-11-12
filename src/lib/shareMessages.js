/**
 * Ready-to-send WhatsApp messages for CRM records, so details can be shared
 * as a message instead of a downloaded file. *text* is bold in WhatsApp.
 */
import { formatCurrency } from '../utils/format';

const line = (label, value) => (value === undefined || value === null || String(value).trim() === '' ? null : `${label}: ${value}`);
const join = (...parts) => parts.flat().filter(p => p !== null && p !== undefined).join('\n');
const money = (v) => (Number(v) ? formatCurrency(Number(v)) : null);

export function leadMessage(l) {
  return join(
    `*Lead: ${l.contactName}*${l.company ? ` (${l.company})` : ''}`,
    line('Status', l.status),
    line('Source', l.source),
    line('Estimated value', money(l.dealValue)),
    line('Owner', l.assignedTo),
    line('Email', l.email),
    line('Phone', l.phone),
    line('Last contact', l.lastContact),
    l.notes ? `\nNotes: ${l.notes}` : null,
  );
}

export function dealMessage(d) {
  return join(
    `*Deal: ${d.name}*`,
    line('Account', d.company),
    line('Contact', d.contact),
    line('Value', money(d.value)),
    line('Stage', d.stage),
    line('Probability', d.probability !== undefined && d.probability !== '' ? `${d.probability}%` : null),
    line('Expected close', d.expectedClose),
    line('Owner', d.owner),
    d.notes ? `\nNotes: ${d.notes}` : null,
  );
}

export function contactMessage(c) {
  return join(
    `*Contact: ${c.name}*`,
    line('Role', c.role),
    line('Company', c.company),
    line('Email', c.email),
    line('Phone', c.phone),
    line('Location', c.location),
  );
}

export function accountMessage(a, stats) {
  return join(
    `*Account: ${a.name}*`,
    line('Industry', a.industry),
    line('Relationship', a.relationship),
    line('Primary contact', [a.contactPerson, a.contactRole].filter(Boolean).join(', ')),
    line('Email', a.email),
    line('Phone', a.phone),
    line('Location', [a.location, a.country].filter(Boolean).join(', ')),
    stats ? line('Open pipeline', money(stats.pipeline) || formatCurrency(0)) : null,
    stats?.openDeals?.length ? line('Open deals', stats.openDeals.length) : null,
    stats?.won ? line('Won revenue', money(stats.won)) : null,
  );
}
