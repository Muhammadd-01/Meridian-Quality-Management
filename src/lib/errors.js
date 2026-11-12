/**
 * Turns any error (API problem, network failure, JavaScript exception) into a
 * short, friendly { title, message } for people. Technical details — database
 * codes, SQL, stack traces, URLs — are never shown; they go to the console.
 */

const BY_STATUS = {
  0: { title: 'No connection', message: 'We couldn’t reach the server. Check your internet connection and try again.' },
  400: { title: 'Check the details', message: 'Some of the information isn’t valid. Please check it and try again.' },
  401: { title: 'Please sign in again', message: 'Your session has ended. Sign in again to continue.' },
  403: { title: 'Not allowed', message: 'You don’t have permission to do that.' },
  404: { title: 'Not found', message: 'That item no longer exists. It may have been deleted.' },
  409: { title: 'Already exists', message: 'This conflicts with something that already exists.' },
  413: { title: 'File too large', message: 'That file is too large. Please choose a smaller one.' },
  415: { title: 'File not supported', message: 'That file type isn’t supported.' },
  422: { title: 'Check the details', message: 'Some of the information isn’t valid. Please check it and try again.' },
  429: { title: 'Too many attempts', message: 'Please wait a minute, then try again.' },
  500: { title: 'Something went wrong', message: 'Something went wrong on our side. Please try again in a moment.' },
  502: { title: 'Service unavailable', message: 'The database can’t be reached right now. Please try again shortly.' },
  503: { title: 'Service unavailable', message: 'The service isn’t available right now. Please try again shortly.' },
  504: { title: 'Taking too long', message: 'The server took too long to answer. Please try again.' },
};

// Text that looks like it came from code rather than from a person.
const TECHNICAL = /(PGRST|SQLSTATE|\bpg_|violates|syntax|relation\s|column\s|constraint|duplicate key|null value|exception|stack|TypeError|ReferenceError|SyntaxError|is not a function|is not defined|undefined|Cannot read|Failed to fetch|NetworkError|Load failed|Unexpected token|JSON|<\/?[a-z]+>|\[object|https?:\/\/|\.cs:\d|\.jsx?:\d|\bat\s+\w+\s*\(|Request failed \(\d+\)|\d{3}\s+(Internal|Bad|Service)|ECONN|ETIMEDOUT|row-level security|npm run|dotnet|\.sql\b|SQL Editor|supabase\/|appsettings|ServiceRoleKey|localhost)/i;

export function isTechnical(text) {
  const s = String(text || '').trim();
  return !s || s.length > 220 || TECHNICAL.test(s);
}

const statusOf = (err) => (typeof err?.status === 'number' ? err.status : null);

function fallbackFor(status) {
  if (status == null) return BY_STATUS[500];
  return BY_STATUS[status] || (status >= 500 ? BY_STATUS[500] : BY_STATUS[400]);
}

/** A dynamic import failed (usually: the app was updated while this tab was open). */
export function isChunkLoadError(err) {
  return /dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically/i.test(String(err?.message || err || ''));
}

/**
 * @param {unknown} err  ApiError, Error, string or anything else
 * @param {{ title?: string, message?: string }} [fallback]  used when the error has nothing friendly to say
 * @returns {{ title: string, message: string }}
 */
export function friendlyError(err, fallback) {
  if (err?.name === 'AbortError') return { title: 'Cancelled', message: 'The request was cancelled.' };
  if (isChunkLoadError(err)) return { title: 'Update available', message: 'A newer version of the app is available. Please reload the page.' };

  const status = statusOf(err);
  const base = { ...fallbackFor(status), ...(fallback || {}) };
  const raw = typeof err === 'string' ? err : err?.message;

  // Setup hints and technical details are for developers: console only, never on screen.
  if (import.meta.env.DEV && err && typeof err === 'object') console.warn('[Meridian]', err?.detail || err?.message || err); // eslint-disable-line no-console

  // Our API writes readable messages for expected problems (wrong password, role not allowed, …).
  if (raw && !isTechnical(raw)) return { title: err?.title && !isTechnical(err.title) ? err.title : base.title, message: raw };
  return base;
}

/** Just the friendly sentence (for inline form errors). */
export function friendlyMessage(err, fallback) {
  return friendlyError(err, fallback ? { message: fallback } : undefined).message;
}
