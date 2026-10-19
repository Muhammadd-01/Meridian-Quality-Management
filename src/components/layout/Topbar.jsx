import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, Monitor, Maximize, Minimize, ChevronDown, User, Settings, LogOut, Check, Plus,
  History, BellOff, LayoutGrid, Compass, CalendarDays, CheckSquare, Contact, Building2, FileBarChart, Clock,
  BookOpen, PanelLeft, ArrowRight, Sparkles, AlertTriangle, ListChecks, Hexagon, RotateCcw, Eye,
} from 'lucide-react';
import { LAYOUT_OPTIONS, LAYOUT_BY_ID, DEFAULT_LAYOUT } from './layouts';
import { quickActions, moduleForPath, mainDashboardItems, mainGroups, moduleSections, allPages } from '../../app/navigation';
import CommandPalette from './CommandPalette';
import useNotifications from '../../hooks/useNotifications';
import useCollection from '../../hooks/useCollection';
import { useSettings } from '../../lib/settings';
import { useRecentPages } from '../../lib/workspace';
import { formatRelative } from '../../utils/format';

const kindDot = {
  success: 'bg-success-500',
  info: 'bg-info-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

const APPS = [
  { label: 'Calendar', path: '/calendar', icon: CalendarDays, tone: 'bg-primary-50 text-primary-600' },
  { label: 'Tasks', path: '/projects/tasks', icon: CheckSquare, tone: 'bg-info-50 text-info-600' },
  { label: 'Contacts', path: '/crm/contacts', icon: Contact, tone: 'bg-accent-50 text-accent-600' },
  { label: 'Companies', path: '/crm/companies', icon: Building2, tone: 'bg-success-50 text-success-600' },
  { label: 'Reports', path: '/reports', icon: FileBarChart, tone: 'bg-danger-50 text-danger-600' },
  { label: 'Audit Log', path: '/audit-log', icon: History, tone: 'bg-gray-100 text-gray-700' },
  { label: 'Timesheets', path: '/projects/timesheets', icon: Clock, tone: 'bg-warning-50 text-warning-600' },
  { label: 'Courses', path: '/lms-analytics/course-catalog', icon: BookOpen, tone: 'bg-primary-50 text-primary-600' },
  { label: 'Settings', path: '/settings', icon: Settings, tone: 'bg-info-50 text-info-600' },
];

const flattenNav = (items) => items.flatMap(i => (i.children ? flattenNav(i.children) : [i]));
// One entry per module section, linking to its dashboard (or first page).
const MODULE_LINKS = moduleSections
  .filter(s => !['workspace', 'ui', 'pages', 'support', 'reports', 'management'].includes(s.id))
  .map(s => {
    const first = flattenNav(s.items)[0];
    return { path: s.home || first.path, label: s.title, icon: first.icon };
  });
const EXPLORE_COLUMNS = [
  { title: 'Dashboards', items: mainDashboardItems },
  { title: 'Modules', items: MODULE_LINKS },
  { title: 'Applications', items: mainGroups.find(g => g.id === 'apps').children },
  {
    title: 'Workspace',
    items: [
      ...moduleSections.find(s => s.id === 'workspace').items,
      ...flattenNav(moduleSections.find(s => s.id === 'reports').items).filter(i => ['/reports', '/reports/builder', '/activity-log'].includes(i.path)),
      ...flattenNav(moduleSections.find(s => s.id === 'management').items),
    ],
  },
];

const COLOR_MODES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

/** Click-outside + Escape handling for one popover. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref, toggle: () => setOpen(o => !o) };
}

const HEADER_VARIANTS = {
  default: 'bg-surface-base border-b border-gray-200',
  detached: 'bg-surface-base border-b border-gray-200 lg:mt-3 lg:rounded-lg lg:border lg:shadow-sm',
  transparent: 'bg-transparent border-b border-transparent',
  'transparent-solid': 'bg-[color:var(--surface-overlay)] backdrop-blur-md border-b border-gray-200 shadow-md',
};

export default function Topbar({
  onMenuClick, colorMode, sidebarStyle, onSidebarStyleChange,
  layout, // { layout, saved, preview, setLayout } from ./layouts
  menuMode = 'mobile', // 'mobile' | 'always' | 'none' — when the drawer button shows
  showBrand = false, // brand mark in the header (layouts without a full sidebar)
  variant = 'default',
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const explore = usePopover();
  const apps = usePopover();
  const create = usePopover();
  const theme = usePopover();
  const notif = usePopover();
  const profile = usePopover();
  const [settings] = useSettings();
  const recent = useRecentPages();
  const [tasks] = useCollection('tasks');
  const { items: notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const profileInitials = settings.profile.name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AD';

  const orderedActions = useMemo(() => {
    const mod = moduleForPath(location.pathname);
    return [...quickActions].sort((a, b) => Number(b.modules.includes(mod)) - Number(a.modules.includes(mod)));
  }, [location.pathname]);

  const visibleNotifications = useMemo(() => {
    if (notifFilter === 'unread') return notifications.filter(n => !n.read);
    if (notifFilter === 'alerts') return notifications.filter(n => n.kind === 'danger' || n.kind === 'warning');
    return notifications;
  }, [notifications, notifFilter]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const taskStats = useMemo(() => ({
    dueToday: tasks.filter(t => t.status !== 'Completed' && t.dueDate === todayKey).length,
    overdue: tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < todayKey).length,
    open: tasks.filter(t => t.status !== 'Completed').length,
  }), [tasks, todayKey]);

  // Global shortcut: Ctrl/⌘+K opens the command palette.
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(open => !open);
      }
    };
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    [explore, apps, create, notif, profile, theme].forEach(p => p.setOpen(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const openNotification = (n) => {
    markRead(n.id);
    notif.setOpen(false);
    if (n.to) navigate(n.to);
  };

  const ModeIcon = colorMode.resolved === 'dark' ? Moon : Sun;
  const isToday = (iso) => String(iso || '').slice(0, 10) === todayKey;
  const notifGroups = [
    { label: 'Today', items: visibleNotifications.filter(n => isToday(n.at)) },
    { label: 'Earlier', items: visibleNotifications.filter(n => !isToday(n.at)) },
  ].filter(g => g.items.length);

  const iconBtn = 'relative grid place-items-center w-8 h-8 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md';

  return (
    <header className={`sticky top-0 ${searchOpen ? "z-[70]" : "z-30"} ${HEADER_VARIANTS[variant] || HEADER_VARIANTS.default} transition-[background-color,box-shadow,border-color] duration-300 h-[65px] flex items-center px-3 md:px-5 gap-2 md:gap-3 shrink-0`}>
      {/* Drawer toggle */}
      {menuMode !== 'none' && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className={`${menuMode === 'always' ? '' : 'lg:hidden'} btn-icon`}
        >
          <Menu size={20} />
        </button>
      )}

      {showBrand && (
        <Link to="/dashboard" className="hidden lg:flex items-center gap-2 shrink-0 me-1 group" aria-label="Meridian home">
          <span className="w-9 h-9 rounded-lg grid place-items-center text-white bg-gradient-to-br from-primary-400 to-primary-700 shadow-glow-primary group-hover:rotate-[-8deg] transition-transform duration-300">
            <Hexagon className="w-5 h-5 fill-white/20 stroke-white" aria-hidden="true" />
          </span>
          <span className="hidden xl:block leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-gray-900">Meridian</span>
            <span className="block text-[8.5px] uppercase tracking-[0.14em] font-bold text-gray-400">Quality Management</span>
          </span>
        </Link>
      )}

      {/* Search pill (opens command palette) */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="group hidden sm:flex items-center gap-2.5 h-10 ps-1.5 pe-2 w-60 lg:w-72 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-primary-300 hover:bg-white transition-all text-start"
        aria-label="Search pages, actions and records"
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
      >
        <span className="grid place-items-center w-7 h-7 rounded-full bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          <Search size={14} aria-hidden="true" />
        </span>
        <span className="flex-1 text-[13px] truncate">Search records, pages, actions…</span>
        <kbd className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <button type="button" onClick={() => setSearchOpen(true)} className="sm:hidden btn-icon" aria-label="Search">
        <Search size={18} />
      </button>

      {/* Explore + Apps pill */}
      <div className="hidden md:flex items-center gap-0.5 h-10 px-1 rounded-full border border-gray-200 bg-gray-50">
        <div ref={explore.ref}>
          <button
            type="button"
            onClick={explore.toggle}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold transition-colors ${explore.open ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
            aria-haspopup="dialog"
            aria-expanded={explore.open}
          >
            <Compass size={14} aria-hidden="true" /> Explore
            <ChevronDown size={13} className={`transition-transform ${explore.open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {explore.open && (
            <div className="fixed inset-x-0 top-[72px] z-50 flex justify-center px-4 pointer-events-none">
              <div role="dialog" aria-label="Explore the workspace" className="menu-panel pointer-events-auto w-full max-w-[1000px] overflow-hidden" style={{ transformOrigin: 'top center' }}>
                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-transparent">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-glow-primary"><Compass size={18} aria-hidden="true" /></span>
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">Explore Meridian</p>
                      <p className="text-xs text-gray-500">{allPages.length} workspaces · jump to any module or page</p>
                    </div>
                  </div>
                  {recent.length > 0 && (
                    <div className="hidden lg:flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 me-1">Recent</span>
                      {recent.slice(0, 4).map(p => (
                        <Link key={p.path} to={p.path} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white text-[11.5px] font-semibold text-gray-600 hover:border-primary-300 hover:text-primary transition-colors">
                          <p.icon size={11} aria-hidden="true" /> {p.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_190px] gap-x-4 gap-y-5 p-5 max-h-[60vh] overflow-y-auto">
                  {EXPLORE_COLUMNS.map(col => (
                    <div key={col.title}>
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-2">{col.title}</p>
                      <ul className="space-y-0.5">
                        {col.items.map(item => {
                          const Icon = item.icon;
                          const active = location.pathname === item.path;
                          return (
                            <li key={item.path}>
                              <Link to={item.path} className={`menu-item !py-1.5 group ${active ? 'is-active' : ''}`}>
                                <span className={`grid place-items-center w-7 h-7 rounded shrink-0 transition-colors ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary'}`}>
                                  <Icon size={14} aria-hidden="true" />
                                </span>
                                <span className="truncate">{item.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                  <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-lg hero-spruce hero-grid text-white p-4 flex flex-col">
                    <span className="hero-orb w-32 h-32 -top-10 -right-10 bg-[radial-gradient(circle,rgba(255,214,130,0.25),transparent_70%)]" aria-hidden="true" />
                    <span className="relative icon-tile w-9 h-9 bg-white/10 text-accent-300"><Sparkles size={16} aria-hidden="true" /></span>
                    <p className="relative text-sm font-bold mt-3">Reports & exports</p>
                    <p className="relative text-xs text-white/70 mt-1 leading-relaxed">13 reports with formulas, date filters and CSV / Excel / PDF export.</p>
                    <Link to="/reports" className="relative btn-glass btn-sm mt-4 self-start group">
                      Open reports <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs">
                  <span className="text-gray-500">{allPages.length} pages available</span>
                  <button type="button" onClick={() => { explore.setOpen(false); setSearchOpen(true); }} className="font-semibold text-primary hover:text-primary-700 inline-flex items-center gap-1.5">
                    Search everything <kbd className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={apps.ref}>
          <button
            type="button"
            onClick={apps.toggle}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold transition-colors ${apps.open ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}
            aria-haspopup="menu"
            aria-expanded={apps.open}
          >
            <LayoutGrid size={14} aria-hidden="true" /> Apps
            <ChevronDown size={13} className={`transition-transform ${apps.open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {apps.open && (
            <div role="menu" className="menu-panel absolute start-0 top-full mt-3 w-[320px] z-50 p-3" style={{ transformOrigin: 'top left' }}>
              <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">Apps</p>
                  <p className="text-[11px] text-gray-500">Jump to a workspace tool</p>
                </div>
                <Link to="/settings" role="menuitem" className="btn-icon w-7 h-7" aria-label="App settings"><Settings size={14} /></Link>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {APPS.map(a => (
                  <Link key={a.path} to={a.path} role="menuitem" className="group flex flex-col items-center gap-1.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className={`icon-tile w-10 h-10 ${a.tone}`}><a.icon size={17} aria-hidden="true" /></span>
                    <span className="text-[11.5px] font-semibold text-gray-700 group-hover:text-gray-900">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Quick Create */}
      <div className="relative" ref={create.ref}>
        <button
          type="button"
          onClick={create.toggle}
          className="btn-primary !rounded-full !px-3 md:!px-4 h-10"
          aria-haspopup="menu"
          aria-expanded={create.open}
        >
          <Plus size={15} aria-hidden="true" className={`transition-transform duration-300 ${create.open ? 'rotate-45' : ''}`} />
          <span className="hidden md:inline">Quick Create</span>
          <ChevronDown size={13} className="hidden md:block opacity-80" aria-hidden="true" />
        </button>
        {create.open && (
          <div role="menu" className="menu-panel absolute end-0 top-full mt-2 w-60 p-1.5 z-50 max-h-[70vh] overflow-y-auto">
            <p className="px-2.5 pt-1.5 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Quick create</p>
            {orderedActions.map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.id} to={a.path} role="menuitem" className="menu-item group">
                  <span className="grid place-items-center w-7 h-7 rounded bg-primary-50 text-primary transition-transform group-hover:scale-110"><Icon size={14} aria-hidden="true" /></span>
                  {a.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Toolbar pill */}
      <div className="flex items-center gap-1 h-10 px-1 rounded-full bg-gray-50 border border-gray-200">
        {/* Theme */}
        <div className="relative" ref={theme.ref}>
          <button
            type="button"
            onClick={theme.toggle}
            className={`${iconBtn} bg-accent-50 text-accent-600`}
            title="Theme"
            aria-label={`Theme: ${colorMode.mode}`}
            aria-haspopup="menu"
            aria-expanded={theme.open}
          >
            <ModeIcon size={15} className="transition-transform duration-500 hover:rotate-45" />
          </button>
          {theme.open && (
            <div role="menu" className="menu-panel absolute end-0 top-full mt-2 w-[min(18rem,calc(100vw-1.5rem))] p-1.5 z-50 max-h-[calc(100vh-90px)] overflow-y-auto">
              <p className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Appearance</p>
              {COLOR_MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={colorMode.mode === m.id}
                  onClick={() => { colorMode.setMode(m.id); theme.setOpen(false); }}
                  className={`menu-item ${colorMode.mode === m.id ? 'is-active' : ''}`}
                >
                  <m.icon size={15} aria-hidden="true" /> {m.label}
                  {colorMode.mode === m.id && <Check size={13} className="ms-auto" aria-hidden="true" />}
                </button>
              ))}
              <p className="px-2.5 pt-2.5 pb-1.5 mt-1 border-t border-gray-100 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Sidebar</p>
              {[['spruce', 'Spruce (dark)'], ['light', 'Light']].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sidebarStyle === id}
                  disabled={colorMode.resolved === 'dark' && id === 'light'}
                  onClick={() => { onSidebarStyleChange(id); theme.setOpen(false); }}
                  className={`menu-item disabled:opacity-40 disabled:pointer-events-none ${sidebarStyle === id ? 'is-active' : ''}`}
                  title={colorMode.resolved === 'dark' && id === 'light' ? 'Dark mode always uses the dark sidebar' : undefined}
                >
                  <PanelLeft size={15} aria-hidden="true" /> {label}
                  {sidebarStyle === id && <Check size={13} className="ms-auto" aria-hidden="true" />}
                </button>
              ))}
              {layout && (
                <>
                  <div className="flex items-center justify-between gap-2 px-2.5 pt-2.5 pb-1.5 mt-1 border-t border-gray-100">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Layout</p>
                    {layout.saved !== DEFAULT_LAYOUT && (
                      <button type="button" onClick={() => { layout.setLayout(DEFAULT_LAYOUT); theme.setOpen(false); }} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                        <RotateCcw size={11} aria-hidden="true" /> Reset
                      </button>
                    )}
                  </div>
                  {layout.preview && (
                    <p className="mx-1.5 mb-1.5 px-2 py-1.5 rounded bg-accent-50 text-[11px] text-gray-700 flex items-center gap-1.5">
                      <Eye size={12} className="text-accent-600 shrink-0" aria-hidden="true" />
                      Previewing {LAYOUT_BY_ID[layout.preview].short} on this page
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1">
                    {LAYOUT_OPTIONS.filter(l => l.id !== 'dark-mode').map(l => {
                      const on = layout.saved === l.id;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={on}
                          onClick={() => { layout.setLayout(l.id); theme.setOpen(false); }}
                          title={l.description}
                          className={`menu-item !px-2 !py-1.5 !text-[12px] ${on ? 'is-active' : ''}`}
                        >
                          <l.icon size={14} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{l.short}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Link to="/layouts/detached-sidebar" role="menuitem" className="menu-item !text-[12px] mt-1 !text-primary">
                    <Eye size={14} aria-hidden="true" /> Preview layouts
                    <ArrowRight size={12} className="ms-auto rtl:rotate-180" aria-hidden="true" />
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`${iconBtn} hidden md:grid bg-white text-gray-600 border border-gray-200`}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label="Toggle fullscreen"
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notif.ref}>
          <button
            type="button"
            onClick={notif.toggle}
            className={`${iconBtn} bg-danger-50 text-danger-600`}
            title="Notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-haspopup="dialog"
            aria-expanded={notif.open}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 min-w-[17px] h-[17px] px-1 rounded-full bg-danger-500 text-white text-[9.5px] font-bold grid place-items-center ring-2 ring-[color:var(--surface-raised)]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notif.open && (
            <div className="menu-panel absolute end-0 top-full mt-2 w-[min(24rem,calc(100vw-1.5rem))] z-50 overflow-hidden" role="dialog" aria-label="Notifications">
              <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && <span className="badge-danger badge-dot">{unreadCount} new</span>}
                </div>
                <Link to="/settings#notifications" className="btn-icon w-7 h-7" aria-label="Notification settings" onClick={() => notif.setOpen(false)}><Settings size={14} /></Link>
              </div>
              <div className="flex items-center justify-between gap-2 px-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1" role="tablist" aria-label="Notification filter">
                  {[['all', 'All'], ['unread', 'Unread'], ['alerts', 'Alerts']].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      role="tab"
                      aria-selected={notifFilter === val}
                      onClick={() => setNotifFilter(val)}
                      className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-colors ${notifFilter === val ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={markAllRead} disabled={unreadCount === 0} className="text-[11.5px] text-primary font-semibold hover:underline disabled:opacity-40 disabled:no-underline">Mark all read</button>
              </div>
              <div className="max-h-[22rem] overflow-y-auto">
                {notifGroups.length === 0 ? (
                  <div className="py-10 text-center px-4">
                    <span className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-full bg-gray-100 text-gray-400"><BellOff size={20} aria-hidden="true" /></span>
                    <p className="text-sm font-semibold text-gray-900">{notifFilter === 'all' ? 'No notifications yet' : 'You’re all caught up'}</p>
                    <p className="text-xs text-gray-500 mt-1">Record changes, overdue tasks and expiring quotations appear here.</p>
                  </div>
                ) : notifGroups.map(group => (
                  <div key={group.label}>
                    <p className="px-4 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">{group.label}</p>
                    {group.items.slice(0, 20).map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => openNotification(n)}
                        className={`w-full text-start flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 ${n.read ? '' : 'bg-primary-50/40'}`}
                      >
                        <span className={`mt-0.5 grid place-items-center w-8 h-8 rounded-full shrink-0 ${n.kind === 'danger' ? 'bg-danger-50 text-danger-600' : n.kind === 'warning' ? 'bg-warning-50 text-warning-600' : 'bg-primary-50 text-primary'}`} aria-hidden="true">
                          {n.kind === 'danger' || n.kind === 'warning' ? <AlertTriangle size={14} /> : <History size={14} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={`text-[12.5px] leading-snug line-clamp-2 ${n.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                              {n.title}
                              {!n.read && <span className="sr-only"> (unread)</span>}
                            </span>
                            <span className="text-[10.5px] text-gray-400 shrink-0 whitespace-nowrap">{formatRelative(n.at)}</span>
                          </span>
                          {n.detail && <span className="block text-[11.5px] text-gray-500 mt-0.5 truncate">{n.detail}</span>}
                        </span>
                        {!n.read && <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${kindDot[n.kind] || 'bg-primary'}`} aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <Link to="/audit-log" onClick={() => notif.setOpen(false)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-gray-100 text-xs font-semibold text-primary hover:bg-gray-50 transition-colors">
                View activity history <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="relative" ref={profile.ref}>
        <button
          type="button"
          onClick={profile.toggle}
          className="flex items-center gap-2 h-10 ps-1 pe-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-sm transition-all"
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={profile.open}
        >
          <span className="relative w-8 h-8 rounded-full bg-gradient-to-br from-accent-300 to-primary-500 grid place-items-center text-[11px] font-extrabold text-white">
            {profileInitials}
            <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-success-400 ring-2 ring-[color:var(--surface-raised)]" aria-hidden="true" />
          </span>
          <span className="hidden xl:block text-start">
            <span className="block text-xs font-bold text-gray-900 leading-tight">{settings.profile.name.split(' ')[0]}</span>
            <span className="block text-[10px] text-gray-500">Admin</span>
          </span>
          <ChevronDown size={13} className={`text-gray-400 hidden md:block transition-transform ${profile.open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {profile.open && (
          <div role="menu" className="menu-panel absolute end-0 top-full mt-2 w-72 z-50 overflow-hidden">
            <div className="relative p-4 hero-spruce hero-grid text-white">
              <div className="relative flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-300 to-primary-400 grid place-items-center text-sm font-extrabold ring-2 ring-white/20">{profileInitials}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate flex items-center gap-1.5">{settings.profile.name}<span className="text-[9px] font-extrabold uppercase px-1 rounded bg-accent-400/25 text-accent-200">Admin</span></p>
                  <p className="text-[11px] text-white/65 truncate">{settings.profile.email}</p>
                </div>
              </div>
              <div className="relative grid grid-cols-3 gap-2 mt-3.5">
                {[
                  { label: 'Due today', value: taskStats.dueToday, to: '/projects/tasks' },
                  { label: 'Overdue', value: taskStats.overdue, to: '/projects/tasks' },
                  { label: 'Unread', value: unreadCount, to: '/account/notifications' },
                ].map(s => (
                  <Link key={s.label} to={s.to} role="menuitem" className="rounded bg-white/[0.08] hover:bg-white/[0.14] transition-colors px-2 py-1.5 text-center">
                    <span className="block text-base font-extrabold tabular-nums">{s.value}</span>
                    <span className="block text-[10px] text-white/60">{s.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="p-1.5">
              <Link role="menuitem" to="/account/profile" className="menu-item"><User size={15} aria-hidden="true" /> My Profile</Link>
              <Link role="menuitem" to="/settings" className="menu-item"><Settings size={15} aria-hidden="true" /> Settings & Preferences</Link>
              <Link role="menuitem" to="/projects/tasks" className="menu-item"><ListChecks size={15} aria-hidden="true" /> My Tasks <span className="ms-auto badge-secondary">{taskStats.open}</span></Link>
              <Link role="menuitem" to="/settings#notifications" className="menu-item"><Bell size={15} aria-hidden="true" /> Notification Preferences</Link>
              <hr className="my-1 border-gray-100" />
              <Link role="menuitem" to="/login" className="menu-item !text-danger-600 hover:!bg-danger-50"><LogOut size={15} aria-hidden="true" /> Sign Out</Link>
            </div>
          </div>
        )}
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
