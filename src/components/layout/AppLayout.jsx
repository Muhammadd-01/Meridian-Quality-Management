import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import HorizontalNav from './HorizontalNav';
import TwoColumnSidebar from './TwoColumnSidebar';
import BottomNav from './BottomNav';
import { useShellLayout } from './layouts';
import ScrollToTop from '../ui/ScrollToTop';
import LoadingState from '../ui/LoadingState';
import { useSettings } from '../../lib/settings';
import { useColorMode, useSidebarStyle } from '../../lib/theme';
import { useTrackRecentPage } from '../../lib/workspace';
import { pageTitles, sectionFor } from '../../app/navigation';

/** Title bar under the header: page name on the left, breadcrumb trail on the right. */
function PageBar({ pathname, transparent }) {
  const title = pageTitles[pathname] || 'Dashboard';
  const section = sectionFor(pathname);
  const group = { label: section.title, to: section.home };
  const showGroup = group.to !== pathname;
  return (
    <div className={`${transparent ? 'border-b border-transparent' : 'page-bar'} px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0`}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-900 truncate">{title}</p>
      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs shrink-0">
        {showGroup && (group.to
          ? <Link to={group.to} className="font-semibold text-primary hover:text-primary-700 transition-colors">{group.label}</Link>
          : <span className="font-semibold text-gray-500">{group.label}</span>)}
        {showGroup && <ChevronRight size={12} className="text-gray-400 rtl:rotate-180" aria-hidden="true" />}
        <span className="text-gray-600 font-medium" aria-current="page">{title}</span>
      </nav>
    </div>
  );
}

/** Shell geometry for each layout variant (see ./layouts.js). */
function shellFor(layout) {
  const sidebar = ['horizontal-menu', 'stacked-header', 'fullscreen', 'bottom-navigation'].includes(layout)
    ? 'hidden'
    : layout === 'two-sidebar' ? 'two' : 'fixed';
  return {
    sidebar,
    right: layout === 'right-sidebar' || layout === 'rtl',
    rtl: layout === 'rtl',
    detached: layout === 'detached-sidebar',
    nav: layout === 'horizontal-menu' ? 'light' : layout === 'stacked-header' ? 'stacked' : null,
    transparent: layout === 'transparent-header',
    container: layout === 'container',
    wide: layout === 'wide',
    bottom: layout === 'bottom-navigation',
  };
}

/** Space kept free for the fixed sidebar on large screens (physical side, so RTL works too). */
function offsetFor(shell, open) {
  if (shell.sidebar === 'hidden') return '';
  if (shell.sidebar === 'two') return shell.right ? 'lg:mr-[304px]' : 'lg:ml-[304px]';
  if (shell.detached) return open ? 'lg:ml-[280px] lg:mr-3' : 'lg:ml-[96px] lg:mr-3';
  if (shell.right) return open ? 'lg:mr-[256px]' : 'lg:mr-[72px]';
  return open ? 'lg:ml-[256px]' : 'lg:ml-[72px]';
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [sidebarStyle, setSidebarStyle] = useSidebarStyle();
  const colorMode = useColorMode();
  const shellLayout = useShellLayout();
  const shell = shellFor(shellLayout.layout);
  const mainRef = useRef(null);
  const [settings] = useSettings();
  const reduceMotion = settings.preferences.reduceMotion;

  useTrackRecentPage();

  // In-app reduced-motion preference (the OS preference is honoured in CSS too)
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', !!reduceMotion);
  }, [reduceMotion]);

  // Dark-mode layout preview: force dark while its page is open.
  useEffect(() => {
    if (!shellLayout.forceDark) return undefined;
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => document.documentElement.setAttribute('data-theme', colorMode.resolved);
  }, [shellLayout.forceDark, colorMode.resolved]);

  // RTL layout: mirror the whole document (portalled dialogs included).
  useEffect(() => {
    if (!shell.rtl) return undefined;
    document.documentElement.setAttribute('dir', 'rtl');
    return () => document.documentElement.setAttribute('dir', 'ltr');
  }, [shell.rtl]);

  // Wide layout starts with the sidebar collapsed to its icon rail.
  useEffect(() => { setSidebarOpen(!shell.wide); }, [shell.wide]);

  // Ensure any selected page immediately starts from the top
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setScrolled(false);
  }, [location.pathname, location.search]);

  // Close the drawer on navigation and on Escape.
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMobileSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileSidebarOpen]);

  // Dark mode always uses the dark sidebar.
  const isDark = colorMode.resolved === 'dark' || shellLayout.forceDark;
  const effectiveSidebar = isDark ? 'spruce' : sidebarStyle;
  const drawerOnly = shell.sidebar === 'hidden';
  const twoCol = shell.sidebar === 'two';

  const pad = shell.wide ? 'p-3' : 'p-4 lg:p-6';
  const box = shell.container ? 'w-full max-w-[1280px] mx-auto' : '';
  const headerVariant = shell.detached ? 'detached' : shell.transparent ? (scrolled ? 'transparent-solid' : 'transparent') : 'default';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas" data-layout={shellLayout.layout}>
      <a href="#main-content" className="sr-only-focusable fixed top-2 start-2 z-[80] btn-primary btn-sm">Skip to content</a>
      {/* Drawer overlay */}
      {mobileSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] animate-fade-in ${drawerOnly || twoCol ? '' : 'lg:hidden'}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {twoCol && <TwoColumnSidebar side={shell.right ? 'right' : 'left'} />}
      <Sidebar
        isOpen={sidebarOpen || mobileSidebarOpen || drawerOnly}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        theme={effectiveSidebar}
        side={shell.right ? 'right' : 'left'}
        desktop={drawerOnly || twoCol ? 'hidden' : 'fixed'}
        detached={shell.detached}
      />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-spring ${offsetFor(shell, sidebarOpen)}`}>
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          colorMode={colorMode}
          sidebarStyle={sidebarStyle}
          onSidebarStyleChange={setSidebarStyle}
          layout={shellLayout}
          menuMode={shell.bottom ? 'none' : drawerOnly ? 'always' : 'mobile'}
          showBrand={drawerOnly || twoCol}
          variant={headerVariant}
        />
        {shell.nav && <HorizontalNav variant={shell.nav} />}
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          onScroll={shell.transparent ? (e) => setScrolled(e.currentTarget.scrollTop > 8) : undefined}
          className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth outline-none ${shell.bottom ? 'pb-20 lg:pb-24' : ''}`}
        >
          <div className={box}><PageBar pathname={location.pathname} transparent={shell.transparent} /></div>
          <div key={location.pathname} className={`page-enter flex-1 ${pad} ${box}`}>
            <Suspense fallback={<LoadingState text="Loading page…" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        {/* Floating Scroll To Top button */}
        {!shell.bottom && <ScrollToTop targetRef={mainRef} />}
      </div>
      {shell.bottom && <BottomNav onMenu={() => setMobileSidebarOpen(o => !o)} menuOpen={mobileSidebarOpen} />}
    </div>
  );
}
