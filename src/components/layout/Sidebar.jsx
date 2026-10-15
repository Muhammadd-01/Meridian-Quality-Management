import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GanttChartSquare,
  Users,
  BookOpenCheck,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  Hexagon,
  X
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Project Management', icon: GanttChartSquare },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/lms-analytics', label: 'LMS Analytics', icon: BookOpenCheck },
  { path: '/sales-analytics', label: 'Sales Analytics', icon: TrendingUp },
];

export default function Sidebar({ isOpen, mobileOpen, onToggle, onMobileClose }) {
  const location = useLocation();

  const sidebarClasses = `
    fixed top-0 left-0 z-50 h-full bg-[#141414] text-white
    transition-all duration-300 flex flex-col
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
    ${isOpen ? 'w-[260px]' : 'lg:w-[72px] w-[260px]'}
  `;

  return (
    <aside className={sidebarClasses}>
      {/* Logo area */}
      <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-white/[0.08]">
        <a href="/dashboard" className="flex items-center gap-2.5 min-w-0 rounded-xl px-2 py-1.5">
          <div className="shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <span className="text-sm font-bold text-white truncate">
              Meridian
            </span>
          )}
        </a>
        {/* Desktop collapse */}
        <button
          onClick={onToggle}
          className="hidden lg:grid place-items-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="lg:hidden grid place-items-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-3 pb-4 mt-1">
        {isOpen && (
          <div className="px-3 pt-4 pb-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-white/40">
              Main Menu
            </span>
          </div>
        )}

        <ul className="space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onMobileClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                    transition-all duration-200 group
                    ${isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                    }
                    ${!isOpen ? 'lg:justify-center lg:px-0' : ''}
                  `}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  {isOpen && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom branding */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-white/[0.08] shrink-0">
          <p className="text-[10px] text-white/30 text-center">
            Meridian Quality Management
          </p>
        </div>
      )}
    </aside>
  );
}
