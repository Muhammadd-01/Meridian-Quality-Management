/**
 * The signed-in user's OWN linked WhatsApp (QR in Settings → WhatsApp), shared
 * by every send button so the status is fetched once, not per row.
 *
 * The status belongs to one user: when someone else signs in (or the user
 * signs out) it is cleared and fetched again, so nobody ever sees another
 * person's linked number.
 */
import { useEffect, useState } from 'react';
import { api } from './api';
import { getSession, subscribeSession } from './session';

let status = null; // { state, qr?, phone?, name?, error? } | { state: 'unavailable' }
let statusUserId = null; // whose status `status` is
let loading = null;
let loadingUserId = null;
const listeners = new Set();

const currentUserId = () => getSession()?.user?.id ?? null;

function set(next, userId = currentUserId()) {
  if (userId !== currentUserId()) return; // an answer for someone who has since signed out
  status = next;
  statusUserId = userId;
  listeners.forEach(fn => fn(status));
}

/** Forgets the cached status (on sign-in as someone else, or sign-out). */
export function resetWhatsAppStatus() {
  status = null;
  statusUserId = null;
  loading = null;
  loadingUserId = null;
  listeners.forEach(fn => fn(null));
}

/** Fetches the signed-in user's status (deduplicated per user). */
export function refreshWhatsAppStatus() {
  const userId = currentUserId();
  if (!userId) {
    resetWhatsAppStatus();
    return Promise.resolve();
  }
  if (loading && loadingUserId === userId) return loading;
  loadingUserId = userId;
  loading = api.get('/whatsapp/status')
    .then(s => set(s || { state: 'disconnected' }, userId))
    .catch(() => set({ state: 'unavailable' }, userId))
    .finally(() => {
      if (loadingUserId === userId) {
        loading = null;
        loadingUserId = null;
      }
    });
  return loading;
}

/** Stores a status the API just returned for the signed-in user (connect / logout). */
export const setWhatsAppStatus = (next) => set(next);

// A different person signed in, or the user signed out: drop the old status at once.
// (A token refresh for the same user keeps the status.)
subscribeSession((session) => {
  const userId = session?.user?.id ?? null;
  if (userId === statusUserId) return;
  resetWhatsAppStatus();
  if (userId && listeners.size) refreshWhatsAppStatus();
});

export function useWhatsAppStatus() {
  const userId = currentUserId();
  const [value, setValue] = useState(statusUserId === userId ? status : null);
  useEffect(() => {
    listeners.add(setValue);
    if (!status || statusUserId !== currentUserId()) {
      setValue(null);
      refreshWhatsAppStatus();
    } else {
      setValue(status);
    }
    return () => listeners.delete(setValue);
  }, [userId]);
  return statusUserId === userId ? value : null;
}

export const isLinked = (s) => s?.state === 'connected';
