import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ScrollToTop from '../ui/ScrollToTop';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  // Default to 'spruce' (exact DreamsCore reference website sidebar theme)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('meridian-theme-v2');
    if (saved) return saved;
    localStorage.setItem('meridian-theme-v2', 'spruce');
    return 'spruce';
  });
  const mainRef = useRef(null);

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

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'spruce' ? 'light' : 'spruce';
      localStorage.setItem('meridian-theme-v2', next);
      return next;
    });
  };

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('meridian-theme-v2', newTheme);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8f7]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Reference Spruce #14201c by default, direct headings, no dropdowns) */}
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        theme={theme}
        onThemeToggle={handleToggleTheme}
      />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]'
      }`}>
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
          theme={theme}
          onThemeChange={handleSetTheme}
        />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-[#f7f8f7]">
          <Outlet />
        </main>
        {/* Floating Scroll To Top button */}
        <ScrollToTop targetRef={mainRef} />
      </div>
    </div>
  );
}
