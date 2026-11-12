/**
 * Feature visibility.
 *
 * The app currently runs as a focused CRM: only the pages in VISIBLE_PAGES are
 * shown in the sidebar, Explore / Apps menus, Quick Create, the command
 * palette, notifications and breadcrumbs, and only those pages can be opened.
 *
 * Every other feature (Dashboard, Projects, Team, Website Analytics, Calendar,
 * Reports, Settings, …) is still in the codebase and its route is still
 * registered in app/router.jsx — it is hidden, not removed. Opening a hidden
 * URL redirects to its replacement (HIDDEN_ROUTE_REDIRECTS) or to HOME_PATH.
 *
 * To bring a feature back, add its path to VISIBLE_PAGES. To show everything
 * again, set FOCUSED_CRM to false.
 */
export const FOCUSED_CRM = true;

/** Visible pages, in sidebar order. */
export const VISIBLE_PAGES = [
  '/sales-analytics/leads',
  '/sales-analytics/deals',
  '/crm/contacts',
  '/crm/accounts',
  '/users',
  '/settings',
];

/**
 * Public self sign-up (the Register page). Off: users are created by an Admin
 * or CEO on the Users page. Must match Auth:AllowPublicSignUp on the API.
 */
export const PUBLIC_SIGNUP = false;

/** Where the app lands after sign-in and for unknown or hidden URLs. */
export const HOME_PATH = FOCUSED_CRM ? VISIBLE_PAGES[0] : '/dashboard';

/** Hidden pages whose records live on a visible page (the query string is kept). */
export const HIDDEN_ROUTE_REDIRECTS = {
  '/crm/companies': '/crm/accounts',
};

const pathOnly = (path) => String(path || '').split(/[?#]/)[0];

export function isPathVisible(path) {
  if (!FOCUSED_CRM) return true;
  return VISIBLE_PAGES.includes(pathOnly(path));
}

/**
 * The visible page a link should open: the link itself when its page is
 * visible, its replacement when the page is hidden but redirected (query and
 * hash kept), otherwise null (the link should not be shown).
 */
export function visibleTarget(path) {
  if (!path) return null;
  if (isPathVisible(path)) return path;
  const base = pathOnly(path);
  const replacement = HIDDEN_ROUTE_REDIRECTS[base];
  return replacement && isPathVisible(replacement) ? replacement + String(path).slice(base.length) : null;
}
