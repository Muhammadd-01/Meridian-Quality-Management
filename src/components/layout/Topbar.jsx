import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Maximize,
  ChevronDown,
  User,
  Settings,
  LogOut
} from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Project Management',
  '/crm': 'CRM',
  '/lms-analytics': 'LMS Analytics',
  '/sales-analytics': 'Sales Analytics',
};

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden grid place-items-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="hidden md:block">
        <h1 className="text-base font-semibold text-gray-800">{pageTitle}</h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        {searchOpen ? (
          <input
            type="text"
            placeholder="Search..."
            className="form-input w-56 text-sm"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="grid place-items-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {/* Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="hidden md:grid place-items-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Maximize size={18} />
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative grid place-items-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-gray-200 animate-fade-in z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              {[
                { title: 'New project assigned', time: '2 min ago', color: 'bg-primary' },
                { title: 'Lead converted to opportunity', time: '15 min ago', color: 'bg-success' },
                { title: 'Course completion milestone', time: '1 hour ago', color: 'bg-info' },
                { title: 'Sales target achieved', time: '3 hours ago', color: 'bg-warning' },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.color}`} />
                  <div>
                    <p className="text-sm text-gray-700">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <button className="text-xs text-primary font-medium hover:underline">View All</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={16} className="text-primary" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-700 leading-tight">Admin User</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <ChevronDown size={14} className="text-gray-400 hidden md:block" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-gray-200 animate-fade-in z-50">
            <div className="p-2">
              <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <User size={16} /> My Profile
              </a>
              <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Settings size={16} /> Settings
              </a>
              <hr className="my-1 border-gray-100" />
              <a href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger-50">
                <LogOut size={16} /> Sign Out
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
