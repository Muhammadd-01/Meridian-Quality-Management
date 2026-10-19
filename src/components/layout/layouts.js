import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  PanelLeft, PanelLeftDashed, Columns2, PanelTop, Layers, RectangleHorizontal, Maximize2, Square, ArrowRightLeft,
  PanelRight, Languages, PanelBottom, Moon,
} from 'lucide-react';
import useLocalStorage from '../../hooks/useLocalStorage';

/**
 * Shell layout variants, chosen per browser ('meridian-layout').
 * Each /layouts/<slug> page previews its variant live while it is open;
 * "Apply as my layout" stores it so every page uses it.
 *
 * 'dark-mode' is not a structural layout: applying it switches the colour
 * mode to dark (the Theme menu), and previewing it forces dark temporarily.
 */
export const LAYOUT_KEY = 'meridian-layout';
export const DEFAULT_LAYOUT = 'default';

export const LAYOUT_OPTIONS = [
  { id: 'default', label: 'Default (vertical)', short: 'Default', icon: PanelLeft, description: 'Fixed sidebar on the left, header on top. The standard Meridian layout.' },
  { id: 'detached-sidebar', label: 'Detached Sidebar', short: 'Detached', icon: PanelLeftDashed, description: 'The sidebar and header float as rounded cards, separated from the screen edges.' },
  { id: 'two-sidebar', label: 'Two Sidebar', short: 'Two sidebar', icon: Columns2, description: 'An icon rail of sections plus a secondary sidebar listing the pages of the selected section.' },
  { id: 'horizontal-menu', label: 'Horizontal Menu', short: 'Horizontal', icon: PanelTop, description: 'No sidebar on large screens: navigation moves to a menu bar with dropdowns under the header.' },
  { id: 'stacked-header', label: 'Stacked Header', short: 'Stacked', icon: Layers, description: 'Header with a second, dark navigation row stacked beneath it.' },
  { id: 'transparent-header', label: 'Transparent Header', short: 'Transparent', icon: RectangleHorizontal, description: 'The header has no background and blends into the page until you scroll, then turns solid.' },
  { id: 'fullscreen', label: 'Fullscreen', short: 'Fullscreen', icon: Maximize2, description: 'Content only. The sidebar is hidden behind the menu button in the header on every screen size.' },
  { id: 'container', label: 'Container (boxed)', short: 'Container', icon: Square, description: 'Page content is boxed to a maximum width of 1280px and centred.' },
  { id: 'wide', label: 'Wide', short: 'Wide', icon: ArrowRightLeft, description: 'Edge-to-edge content with tighter padding and the sidebar collapsed to its icon rail.' },
  { id: 'right-sidebar', label: 'Right Sidebar', short: 'Right', icon: PanelRight, description: 'Navigation is docked on the right-hand side of the screen.' },
  { id: 'rtl', label: 'RTL (right-to-left)', short: 'RTL', icon: Languages, description: 'Right-to-left direction (dir="rtl") for Arabic and Urdu: the sidebar, text and menus mirror.' },
  { id: 'bottom-navigation', label: 'Bottom Navigation', short: 'Bottom nav', icon: PanelBottom, description: 'A mobile-style tab bar at the bottom of the screen; the full menu opens from its Menu tab.' },
  { id: 'dark-mode', label: 'Dark Mode', short: 'Dark', icon: Moon, description: 'The whole workspace in dark mode. Applying it sets the colour mode to Dark.' },
];

export const LAYOUT_BY_ID = Object.fromEntries(LAYOUT_OPTIONS.map(l => [l.id, l]));
const STRUCTURAL = new Set(LAYOUT_OPTIONS.filter(l => l.id !== 'dark-mode').map(l => l.id));

/** Saved layout for this browser. Always returns a valid structural id. */
export function useLayoutPreference() {
  const [stored, setStored] = useLocalStorage(LAYOUT_KEY, DEFAULT_LAYOUT);
  const layout = STRUCTURAL.has(stored) ? stored : DEFAULT_LAYOUT;
  return [layout, setStored];
}

/** Layout slug previewed by the current /layouts/<slug> page, or null. */
export function previewSlug(pathname) {
  const m = /^\/layouts\/([a-z-]+)$/.exec(pathname);
  return m && LAYOUT_BY_ID[m[1]] ? m[1] : null;
}

/**
 * Effective shell layout: the previewed one on a layout page, else the saved one.
 * Returns { layout, saved, preview, forceDark, setLayout }.
 */
export function useShellLayout() {
  const { pathname } = useLocation();
  const [saved, setLayout] = useLayoutPreference();
  const preview = previewSlug(pathname);
  return useMemo(() => {
    const forceDark = preview === 'dark-mode';
    const layout = preview && preview !== 'dark-mode' ? preview : saved;
    return { layout, saved, preview, forceDark, setLayout };
  }, [preview, saved, setLayout]);
}
