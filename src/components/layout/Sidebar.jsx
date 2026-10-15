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
  X,
  LogOut,
  CheckSquare,
  Clock,
  UserCheck,
  PieChart,
  Building2,
  PhoneCall,
  Activity,
  BookOpen,
  HelpCircle,
  Sparkles,
  Target,
  DollarSign,
  FileSpreadsheet,
  GitBranch,
  Sun,
  Moon
} from 'lucide-react';

// Section 1: Main Dashboards (Simple direct links, NO dropdown!)
const mainDashboardItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Main' },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/projects', label: 'Project Management', icon: GanttChartSquare },
  { path: '/lms-analytics', label: 'LMS Analytics', icon: BookOpenCheck },
  { path: '/sales-analytics', label: 'Sales Analytics', icon: TrendingUp },
];

// Section 2: Module Headings and their pages (NO dropdowns below!)
const moduleSections = [
  {
    id: 'crm',
    title: 'CRM',
    items: [
      { path: '/crm/customer-segments', label: 'Customer Segments', icon: PieChart },
      { path: '/crm/companies', label: 'Companies', icon: Building2 },
      { path: '/crm/activities', label: 'Activities', icon: Activity },
      { path: '/crm/calls-emails', label: 'Calls & Emails', icon: PhoneCall },
    ],
  },
  {
    id: 'projects',
    title: 'Project Management',
    items: [
      { path: '/projects', label: 'Projects', icon: GanttChartSquare },
      { path: '/projects/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/projects/team', label: 'Team', icon: UserCheck },
      { path: '/projects/timesheets', label: 'Timesheets', icon: Clock },
    ],
  },
  {
    id: 'lms',
    title: 'LMS Analytics',
    items: [
      { path: '/lms-analytics/course-catalog', label: 'Course Catalog', icon: BookOpen },
      { path: '/lms-analytics/learner-profile', label: 'Learner Profile', icon: Users },
      { path: '/lms-analytics/quiz-builder', label: 'Quiz Builder', icon: HelpCircle },
      { path: '/lms-analytics/activity-feed', label: 'Activity Feed', icon: Sparkles },
    ],
  },
  {
    id: 'sales',
    title: 'Sales Analytics',
    items: [
      { path: '/sales-analytics/leads', label: 'Leads', icon: Target },
      { path: '/sales-analytics/deals', label: 'Deals', icon: DollarSign },
      { path: '/sales-analytics/quotations', label: 'Quotations', icon: FileSpreadsheet },
      { path: '/sales-analytics/pipeline', label: 'Pipeline', icon: GitBranch, badge: 'NEW' },
    ],
  },
];

export default function Sidebar({
  isOpen,
  mobileOpen,
  onToggle,
  onMobileClose,
  theme = 'spruce', // Default is reference website spruce theme (#14201c)
  onThemeToggle
}) {
  const location = useLocation();
  const isLight = theme === 'light';

  // Theme-specific styling tokens
  const themeClasses = isLight
    ? {
        aside: 'bg-white text-[#1e211f] border-r border-[#e4e7e5] shadow-xs',
        headerBorder: 'border-b border-[#e4e7e5]',
        brandTitle: 'text-[#1e211f]',
        brandSub: 'text-[#757f79]',
        toggleBtn: 'text-[#5a625c] hover:text-[#1e211f] hover:bg-[#eff1f0]',
        sectionTitle: 'text-[#757f79]',
        sectionDivider: 'border-t border-[#eff1f0]',
        linkActive: 'bg-primary/10 text-primary font-semibold shadow-xs border-l-2 border-primary',
        linkInactive: 'text-[#5a625c] hover:text-[#1e211f] hover:bg-[#eff1f0]',
        footerBg: 'bg-[#f7f8f7] border-t border-[#e4e7e5]',
        userTitle: 'text-[#1e211f]',
        userSub: 'text-[#757f79]',
        scrollbar: 'sidebar-scrollbar-light',
      }
    : {
        // DreamsCore Reference Spruce Dark Theme (#14201c)
        aside: 'bg-[#14201c] text-white border-r border-white/[0.08]',
        headerBorder: 'border-b border-white/[0.08]',
        brandTitle: 'text-white',
        brandSub: 'text-white/40',
        toggleBtn: 'text-white/60 hover:text-white hover:bg-white/10',
        sectionTitle: 'text-white/40',
        sectionDivider: 'border-t border-white/[0.06]',
        linkActive: 'bg-gradient-to-r from-primary/30 to-primary/5 text-white font-semibold shadow-xs border-l-2 border-primary',
        linkInactive: 'text-white/70 hover:text-white hover:bg-white/[0.06]',
        footerBg: 'bg-[#0f1714] border-t border-white/[0.08]',
        userTitle: 'text-white',
        userSub: 'text-white/40',
        scrollbar: 'sidebar-scrollbar-dark',
      };

  const sidebarClasses = `
    fixed top-0 left-0 z-50 h-full ${themeClasses.aside}
    transition-all duration-300 flex flex-col
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
    ${isOpen ? 'w-[260px]' : 'lg:w-[72px] w-[260px]'}
  `;

  const handleNavClick = () => {
    onMobileClose?.();
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainEl.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  return (
    <aside className={sidebarClasses}>
      {/* Brand Header */}
      <div className={`flex items-center justify-between h-16 px-4 shrink-0 ${themeClasses.headerBorder}`}>
        <NavLink to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2.5 min-w-0 rounded-xl px-1.5 py-1.5 group">
          <div className="shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
            <Hexagon className="w-5 h-5 fill-white/20 stroke-white" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <span className={`text-sm font-bold tracking-tight truncate block ${themeClasses.brandTitle}`}>
                Meridian
              </span>
              <span className={`text-[9px] uppercase tracking-wider block -mt-0.5 truncate font-semibold ${themeClasses.brandSub}`}>
                Quality Management
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className={`hidden lg:grid place-items-center w-8 h-8 rounded-lg transition-colors ${themeClasses.toggleBtn}`}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>

        {/* Mobile close toggle */}
        <button
          onClick={onMobileClose}
          className={`lg:hidden grid place-items-center w-8 h-8 rounded-lg transition-colors ${themeClasses.toggleBtn}`}
        >
          <X size={17} />
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <nav className={`flex-1 overflow-y-auto ${themeClasses.scrollbar} px-3 pb-6 mt-1 space-y-3.5`}>

        {/* ========================================================================= */}
        {/* SECTION 1: MAIN DASHBOARDS (Simple direct links, NO dropdown!)             */}
        {/* ========================================================================= */}
        <div className="pt-1">
          {isOpen && (
            <div className="px-3 pb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${themeClasses.sectionTitle}`}>
                Main
              </span>
            </div>
          )}

          <ul className="space-y-0.5">
            {mainDashboardItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                      transition-all duration-150 group
                      ${isActive ? themeClasses.linkActive : themeClasses.linkInactive}
                      ${!isOpen ? 'lg:justify-center lg:px-0' : ''}
                    `}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon
                      size={17}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'text-primary'
                          : isLight
                          ? 'text-[#5a625c] group-hover:text-[#1e211f]'
                          : 'text-white/60 group-hover:text-white'
                      }`}
                    />
                    {isOpen && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {isOpen && item.badge && (
                      <span
                        className={`ms-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                          isLight
                            ? 'bg-primary/15 text-primary'
                            : 'bg-primary/20 text-primary-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: MODULE HEADINGS & DIRECT PAGES (CRM, PM, LMS, Sales)            */}
        {/* ========================================================================= */}
        {moduleSections.map((section) => (
          <div key={section.id} className={`pt-2.5 ${themeClasses.sectionDivider}`}>
            {/* Direct Section Heading */}
            {isOpen && (
              <div className="px-3 pb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${themeClasses.sectionTitle}`}>
                  {section.title}
                </span>
              </div>
            )}

            {/* Direct Navigation Links for all subpages (No dropdowns below!) */}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={handleNavClick}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                        transition-all duration-150 group
                        ${isActive ? themeClasses.linkActive : themeClasses.linkInactive}
                        ${!isOpen ? 'lg:justify-center lg:px-0' : ''}
                      `}
                      title={!isOpen ? item.label : undefined}
                    >
                      <Icon
                        size={17}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? 'text-primary'
                            : isLight
                            ? 'text-[#5a625c] group-hover:text-[#1e211f]'
                            : 'text-white/60 group-hover:text-white'
                        }`}
                      />
                      {isOpen && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {/* Clean Badge without golden selector */}
                      {isOpen && item.badge && (
                        <span
                          className={`ms-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                            item.badge === 'NEW'
                              ? 'bg-primary text-white'
                              : isLight
                              ? 'bg-primary/15 text-primary'
                              : 'bg-primary/20 text-primary-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Theme Switcher */}
      <div className={`p-3 shrink-0 ${themeClasses.footerBg}`}>
        {isOpen ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                MQ
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${themeClasses.userTitle}`}>Admin User</p>
                <p className={`text-[10px] truncate ${themeClasses.userSub}`}>Quality Director</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Theme Toggle Button */}
              {onThemeToggle && (
                <button
                  type="button"
                  onClick={onThemeToggle}
                  className={`w-7 h-7 rounded-lg grid place-items-center transition-colors ${themeClasses.toggleBtn}`}
                  title={isLight ? 'Switch to Reference Spruce Theme' : 'Switch to Light Theme'}
                >
                  {isLight ? <Moon size={14} /> : <Sun size={14} className="text-amber-400" />}
                </button>
              )}

              {/* Sign out */}
              <NavLink
                to="/login"
                title="Sign Out"
                className="w-7 h-7 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 grid place-items-center transition-colors"
              >
                <LogOut size={14} />
              </NavLink>
            </div>
          </div>
        ) : (
          <NavLink
            to="/login"
            title="Sign Out"
            className="w-full h-8 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 grid place-items-center transition-colors"
          >
            <LogOut size={16} />
          </NavLink>
        )}
      </div>
    </aside>
  );
}
