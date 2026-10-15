import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  CheckSquare,
  Clock,
  Briefcase,
  PieChart,
  Building2,
  CalendarCheck,
  PhoneCall,
  BookOpen,
  UserCheck,
  HelpCircle,
  Activity,
  Target,
  DollarSign,
  FileSpreadsheet,
  GitBranch,
  Sparkles
} from 'lucide-react';

// Section 1: Dashboards (All 5 primary executive & operational dashboards)
const dashboardGroup = {
  id: 'dashboards',
  label: 'Dashboards',
  icon: LayoutDashboard,
  items: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/projects', label: 'Project Management' },
    { path: '/crm', label: 'CRM' },
    { path: '/lms-analytics', label: 'LMS Analytics' },
    { path: '/sales-analytics', label: 'Sales Analytics' },
  ],
};

// Section 2: Application Modules (Subpages for each module)
const applicationModules = [
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    basePath: '/crm',
    items: [
      { path: '/crm/customer-segments', label: 'Customer Segments' },
      { path: '/crm/companies', label: 'Companies' },
      { path: '/crm/activities', label: 'Activities' },
      { path: '/crm/calls-emails', label: 'Calls & Emails' },
    ],
  },
  {
    id: 'projects',
    label: 'Project Management',
    icon: GanttChartSquare,
    basePath: '/projects',
    items: [
      { path: '/projects/tasks', label: 'Tasks' },
      { path: '/projects/team', label: 'Team' },
      { path: '/projects/timesheets', label: 'Timesheets' },
    ],
  },
  {
    id: 'lms',
    label: 'LMS Analytics',
    icon: BookOpenCheck,
    basePath: '/lms-analytics',
    items: [
      { path: '/lms-analytics/course-catalog', label: 'Course Catalog' },
      { path: '/lms-analytics/learner-profile', label: 'Learner Profile' },
      { path: '/lms-analytics/quiz-builder', label: 'Quiz Builder' },
      { path: '/lms-analytics/activity-feed', label: 'Activity Feed' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales Analytics',
    icon: TrendingUp,
    basePath: '/sales-analytics',
    items: [
      { path: '/sales-analytics/leads', label: 'Leads' },
      { path: '/sales-analytics/deals', label: 'Deals' },
      { path: '/sales-analytics/quotations', label: 'Quotations' },
      { path: '/sales-analytics/pipeline', label: 'Pipeline' },
    ],
  },
];

export default function Sidebar({ isOpen, mobileOpen, onToggle, onMobileClose }) {
  const location = useLocation();

  // Accordion open states (Dashboards & CRM open by default)
  const [openGroups, setOpenGroups] = useState({
    dashboards: true,
    crm: true,
    projects: false,
    lms: false,
    sales: false,
  });

  // Auto-expand the group matching current route
  useEffect(() => {
    // Check if in dashboard group
    const isDashboardActive = dashboardGroup.items.some(item => location.pathname === item.path);
    if (isDashboardActive) {
      setOpenGroups(prev => ({ ...prev, dashboards: true }));
    }

    // Check application modules
    applicationModules.forEach(mod => {
      const isModActive = mod.items.some(item => location.pathname === item.path) ||
        (location.pathname.startsWith(mod.basePath) && !dashboardGroup.items.some(item => location.pathname === item.path));
      if (isModActive) {
        setOpenGroups(prev => ({ ...prev, [mod.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const sidebarClasses = `
    fixed top-0 left-0 z-50 h-full bg-[#141414] text-white
    transition-all duration-300 flex flex-col
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
    ${isOpen ? 'w-[260px]' : 'lg:w-[72px] w-[260px]'}
  `;

  return (
    <aside className={sidebarClasses}>
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-white/[0.08]">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 min-w-0 rounded-xl px-1.5 py-1.5 group">
          <div className="shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
            <Hexagon className="w-5 h-5 fill-white/20 stroke-white" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <span className="text-sm font-bold text-white tracking-tight truncate block">
                Meridian
              </span>
              <span className="text-[9px] text-white/40 uppercase tracking-wider block -mt-0.5 truncate font-semibold">
                Quality Management
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:grid place-items-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>

        {/* Mobile close toggle */}
        <button
          onClick={onMobileClose}
          className="lg:hidden grid place-items-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-3 pb-6 mt-2 space-y-4">

        {/* ========================================================================= */}
        {/* SECTION 1: DASHBOARDS (Dashboard + 4 core pages like previously) */}
        {/* ========================================================================= */}
        <div>
          {isOpen && (
            <div className="px-3 pt-1 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                Dashboards
              </span>
            </div>
          )}

          {/* Dashboards Accordion Dropdown */}
          <div className="mt-0.5">
            <button
              type="button"
              onClick={() => isOpen && toggleGroup('dashboards')}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium
                transition-colors cursor-pointer text-left
                ${dashboardGroup.items.some(item => location.pathname === item.path)
                  ? 'text-white bg-white/[0.08]'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                }
                ${!isOpen ? 'lg:justify-center lg:px-0' : ''}
              `}
              title={!isOpen ? 'Dashboards' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LayoutDashboard
                  size={18}
                  className={`shrink-0 ${
                    dashboardGroup.items.some(item => location.pathname === item.path)
                      ? 'text-primary'
                      : 'text-white/70'
                  }`}
                />
                {isOpen && (
                  <span className="truncate font-semibold text-[13px] tracking-normal">
                    {dashboardGroup.label}
                  </span>
                )}
              </div>
              {isOpen && (
                <ChevronDown
                  size={14}
                  className={`text-white/40 transition-transform duration-200 shrink-0 ${
                    openGroups.dashboards ? 'rotate-180 text-white/80' : ''
                  }`}
                />
              )}
            </button>

            {/* Dashboards Sub-items with Dotted Line (as in reference screenshot) */}
            {openGroups.dashboards && isOpen && (
              <div className="relative pl-3.5 ml-5 mt-1 border-l border-dashed border-white/20 space-y-1">
                {dashboardGroup.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onMobileClose}
                      className={`
                        relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium
                        transition-all duration-150 group
                        ${isActive
                          ? 'bg-primary/20 text-white font-semibold shadow-xs'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                        }
                      `}
                    >
                      {/* Active indicator dot right on the vertical dotted guideline */}
                      {isActive && (
                        <span className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-[#141414]" />
                      )}

                      <span className="truncate">{item.label}</span>

                      {/* Pill badge for featured dashboards */}
                      {item.path === '/dashboard' && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/30 text-primary-200">
                          Main
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: APPLICATIONS & SUBPAGES (CRM, Project Management, LMS, Sales) */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-white/[0.06]">
          {isOpen && (
            <div className="px-3 pt-1 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                Applications & Modules
              </span>
            </div>
          )}

          <div className="space-y-1 mt-0.5">
            {applicationModules.map((module) => {
              const Icon = module.icon;
              const isGroupActive = module.items.some(item => location.pathname === item.path);
              const isExpanded = openGroups[module.id];

              return (
                <div key={module.id} className="pt-0.5">
                  {/* Module Accordion Header */}
                  <button
                    type="button"
                    onClick={() => isOpen && toggleGroup(module.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium
                      transition-colors cursor-pointer text-left
                      ${isGroupActive
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                      }
                      ${!isOpen ? 'lg:justify-center lg:px-0' : ''}
                    `}
                    title={!isOpen ? module.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={18}
                        className={`shrink-0 ${isGroupActive ? 'text-primary' : 'text-white/70'}`}
                      />
                      {isOpen && (
                        <span className="truncate font-semibold text-[13px] tracking-normal">
                          {module.label}
                        </span>
                      )}
                    </div>
                    {isOpen && (
                      <ChevronDown
                        size={14}
                        className={`text-white/40 transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-180 text-white/80' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Sub-items with Dotted Line (matching reference screenshot) */}
                  {isExpanded && isOpen && (
                    <div className="relative pl-3.5 ml-5 mt-1 border-l border-dashed border-white/20 space-y-1">
                      {module.items.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={onMobileClose}
                            className={`
                              relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium
                              transition-all duration-150 group
                              ${isSubActive
                                ? 'bg-primary/20 text-white font-semibold shadow-xs'
                                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                              }
                            `}
                          >
                            {/* Active indicator dot right on the vertical dotted guideline */}
                            {isSubActive && (
                              <span className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-[#141414]" />
                            )}

                            <span className="truncate">{subItem.label}</span>

                            {subItem.path === '/sales-analytics/pipeline' && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-gray-900 tracking-wide">
                                NEW
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </nav>

      {/* Footer Profile & Sign Out */}
      <div className="p-3 border-t border-white/[0.08] shrink-0 bg-[#121212]">
        {isOpen ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                MQ
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Admin User</p>
                <p className="text-[10px] text-white/40 truncate">Quality Director</p>
              </div>
            </div>
            <NavLink
              to="/login"
              title="Sign Out"
              className="w-7 h-7 rounded-lg text-white/40 hover:text-danger hover:bg-white/10 grid place-items-center transition-colors"
            >
              <LogOut size={14} />
            </NavLink>
          </div>
        ) : (
          <NavLink
            to="/login"
            title="Sign Out"
            className="w-full h-8 rounded-lg text-white/40 hover:text-danger hover:bg-white/10 grid place-items-center transition-colors"
          >
            <LogOut size={16} />
          </NavLink>
        )}
      </div>
    </aside>
  );
}
