/**
 * HTTP client for the Meridian ASP.NET Core API.
 *
 * - Attaches the signed-in user's access token to every request.
 * - Refreshes the token shortly before it expires, and once more on a 401
 *   (single-flight, so parallel requests share one refresh).
 * - Converts RFC 7807 problem responses into ApiError with a readable message.
 *
 * In development Vite proxies /api to the API (see vite.config.js); set
 * VITE_API_URL when the API is served from another origin.
 */
import { getSession, setSession, clearSession } from './session';
import { friendlyError } from './errors';

const API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;
const REFRESH_MARGIN_SECONDS = 60;

/**
 * `message` and `title` are always safe to show people (see lib/errors.js);
 * the server's original text is kept in `detail` for debugging only.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code, errors } = {}) {
    const friendly = friendlyError({ status, message });
    super(friendly.message);
    this.name = 'ApiError';
    this.title = friendly.title;
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.detail = message;
  }
}

let refreshing = null;

function refreshSession() {
  if (refreshing) return refreshing;
  const current = getSession();
  if (!current?.refreshToken) return Promise.resolve(null);

  refreshing = send('/auth/refresh', { method: 'POST', body: { refreshToken: current.refreshToken }, auth: false })
    .then((next) => {
      setSession(next);
      return next;
    })
    .catch((err) => {
      // Only a rejected refresh token ends the session; network blips keep it.
      if (err instanceof ApiError && err.status === 401) clearSession('expired');
      return null;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

async function accessToken() {
  const session = getSession();
  if (!session) return null;
  const expiresSoon = session.expiresAt && session.expiresAt - REFRESH_MARGIN_SECONDS <= Date.now() / 1000;
  if (!expiresSoon) return session.accessToken;
  const next = await refreshSession();
  return next?.accessToken ?? getSession()?.accessToken ?? null;
}

function problemMessage(problem, status) {
  if (problem?.errors && typeof problem.errors === 'object') {
    const first = Object.values(problem.errors).flat()[0];
    if (first) return first;
  }
  if (problem?.title) return problem.title;
  if (status === 0) return 'Cannot reach the server. Check your connection and that the API is running.';
  if ([502, 503, 504].includes(status)) return 'The server is not available right now. Make sure the Meridian API is running, then try again.';
  return `Request failed (${status}).`;
}

async function send(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  // FormData (file uploads) sets its own multipart Content-Type with the boundary.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await accessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(problemMessage(null, 0), { status: 0 });
  }

  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(problemMessage(data, response.status), {
      status: response.status,
      code: data?.code,
      errors: data?.errors,
    });
  }
  return data;
}

async function request(path, options = {}) {
  try {
    return await send(path, options);
  } catch (err) {
    // An expired/revoked access token: refresh once and retry.
    if (options.auth !== false && err instanceof ApiError && err.status === 401 && getSession()) {
      const next = await refreshSession();
      if (next) return send(path, options);
    }
    throw err;
  }
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
