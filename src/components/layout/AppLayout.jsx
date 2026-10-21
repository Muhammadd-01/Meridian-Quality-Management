import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ScrollToTop from '../ui/ScrollToTop';
import LoadingState from '../ui/LoadingState';
import { useSettings } from '../../lib/settings';
import { useColorMode, useSidebarStyle } from '../../lib/theme';
import { useTrackRecentPage } from '../../lib/workspace';
import useScrollReveal from '../../hooks/useScrollReveal';
import { useDocumentMeta } from '../../lib/seo';
import { pageTitles, pageGroup } from '../../app/navigation';

const groupLinks = {
  Main: { label: 'Dashboards', to: '/dashboard' },
  CRM: { label: 'CRM', to: '/crm' },
  'Project Management': { label: 'Project Management', to: '/projects' },
  'Website Analytics': { label: 'Website Analytics', to: '/sales-analytics' },
  Workspace: { label: 'Workspace' },
};

/** Title bar under the header: page name on the left, breadcrumb trail on the right. */
function PageBar({ pathname }) {
  const title = pageTitles[pathname] || 'Dashboard';
  const group = groupLinks[pageGroup(pathname)] || groupLinks.Main;
  const showGroup = group.to !== pathname;
  return (
    <div className="page-bar px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-900 truncate">{title}</p>
      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs shrink-0">
        {showGroup && (group.to
          ? <Link to={group.to} className="font-semibold text-primary hover:text-primary-700 transition-colors">{group.label}</Link>
          : <span className="font-semibold text-gray-500">{group.label}</span>)}
        {showGroup && <ChevronRight size={12} className="text-gray-400" aria-hidden="true" />}
        <span className="text-gray-600 font-medium" aria-current="page">{title}</span>
      </nav>
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const [sidebarStyle, setSidebarStyle] = useSidebarStyle();
  const colorMode = useColorMode();
  const mainRef = useRef(null);
  const [settings] = useSettings();
  const reduceMotion = settings.preferences.reduceMotion;

  useTrackRecentPage();
  useDocumentMeta(location.pathname);
  useScrollReveal(mainRef, location.pathname, !reduceMotion);

  // In-app reduced-motion preference (the OS preference is honoured in CSS too)
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', !!reduceMotion);
  }, [reduceMotion]);

  // Ensure any selected page immediately starts from the top
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  // Close the mobile drawer on navigation and on Escape.
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
  const effectiveSidebar = colorMode.resolved === 'dark' ? 'spruce' : sidebarStyle;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      <a href="#main-content" className="sr-only-focusable fixed top-2 left-2 z-[80] btn-primary btn-sm">Skip to content</a>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        theme={effectiveSidebar}
      />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-spring ${
        sidebarOpen ? 'lg:ml-[256px]' : 'lg:ml-[72px]'
      }`}>
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          colorMode={colorMode}
          sidebarStyle={sidebarStyle}
          onSidebarStyleChange={setSidebarStyle}
        />
        <main ref={mainRef} id="main-content" tabIndex={-1} className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth outline-none">
          <PageBar pathname={location.pathname} />
          <div key={location.pathname} className="page-enter flex-1 p-4 lg:p-6">
            <Suspense fallback={<LoadingState text="Loading page…" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        {/* Floating Scroll To Top button */}
        <ScrollToTop targetRef={mainRef} />
      </div>
    </div>
  );
}
