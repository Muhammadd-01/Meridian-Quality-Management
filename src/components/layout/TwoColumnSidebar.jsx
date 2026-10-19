import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Hexagon, LogOut } from 'lucide-react';
import { mainGroups, moduleSections } from '../../app/navigation';

const flatten = (items) => items.flatMap(i => (i.children ? flatten(i.children) : [i]));
const contains = (items, path) => flatten(items).some(i => i.path === path);

/** Rail entries: the MAIN groups, then every module section (icon = its first page's icon). */
const RAIL = [
  ...mainGroups.map(g => ({ id: g.id, title: g.label, icon: g.icon, items: g.children })),
  ...moduleSections.map(s => ({ id: s.id, title: s.title, icon: flatten(s.items)[0].icon, items: s.items })),
];

/**
 * Two-sidebar layout (large screens): an icon rail of sections plus a
 * secondary sidebar listing the selected section's pages. Smaller screens
 * use the regular drawer sidebar.
 */
export default function TwoColumnSidebar({ side = 'left' }) {
  const { pathname } = useLocation();
  const activeId = useMemo(() => (RAIL.find(r => contains(r.items, pathname)) || RAIL[0]).id, [pathname]);
  const [selected, setSelected] = useState(activeId);
  useEffect(() => { setSelected(activeId); }, [activeId]);
  const current = RAIL.find(r => r.id === selected) || RAIL[0];

  const renderItems = (items) => items.map(item => {
    if (item.children) {
      return (
        <li key={item.label} className="pt-2">
          <p className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/35">{item.label}</p>
          <ul className="space-y-0.5">{renderItems(item.children)}</ul>
        </li>
      );
    }
    const Icon = item.icon;
    const active = item.path === pathname;
    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          className={`sidebar-link group ${active ? 'is-active bg-gradient-to-r from-primary-500/25 to-primary-500/[0.04] text-white font-semibold' : 'text-[color:var(--sidebar-text)] hover:text-white hover:bg-white/[0.06]'}`}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={16} className={`shrink-0 ${active ? 'text-primary-300' : 'text-white/50 group-hover:text-white'}`} aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      </li>
    );
  });

  const sideCls = side === 'right' ? 'right-0 flex-row-reverse' : 'left-0';

  return (
    <aside className={`hidden lg:flex fixed top-0 ${sideCls} z-40 h-full w-[304px] text-white`} aria-label="Primary navigation">
      {/* Icon rail */}
      <div className={`w-[72px] shrink-0 flex flex-col items-center bg-[color:var(--sidebar-bg)] ${side === 'right' ? 'border-s' : 'border-e'} border-white/[0.06]`}>
        <Link to="/dashboard" className="h-[65px] grid place-items-center shrink-0" aria-label="Meridian home">
          <span className="w-9 h-9 rounded-lg grid place-items-center bg-gradient-to-br from-primary-400 to-primary-700 shadow-glow-primary">
            <Hexagon className="w-5 h-5 fill-white/20 stroke-white" aria-hidden="true" />
          </span>
        </Link>
        <ul className="flex-1 w-full overflow-y-auto sidebar-scrollbar-dark px-2.5 py-2 space-y-1" role="tablist" aria-label="Sections" aria-orientation="vertical">
          {RAIL.map(r => {
            const Icon = r.icon;
            const on = r.id === selected;
            const here = r.id === activeId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSelected(r.id)}
                  title={r.title}
                  aria-label={r.title}
                  className={`relative w-full h-10 rounded grid place-items-center transition-colors ${on ? 'bg-primary-500/25 text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.07]'}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  {here && !on && <span className="absolute top-1.5 end-1.5 w-1.5 h-1.5 rounded-full bg-primary-300" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
        <NavLink to="/login" title="Sign out" aria-label="Sign out" className="h-12 w-full grid place-items-center text-white/55 hover:text-danger-400 border-t border-white/[0.06]">
          <LogOut size={16} />
        </NavLink>
      </div>

      {/* Secondary sidebar */}
      <div className={`flex-1 min-w-0 flex flex-col sidebar-pattern ${side === 'right' ? 'border-s' : 'border-e'} border-white/[0.06]`}>
        <div className="h-[65px] shrink-0 flex flex-col justify-center px-4 border-b border-white/[0.06]">
          <p className="text-[15px] font-extrabold truncate">{current.title}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-white/40">{flatten(current.items).length} pages</p>
        </div>
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar-dark px-3 py-3" role="tabpanel" aria-label={current.title}>
          <ul className="space-y-0.5 animate-fade-in" key={current.id}>{renderItems(current.items)}</ul>
        </nav>
      </div>
    </aside>
  );
}
