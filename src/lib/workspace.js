import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import { allPages } from '../app/navigation';

/**
 * Per-browser navigation conveniences: pinned favourite pages (sidebar tiles)
 * and recently visited pages (Explore menu). Paths only — titles and icons
 * come from the navigation map so they never go stale.
 */
export const FAVORITES_KEY = 'meridian-favorites';
export const RECENT_KEY = 'meridian-recent-pages';

const DEFAULT_FAVORITES = ['/dashboard', '/traffic-overview', '/projects/tasks', '/crm/contacts'];
const MAX_RECENT = 6;

const pageByPath = Object.fromEntries(allPages.map(p => [p.path, p]));
export const resolvePages = (paths = []) => paths.map(p => pageByPath[p]).filter(Boolean);

export function useFavorites() {
  const [paths, setPaths] = useLocalStorage(FAVORITES_KEY, DEFAULT_FAVORITES);
  const list = Array.isArray(paths) ? paths : DEFAULT_FAVORITES;
  const isFavorite = useCallback((path) => list.includes(path), [list]);
  const toggleFavorite = useCallback((path) => {
    setPaths(prev => {
      const cur = Array.isArray(prev) ? prev : DEFAULT_FAVORITES;
      return cur.includes(path) ? cur.filter(p => p !== path) : [...cur, path];
    });
  }, [setPaths]);
  return { favorites: resolvePages(list), isFavorite, toggleFavorite };
}

export function useRecentPages() {
  const [paths] = useLocalStorage(RECENT_KEY, []);
  return resolvePages(Array.isArray(paths) ? paths : []);
}

/** Records the current page in the recent list (mounted once in the layout). */
export function useTrackRecentPage() {
  const location = useLocation();
  const [, setPaths] = useLocalStorage(RECENT_KEY, []);
  useEffect(() => {
    if (!pageByPath[location.pathname]) return;
    setPaths(prev => {
      const cur = Array.isArray(prev) ? prev : [];
      if (cur[0] === location.pathname) return cur;
      return [location.pathname, ...cur.filter(p => p !== location.pathname)].slice(0, MAX_RECENT);
    });
  }, [location.pathname, setPaths]);
}

/** Bytes used by this app's localStorage keys (UTF-16, so 2 bytes per char). */
export function storageUsage() {
  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith('meridian')) bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
    }
  } catch {
    return { bytes: 0, quota: 5 * 1024 * 1024 };
  }
  return { bytes, quota: 5 * 1024 * 1024 };
}
