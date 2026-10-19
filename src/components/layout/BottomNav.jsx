import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, LayoutGrid, FileBarChart, Bell, Menu } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';

const TABS = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard, match: (p) => p === '/dashboard' },
  { label: 'Apps', path: '/apps/chat', icon: LayoutGrid, match: (p) => p.startsWith('/apps') || p === '/calendar' },
  { label: 'Reports', path: '/reports', icon: FileBarChart, match: (p) => p.startsWith('/reports') },
  { label: 'Alerts', path: '/account/notifications', icon: Bell, match: (p) => p === '/account/notifications', badge: true },
];

/** Mobile-style tab bar for the bottom-navigation layout (all screen sizes). */
export default function BottomNav({ onMenu, menuOpen }) {
  const { pathname } = useLocation();
  const { unreadCount } = useNotifications();
  const tab = 'relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 h-full rounded text-[10.5px] font-semibold transition-colors';
  return (
    <nav aria-label="Bottom navigation" className="fixed bottom-0 inset-x-0 z-40 lg:bottom-3 lg:inset-x-auto lg:start-1/2 lg:-translate-x-1/2 rtl:lg:translate-x-1/2 lg:w-[480px]">
      <ul className="flex items-stretch h-16 px-2 gap-1 bg-surface-base border-t lg:border border-gray-200 lg:rounded-lg shadow-lg pb-[env(safe-area-inset-bottom)]">
        {TABS.map(t => {
          const active = t.match(pathname);
          return (
            <li key={t.label} className="flex-1 flex py-1.5">
              <NavLink to={t.path} className={`${tab} ${active ? 'text-primary bg-primary-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`} aria-current={active ? 'page' : undefined}>
                <t.icon size={19} aria-hidden="true" />
                <span className="truncate">{t.label}</span>
                {t.badge && unreadCount > 0 && (
                  <span className="absolute top-1 start-1/2 ms-1.5 min-w-[16px] h-4 px-1 rounded-full bg-danger-500 text-white text-[9px] font-bold grid place-items-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </NavLink>
            </li>
          );
        })}
        <li className="flex-1 flex py-1.5">
          <button type="button" onClick={onMenu} aria-expanded={menuOpen} className={`${tab} w-full ${menuOpen ? 'text-primary bg-primary-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Menu size={19} aria-hidden="true" />
            <span>Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
