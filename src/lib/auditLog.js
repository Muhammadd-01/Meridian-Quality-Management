/**
 * Audit / activity history.
 *
 * Entries are produced from real changes made in this browser: every write to a
 * registered collection (see data/entities.js) is diffed by record id, and
 * explicit events (imports, exports) are logged by the code that performs them.
 * Nothing here is generated or seeded — an empty log means nothing has changed yet.
 *
 * Limitation: the log lives in this browser's localStorage, so it is per-device
 * and can be cleared by the user. It is not a tamper-proof server-side audit trail.
 */
import { ENTITY_BY_KEY, ENTITIES, recordTitle } from '../data/entities';
import { getStorageItem, setStorageItem } from './storage';

export const AUDIT_LOG_KEY = 'meridian-audit-log';
export const NOTIFICATION_STATE_KEY = 'meridian-notification-state';
const MAX_ENTRIES = 500;
const BULK_THRESHOLD = 5;

let activeContext = null;

/** Run `fn` with an audit context (e.g. 'import') so bulk diffs are labelled correctly. */
export function withAuditContext(context, fn) {
  const prev = activeContext;
  activeContext = context;
  try {
    return fn();
  } finally {
    activeContext = prev;
  }
}

export function getAuditLog() {
  const log = getStorageItem(AUDIT_LOG_KEY, []);
  return Array.isArray(log) ? log : [];
}

function currentActor() {
  const settings = getStorageItem('meridian-settings', null);
  return settings?.profile?.name || 'Admin User';
}

function append(entries) {
  if (!entries.length) return;
  const stamped = entries.map((e, i) => ({
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    at: new Date().toISOString(),
    actor: currentActor(),
    ...e,
  }));
  const next = [...stamped.reverse(), ...getAuditLog()].slice(0, MAX_ENTRIES);
  setStorageItem(AUDIT_LOG_KEY, next);
}

/** Log an explicit event, e.g. { action: 'exported', entityType: 'leads', details: '12 rows as CSV' } */
export function logEvent({ action, entityType, recordId, recordName, details, path }) {
  const entity = ENTITIES[entityType];
  append([{
    action,
    entityType: entityType || 'system',
    entityLabel: entity?.singular || entityType || 'System',
    recordId: recordId || null,
    recordName: recordName || null,
    details: details || '',
    path: path || entity?.path || null,
  }]);
}

const stableStringify = (v) => {
  try { return JSON.stringify(v); } catch { return ''; }
};

/** Diff two versions of a registered collection and log what changed. */
export function recordCollectionChange(key, prev, next) {
  const entity = ENTITY_BY_KEY[key];
  if (!entity || !Array.isArray(prev) || !Array.isArray(next) || prev === next) return;

  const prevById = new Map(prev.filter(r => r && r.id != null).map(r => [r.id, r]));
  const nextById = new Map(next.filter(r => r && r.id != null).map(r => [r.id, r]));
  const base = { entityType: entity.type, entityLabel: entity.singular, path: entity.path };
  const entries = [];

  const added = next.filter(r => r && r.id != null && !prevById.has(r.id));
  const removed = prev.filter(r => r && r.id != null && !nextById.has(r.id));
  const updated = next.filter(r => {
    if (!r || r.id == null || !prevById.has(r.id)) return false;
    return prevById.get(r.id) !== r && stableStringify(prevById.get(r.id)) !== stableStringify(r);
  });

  if (added.length >= BULK_THRESHOLD || activeContext === 'import') {
    if (added.length) {
      entries.push({ ...base, action: activeContext === 'import' ? 'imported' : 'created', details: `${added.length} ${entity.label.toLowerCase()} added${activeContext === 'import' ? ' from file import' : ''}` });
    }
  } else {
    added.forEach(r => entries.push({ ...base, action: 'created', recordId: r.id, recordName: recordTitle(entity, r) }));
  }

  if (removed.length >= BULK_THRESHOLD) {
    entries.push({ ...base, action: 'deleted', details: `${removed.length} ${entity.label.toLowerCase()} removed` });
  } else {
    removed.forEach(r => entries.push({ ...base, action: 'deleted', recordId: r.id, recordName: recordTitle(entity, r) }));
  }

  if (updated.length >= BULK_THRESHOLD) {
    entries.push({ ...base, action: activeContext === 'import' ? 'imported' : 'updated', details: `${updated.length} ${entity.label.toLowerCase()} updated${activeContext === 'import' ? ' from file import' : ''}` });
  } else {
    updated.forEach(r => {
      const before = prevById.get(r.id);
      const sf = entity.statusField;
      const of = entity.ownerField;
      if (sf && before[sf] !== r[sf]) {
        entries.push({ ...base, action: 'status_changed', recordId: r.id, recordName: recordTitle(entity, r), details: `${before[sf] ?? '—'} → ${r[sf] ?? '—'}` });
      } else if (of && before[of] !== r[of]) {
        entries.push({ ...base, action: 'assigned', recordId: r.id, recordName: recordTitle(entity, r), details: `Assigned to ${r[of] || 'nobody'}` });
      } else {
        entries.push({ ...base, action: 'updated', recordId: r.id, recordName: recordTitle(entity, r) });
      }
    });
  }

  append(entries);
}

export const ACTION_LABELS = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  status_changed: 'Status changed',
  assigned: 'Assigned',
  imported: 'Imported',
  exported: 'Exported',
};
