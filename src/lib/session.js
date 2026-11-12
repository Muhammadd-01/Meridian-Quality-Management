/**
 * Signed-in session (Supabase tokens issued through the Meridian API).
 *
 * "Keep me signed in" stores it in localStorage; otherwise sessionStorage, so
 * it ends with the browser tab. The key deliberately does not start with
 * "meridian" so workspace data tools never touch or export tokens.
 */
const SESSION_KEY = 'mqm.auth.session';
const listeners = new Set();

function readFrom(store) {
  try {
    const raw = store.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.accessToken && parsed?.refreshToken ? parsed : null;
  } catch {
    return null;
  }
}

let current = typeof window === 'undefined' ? null : (readFrom(localStorage) || readFrom(sessionStorage));
let persistent = typeof window !== 'undefined' && !!readFrom(localStorage);

function write() {
  try {
    // Write before removing so other tabs never observe a transient "signed out".
    const target = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    if (current) target.setItem(SESSION_KEY, JSON.stringify(current));
    else target.removeItem(SESSION_KEY);
    if (other.getItem(SESSION_KEY) !== null) other.removeItem(SESSION_KEY);
  } catch {
    // storage unavailable (private mode): the session still lives in memory
  }
}

function emit(reason) {
  listeners.forEach((fn) => fn(current, reason));
}

export function getSession() {
  return current;
}

/** Saves a session returned by /auth/login, /auth/register or /auth/refresh. */
export function setSession(session, remember) {
  if (remember !== undefined) persistent = !!remember;
  current = session;
  write();
  emit('updated');
}

/** @param {'signed-out'|'expired'} reason */
export function clearSession(reason = 'signed-out') {
  if (!current) return;
  current = null;
  write();
  emit(reason);
}

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Keep tabs in sync: signing in or out in one tab applies to the others.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== SESSION_KEY || e.storageArea !== localStorage) return;
    const next = readFrom(localStorage);
    // A tab-only session is not ended by another tab's persistent sign-out.
    if (!next && (!current || !persistent)) return;
    current = next;
    persistent = !!next;
    emit(next ? 'updated' : 'signed-out');
  });
}
