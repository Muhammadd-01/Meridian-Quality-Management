/**
 * Server-backed collections (Accounts, Contacts, Leads, Deals).
 *
 * The API (Supabase underneath) is the source of truth. The browser keeps a
 * cache under the collection's usual storage key so every existing reader —
 * pages, dashboard, reports, global search — keeps working unchanged.
 *
 * Writes are optimistic: the page updates the cache immediately, the change is
 * diffed by record id and sent to the API in order (per collection). If the
 * API rejects it, the collection is reloaded from the server so the screen
 * never shows data that was not saved, and a sync-error event is raised.
 */
import { api } from './api';
import { getSession } from './session';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

export const REMOTE_SYNC_ERROR_EVENT = 'meridian-remote-sync-error';
const STALE_AFTER_MS = 30_000;

const state = new Map(); // storage key -> { loadedAt, loading, queue, pending }

function stateFor(key) {
  if (!state.has(key)) state.set(key, { loadedAt: 0, loading: null, queue: Promise.resolve(), pending: 0 });
  return state.get(key);
}

/** @param {'load'|'save'} kind */
function reportError(entity, err, kind = 'save') {
  try {
    window.dispatchEvent(new CustomEvent(REMOTE_SYNC_ERROR_EVENT, {
      detail: { entity: entity.type, label: entity.label, singular: entity.singular, kind, title: err?.title, message: err?.message, status: err?.status ?? 0 },
    }));
  } catch {
    // non-browser environment
  }
}

/**
 * Loads the collection from the API into the cache (deduplicated; skipped while
 * fresh or while local changes are still being sent).
 */
export function loadRemoteCollection(entity, { force = false } = {}) {
  const s = stateFor(entity.key);
  if (!getSession()) return Promise.resolve();
  if (s.loading) return s.loading;
  if (!force && (s.pending > 0 || Date.now() - s.loadedAt < STALE_AFTER_MS)) return Promise.resolve();

  // Loads share the write queue so a response never overtakes an earlier save.
  s.loading = s.queue
    .then(() => api.get(`/${entity.remote}`))
    .then((records) => {
      if (!Array.isArray(records)) return;
      // A change made while this request was in flight is not in `records`
      // yet: keep the optimistic cache and reload once that change is saved.
      if (s.pending > 0) {
        s.loadedAt = 0;
        return;
      }
      s.loadedAt = Date.now();
      setStorageItem(entity.key, records);
    })
    .catch((err) => {
      if (err?.status !== 401) reportError(entity, err, 'load');
    })
    .finally(() => { s.loading = null; });
  s.queue = s.loading;
  return s.loading;
}

const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

function diff(prev, next) {
  const before = new Map((prev || []).map((r) => [r?.id, r]));
  const after = new Set((next || []).map((r) => r?.id));
  const upsert = (next || []).filter((r) => r && (!r.id || !before.has(r.id) || !same(before.get(r.id), r)));
  const remove = (prev || []).filter((r) => r?.id && !after.has(r.id)).map((r) => r.id);
  return { upsert, remove, isNew: (r) => !r.id || !before.has(r.id) };
}

async function send(entity, { upsert, remove, isNew }) {
  const base = `/${entity.remote}`;
  if (upsert.length === 1 && remove.length === 0) {
    const [record] = upsert;
    return isNew(record)
      ? api.post(base, record)
      : api.put(`${base}/${encodeURIComponent(record.id)}`, record);
  }
  if (upsert.length === 0 && remove.length === 1) {
    return api.delete(`${base}/${encodeURIComponent(remove[0])}`);
  }
  return api.post(`${base}/batch`, { upsert, delete: remove });
}

/** Sends the difference between two versions of a collection to the API. */
export function syncRemoteCollection(entity, prev, next) {
  const changes = diff(prev, next);
  if (!changes.upsert.length && !changes.remove.length) return Promise.resolve();

  const s = stateFor(entity.key);
  s.pending += 1;
  s.queue = s.queue
    .then(() => send(entity, changes))
    .then(() => {
      // Records sent without an id were given one by the server: pick it up.
      if (changes.upsert.some((r) => !r.id)) s.loadedAt = 0;
    })
    .catch((err) => {
      reportError(entity, err, 'save');
      s.loadedAt = 0; // roll back to what the server actually has
    })
    .finally(() => {
      s.pending -= 1;
      if (s.pending === 0 && s.loadedAt === 0) loadRemoteCollection(entity, { force: true });
    });
  return s.queue;
}

/** Drops cached server data (on sign-out or when a different user signs in). */
export function clearRemoteCaches(entities) {
  entities.forEach((entity) => {
    state.delete(entity.key);
    removeStorageItem(entity.key);
  });
}

export function readRemoteCache(entity) {
  const cached = getStorageItem(entity.key, []);
  return Array.isArray(cached) ? cached : [];
}
