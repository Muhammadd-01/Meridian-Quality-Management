import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
  LogOut,
  Check,
  Compass
} from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Project Management',
  '/projects/tasks': 'Tasks',
  '/projects/team': 'Team',
  '/projects/timesheets': 'Timesheets',
  '/crm': 'CRM Overview',
  '/crm/customer-segments': 'Customer Segments',
  '/crm/companies': 'Companies',
  '/crm/activities': 'Activities',
  '/crm/calls-emails': 'Calls & Emails',
  '/lms-analytics': 'LMS Analytics',
  '/lms-analytics/course-catalog': 'Course Catalog',
  '/lms-analytics/learner-profile': 'Learner Profile',
  '/lms-analytics/quiz-builder': 'Quiz Builder',
  '/lms-analytics/activity-feed': 'Activity Feed',
  '/sales-analytics': 'Sales Analytics',
  '/sales-analytics/leads': 'Leads',
  '/sales-analytics/deals': 'Deals',
  '/sales-analytics/quotations': 'Quotations',
  '/sales-analytics/pipeline': 'Pipeline',
};

export default function Topbar({ onMenuClick, theme = 'light', onThemeChange }) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const themeRef = useRef(null);

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
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
    <header className="sticky top-0 z-30 bg-white border-b border-[#e4e7e5] h-16 flex items-center px-4 md:px-6 gap-3 shadow-xs">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden grid place-items-center w-9 h-9 rounded-lg text-[#5a625c] hover:bg-[#eff1f0] transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="hidden md:block">
        <h1 className="text-base font-semibold text-[#1e211f]">{pageTitle}</h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Search */}
      <div className="relative hidden sm:block">
        {searchOpen ? (
          <input
            type="text"
            placeholder="Search records, projects, courses..."
            className="form-input w-64 text-sm"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="grid place-items-center w-9 h-9 rounded-full text-[#5a625c] hover:bg-[#eff1f0] transition-colors"
            title="Search"
          >
            <Search size={17} />
          </button>
        )}
      </div>

      {/* Elevated Toolbar matching DreamsCore reference layout */}
      <div className="flex items-center gap-1.5 h-10 px-2 rounded-full bg-white border border-[#e4e7e5] shadow-xs">

        {/* Theme Switcher Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="grid place-items-center w-7 h-7 rounded-full bg-amber-50 text-amber-600 hover:scale-105 transition-transform"
            title="Change Theme"
          >
            {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {themeOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-dropdown border border-[#e4e7e5] p-1.5 animate-fade-in z-50">
              <button
                onClick={() => { onThemeChange?.('spruce'); setThemeOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  theme === 'spruce' ? 'bg-primary/10 text-primary font-semibold' : 'text-[#5a625c] hover:bg-[#eff1f0]'
                }`}
              >
                <Compass size={15} className="text-primary" />
                <span>Reference Theme (Default)</span>
                {theme === 'spruce' && <Check size={13} className="ms-auto text-primary" />}
              </button>

              <button
                onClick={() => { onThemeChange?.('light'); setThemeOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  theme === 'light' ? 'bg-primary/10 text-primary font-semibold' : 'text-[#5a625c] hover:bg-[#eff1f0]'
                }`}
              >
                <Sun size={15} className="text-amber-500" />
                <span>Light Sidebar</span>
                {theme === 'light' && <Check size={13} className="ms-auto text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="hidden md:grid place-items-center w-7 h-7 rounded-full bg-[#eff1f0] text-[#5a625c] hover:scale-105 transition-transform"
          title="Toggle Fullscreen"
        >
          <Maximize size={13} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative grid place-items-center w-7 h-7 rounded-full bg-red-50 text-red-600 hover:scale-105 transition-transform"
            title="Notifications"
          >
            <Bell size={13} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-[#e4e7e5] animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-[#eff1f0] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1e211f]">Notifications</h3>
                <span className="badge-primary text-[10px]">4 Unread</span>
              </div>
              <div className="p-2 max-h-72 overflow-y-auto">
                {[
                  { title: 'ISO 9001 internal audit passed', time: '5 min ago', color: 'bg-primary' },
                  { title: 'New lead from Textile Corp assigned', time: '20 min ago', color: 'bg-info' },
                  { title: '12 employees completed QMS quiz', time: '1 hour ago', color: 'bg-accent' },
                  { title: 'Monthly revenue milestone achieved', time: '3 hours ago', color: 'bg-primary' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f7f8f7] cursor-pointer transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.color}`} />
                    <div>
                      <p className="text-xs font-medium text-[#1e211f]">{n.title}</p>
                      <p className="text-[11px] text-[#757f79] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-[#eff1f0] text-center">
                <button className="text-xs text-primary font-medium hover:underline">Mark all as read</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Menu */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#eff1f0] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">AD</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[#1e211f] leading-tight">Admin User</p>
            <p className="text-[10px] text-[#757f79]">Quality Director</p>
          </div>
          <ChevronDown size={14} className="text-[#757f79] hidden md:block" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-[#e4e7e5] animate-fade-in z-50 p-1.5">
            <div className="px-3 py-2 border-b border-[#eff1f0] mb-1">
              <p className="text-xs font-semibold text-[#1e211f]">Meridian Quality Management</p>
              <p className="text-[10px] text-[#757f79]">admin@meridianquality.com</p>
            </div>
            <a href="#profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#5a625c] hover:bg-[#eff1f0] transition-colors">
              <User size={14} /> My Profile
            </a>
            <a href="#settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#5a625c] hover:bg-[#eff1f0] transition-colors">
              <Settings size={14} /> Settings & Preferences
            </a>
            <hr className="my-1 border-[#eff1f0]" />
            <Link
              to="/login"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:bg-danger-50 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
