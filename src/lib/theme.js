import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * Appearance preferences, stored in this browser only.
 *  - colour mode: 'light' | 'dark' | 'system' → `data-theme` on <html>
 *    (index.html applies it before first paint to avoid a flash)
 *  - sidebar style: 'spruce' (dark reference sidebar) | 'light'
 */
export const COLOR_MODE_KEY = 'meridian-color-mode';
export const SIDEBAR_STYLE_KEY = 'meridian-theme-v2';

const systemQuery = () => (typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null);

export function useColorMode() {
  const [mode, setMode] = useLocalStorage(COLOR_MODE_KEY, 'light');
  const [systemDark, setSystemDark] = useState(() => !!systemQuery()?.matches);

  useEffect(() => {
    const mq = systemQuery();
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  return useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
}

export function useSidebarStyle() {
  return useLocalStorage(SIDEBAR_STYLE_KEY, 'spruce');
}
