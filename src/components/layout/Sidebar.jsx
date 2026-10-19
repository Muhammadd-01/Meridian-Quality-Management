import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  PanelLeftClose, PanelLeftOpen, Hexagon, X, LogOut, Star, ChevronDown, Database, ArrowRight,
} from 'lucide-react';
import { mainGroups, moduleSections } from '../../app/navigation';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useSettings } from '../../lib/settings';
import { useFavorites, storageUsage } from '../../lib/workspace';

const COLLAPSED_KEY = 'meridian-sidebar-collapsed-sections';
const FAVORITES_VISIBLE = 4;

const containsPath = (item, path) => (item.children ? item.children.some(c => containsPath(c, path)) : item.path === path);
const groupKey = (scope, g) => `${scope}:${g.id || g.label}`;

const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

export default function Sidebar({
  isOpen,
  mobileOpen,
  onToggle,
  onMobileClose,
  theme = 'spruce', // 'spruce' = reference dark sidebar (#14201c), 'light' = white sidebar
  side = 'left', // 'right' for the right-sidebar and RTL layouts
  desktop = 'fixed', // 'hidden' = drawer only, on every screen size (horizontal, fullscreen, bottom nav…)
  detached = false, // floating rounded card (detached layout)
}) {
  const location = useLocation();
  const isLight = theme === 'light';
  const [settings] = useSettings();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [collapsed, setCollapsed] = useLocalStorage(COLLAPSED_KEY, []);
  const [favOpen, setFavOpen] = useState(true);
  const [favExpanded, setFavExpanded] = useState(false);
  const [usage, setUsage] = useState(() => storageUsage());

  // Refresh the storage meter on navigation (records change as people work).
  useEffect(() => { setUsage(storageUsage()); }, [location.pathname]);

  // A section holding the active page is always shown expanded.
  const activeSection = useMemo(
    () => moduleSections.find(s => s.items.some(i => containsPath(i, location.pathname)))?.id,
    [location.pathname]
  );

  // Expandable groups (Dashboards, Applications, Users & Access, report categories…).
  const activeGroups = useMemo(() => {
    const keys = [];
    mainGroups.forEach(g => { if (containsPath(g, location.pathname)) keys.push(groupKey('main', g)); });
    moduleSections.forEach(sec => sec.items.forEach(i => { if (i.children && containsPath(i, location.pathname)) keys.push(groupKey(sec.id, i)); }));
    return keys;
  }, [location.pathname]);
  const [openGroups, setOpenGroups] = useState(() => new Set(activeGroups));
  useEffect(() => { setOpenGroups(prev => new Set([...prev, ...activeGroups])); }, [activeGroups]);
  const toggleGroup = (key) => {
    if (!isOpen) { onToggle?.(); setOpenGroups(prev => new Set([...prev, key])); return; }
    setOpenGroups(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  };
  const collapsedSet = new Set(Array.isArray(collapsed) ? collapsed : []);
  const toggleSection = (id) => setCollapsed(prev => {
    const cur = new Set(Array.isArray(prev) ? prev : []);
    if (cur.has(id)) cur.delete(id); else cur.add(id);
    return [...cur];
  });

  const t = isLight
    ? {
        aside: 'bg-white text-gray-900 border-r border-gray-200',
        divider: 'border-gray-200',
        brandTitle: 'text-gray-900',
        brandSub: 'text-gray-500',
        toggleBtn: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
        sectionTitle: 'text-gray-400 hover:text-gray-600',
        linkActive: 'is-active bg-primary-50 text-primary-700 font-semibold',
        linkInactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        icon: 'text-gray-400 group-hover:text-gray-700',
        star: 'text-gray-300 hover:text-accent',
        tile: 'favorite-tile !bg-gray-50 !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900',
        tileActive: 'favorite-tile !bg-primary-50 !text-primary-700',
        tileIcon: 'bg-white border border-gray-200 text-primary',
        widget: 'bg-gray-50 border border-gray-200',
        widgetText: 'text-gray-900',
        widgetSub: 'text-gray-500',
        track: 'bg-gray-200',
        footer: 'border-t border-gray-200',
        userTitle: 'text-gray-900',
        userSub: 'text-gray-500',
        scrollbar: 'sidebar-scrollbar-light',
      }
    : {
        aside: 'sidebar-pattern text-white border-r border-white/[0.06]',
        divider: 'border-white/[0.06]',
        brandTitle: 'text-white',
        brandSub: 'text-white/40',
        toggleBtn: 'text-white/55 hover:text-white hover:bg-white/10',
        sectionTitle: 'text-white/35 hover:text-white/70',
        linkActive: 'is-active bg-gradient-to-r from-primary-500/25 to-primary-500/[0.04] text-white font-semibold',
        linkInactive: 'text-[color:var(--sidebar-text)] hover:text-white hover:bg-white/[0.06]',
        icon: 'text-white/50 group-hover:text-white',
        star: 'text-white/25 hover:text-accent-300',
        tile: 'favorite-tile',
        tileActive: 'favorite-tile is-active',
        tileIcon: 'bg-white/[0.08] text-primary-300',
        widget: 'bg-white/[0.04] border border-white/[0.07]',
        widgetText: 'text-white',
        widgetSub: 'text-white/45',
        track: 'bg-white/10',
        footer: 'border-t border-white/[0.06] bg-black/10',
        userTitle: 'text-white',
        userSub: 'text-white/45',
        scrollbar: 'sidebar-scrollbar-dark',
      };

  const right = side === 'right';
  const hiddenOnDesktop = desktop === 'hidden';
  const asideTheme = right ? t.aside.replace('border-r', 'border-l') : t.aside;
  const sidebarClasses = `
    fixed top-0 ${right ? 'right-0' : 'left-0'} z-50 h-full ${asideTheme}
    transition-[width,transform] duration-300 ease-spring flex flex-col
    ${mobileOpen ? 'translate-x-0 shadow-xl' : right ? 'translate-x-full' : '-translate-x-full'}
    ${hiddenOnDesktop ? '' : 'lg:translate-x-0'}
    ${detached && !hiddenOnDesktop ? `lg:top-3 lg:h-[calc(100%-1.5rem)] lg:rounded-lg lg:shadow-lg lg:border ${right ? 'lg:right-3' : 'lg:left-3'}` : ''}
    ${isOpen || hiddenOnDesktop ? 'w-[256px]' : 'lg:w-[72px] w-[256px]'}
  `;

  const handleNavClick = () => {
    onMobileClose?.();
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const initials = settings.profile.name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AD';
  const usagePct = Math.min(100, (usage.bytes / usage.quota) * 100);
  const visibleFavorites = favExpanded ? favorites : favorites.slice(0, FAVORITES_VISIBLE);

  const renderLink = (item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const pinned = isFavorite(item.path);
    return (
      <li key={item.path} className="relative group/link">
        <NavLink
          to={item.path}
          onClick={handleNavClick}
          className={`sidebar-link group ${isActive ? t.linkActive : t.linkInactive} ${!isOpen ? 'lg:justify-center lg:!px-0' : 'pe-8'}`}
          title={!isOpen ? item.label : undefined}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon size={17} className={`shrink-0 transition-colors ${isActive ? (isLight ? 'text-primary' : 'text-primary-300') : t.icon}`} aria-hidden="true" />
          {isOpen && <span className="truncate">{item.label}</span>}
          {isOpen && item.badge && (
            <span className={`ms-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide ${
              item.badge === 'NEW' ? 'bg-accent-500 text-white' : isLight ? 'bg-primary-50 text-primary-700' : 'bg-primary-500/20 text-primary-200'
            }`}>
              {item.badge}
            </span>
          )}
        </NavLink>
        {isOpen && (
          <button
            type="button"
            onClick={() => toggleFavorite(item.path)}
            className={`absolute end-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded transition-all ${
              pinned ? 'text-accent-400 opacity-100' : `${t.star} opacity-0 group-hover/link:opacity-100 focus-visible:opacity-100`
            }`}
            aria-label={pinned ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`}
            aria-pressed={pinned}
            title={pinned ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={12} className={pinned ? 'fill-current' : ''} />
          </button>
        )}
      </li>
    );
  };

  const renderGroup = (group, key) => {
    const Icon = group.icon;
    const open = openGroups.has(key) && isOpen;
    const active = containsPath(group, location.pathname);
    return (
      <li key={key}>
        <button
          type="button"
          onClick={() => toggleGroup(key)}
          aria-expanded={open}
          title={!isOpen ? group.label : undefined}
          className={`sidebar-link group w-full ${active && !open ? t.linkActive : t.linkInactive} ${!isOpen ? 'lg:justify-center lg:!px-0' : ''}`}
        >
          {Icon && <Icon size={17} className={`shrink-0 transition-colors ${active ? (isLight ? 'text-primary' : 'text-primary-300') : t.icon}`} aria-hidden="true" />}
          {isOpen && <span className="truncate flex-1 text-start">{group.label}</span>}
          {isOpen && <span className={`text-[10px] font-bold tabular-nums ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{group.children.length}</span>}
          {isOpen && <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'} ${isLight ? 'text-gray-400' : 'text-white/40'}`} aria-hidden="true" />}
        </button>
        {open && (
          <ul className={`mt-0.5 mb-1 ms-[1.15rem] ps-2 space-y-0.5 border-s animate-fade-in ${isLight ? 'border-gray-200' : 'border-white/[0.08]'}`}>
            {group.children.map(c => (c.children ? renderGroup(c, `${key}/${c.label}`) : renderLink(c)))}
          </ul>
        )}
      </li>
    );
  };

  const headingClass = `w-full flex items-center justify-between px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors ${t.sectionTitle}`;

  return (
    <aside className={sidebarClasses} aria-label="Primary navigation">
      {/* Brand */}
      <div className={`flex items-center justify-between h-[65px] px-4 shrink-0 border-b ${t.divider}`}>
        <NavLink to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2.5 min-w-0 rounded px-1 py-1.5 group">
          <div className="shrink-0 w-9 h-9 rounded-lg grid place-items-center text-white bg-gradient-to-br from-primary-400 to-primary-700 shadow-glow-primary group-hover:rotate-[-8deg] group-hover:scale-105 transition-transform duration-300">
            <Hexagon className="w-5 h-5 fill-white/20 stroke-white" aria-hidden="true" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <span className={`text-[17px] font-extrabold tracking-tight truncate block leading-5 ${t.brandTitle}`}>
                Meridian
              </span>
              <span className={`text-[9px] uppercase tracking-[0.14em] block truncate font-bold ${t.brandSub}`}>
                Quality Management
              </span>
            </div>
          )}
        </NavLink>

        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={isOpen}
          className={`hidden ${hiddenOnDesktop ? '' : 'lg:grid'} place-items-center w-8 h-8 rounded transition-colors ${t.toggleBtn}`}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className={`${hiddenOnDesktop ? '' : 'lg:hidden'} grid place-items-center w-8 h-8 rounded transition-colors ${t.toggleBtn}`}
        >
          <X size={17} />
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto ${t.scrollbar} px-3 pb-4 pt-3 space-y-4`}>
        {/* Favorites */}
        {isOpen && favorites.length > 0 && (
          <div>
            <button type="button" onClick={() => setFavOpen(o => !o)} className={`${headingClass} pb-2`} aria-expanded={favOpen}>
              <span className="flex items-center gap-2">
                Favorites
                <span className={`min-w-[18px] px-1 rounded-full text-[9.5px] leading-[16px] ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/70'}`}>{favorites.length}</span>
              </span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${favOpen ? '' : '-rotate-90'}`} aria-hidden="true" />
            </button>
            {favOpen && (
              <>
                <ul className="grid grid-cols-2 gap-2 animate-fade-in">
                  {visibleFavorites.map(f => {
                    const Icon = f.icon;
                    const active = location.pathname === f.path;
                    return (
                      <li key={f.path} className="relative">
                        <Link to={f.path} onClick={handleNavClick} className={`${active ? t.tileActive : t.tile} w-full`} aria-current={active ? 'page' : undefined}>
                          <span className={`w-8 h-8 rounded grid place-items-center ${active ? 'bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-glow-primary' : t.tileIcon}`}>
                            <Icon size={15} aria-hidden="true" />
                          </span>
                          <span className="text-[11px] font-semibold leading-tight line-clamp-1 w-full px-1">{f.label}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(f.path)}
                          className="absolute top-1 end-1 grid place-items-center w-5 h-5 rounded text-accent-400 hover:scale-110 transition-transform"
                          aria-label={`Remove ${f.label} from favorites`}
                          title="Remove from favorites"
                        >
                          <Star size={10} className="fill-current" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {favorites.length > FAVORITES_VISIBLE && (
                  <button
                    type="button"
                    onClick={() => setFavExpanded(x => !x)}
                    className={`w-full mt-2 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${isLight ? 'text-primary hover:text-primary-700' : 'text-primary-300 hover:text-primary-200'}`}
                  >
                    {favExpanded ? 'Show less' : `View ${favorites.length - FAVORITES_VISIBLE} more`}
                    <ChevronDown size={11} className={`transition-transform ${favExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Main: Dashboards, Applications, Layouts */}
        <div>
          {isOpen && <p className={headingClass}>Main</p>}
          <ul className="space-y-0.5">
            {mainGroups.map(g => renderGroup(g, groupKey('main', g)))}
          </ul>
        </div>

        {/* Module sections (collapsible) */}
        {moduleSections.map(section => {
          const open = !isOpen || section.id === activeSection || !collapsedSet.has(section.id);
          return (
            <div key={section.id} className={`pt-3 border-t ${t.divider}`}>
              {isOpen && (
                <button type="button" onClick={() => toggleSection(section.id)} className={headingClass} aria-expanded={open}>
                  {section.title}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
                </button>
              )}
              {open && (
                <ul className="space-y-0.5 animate-fade-in">
                  {section.items.map(item => (item.children ? renderGroup(item, groupKey(section.id, item)) : renderLink(item)))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Storage widget */}
      {isOpen && (
        <div className="px-3 pb-3 shrink-0">
          <div className={`rounded-lg p-3 ${t.widget}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`flex items-center gap-1.5 text-xs font-bold ${t.widgetText}`}>
                <Database size={13} className={isLight ? 'text-primary' : 'text-primary-300'} aria-hidden="true" /> Local storage
              </span>
              <span className={`text-[11px] font-semibold tabular-nums ${t.widgetSub}`}>{formatSize(usage.bytes)} / 5 MB</span>
            </div>
            <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${t.track}`} role="progressbar" aria-valuenow={Math.round(usagePct)} aria-valuemin={0} aria-valuemax={100} aria-label="Browser storage used">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-400 via-accent-400 to-accent-500 transition-[width] duration-700" style={{ width: `${Math.max(usagePct, 2)}%` }} />
            </div>
            <Link to="/settings#data" onClick={handleNavClick} className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold group ${isLight ? 'text-primary' : 'text-primary-300 hover:text-primary-200'}`}>
              Manage data <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* Footer profile */}
      <div className={`px-3 py-3 shrink-0 ${t.footer}`}>
        {isOpen ? (
          <div className="flex items-center justify-between gap-2">
            <Link to="/settings#profile" onClick={handleNavClick} className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-accent-300 to-primary-500 grid place-items-center text-xs font-extrabold text-white shrink-0">
                {initials}
                <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-success-400 ring-2 ring-[color:var(--sidebar-bg)]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className={`text-[13px] font-bold truncate flex items-center gap-1.5 ${t.userTitle}`}>
                  <span className="truncate">{settings.profile.name}</span>
                  <span className="text-[8.5px] font-extrabold uppercase px-1 rounded bg-accent-500/20 text-accent-400 tracking-wide shrink-0">Admin</span>
                </p>
                <p className={`text-[11px] truncate ${t.userSub}`}>{settings.profile.title}</p>
              </div>
            </Link>
            <NavLink
              to="/login"
              title="Sign out"
              aria-label="Sign out"
              className={`w-8 h-8 rounded grid place-items-center transition-colors ${t.toggleBtn} hover:!text-danger-400`}
            >
              <LogOut size={15} />
            </NavLink>
          </div>
        ) : (
          <NavLink
            to="/login"
            title="Sign out"
            aria-label="Sign out"
            className={`w-full h-8 rounded grid place-items-center transition-colors ${t.toggleBtn}`}
          >
            <LogOut size={16} />
          </NavLink>
        )}
      </div>
    </aside>
  );
}
