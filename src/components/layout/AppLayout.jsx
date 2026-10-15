import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]'
      }`}>
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
