import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LayoutGrid, PanelsTopLeft, Boxes, FileBarChart, Component, FileStack } from 'lucide-react';
import { mainGroups, moduleSections } from '../../app/navigation';

const flatten = (items) => items.flatMap(i => (i.children ? flatten(i.children) : [i]));
const section = (id) => moduleSections.find(s => s.id === id);
const OTHER = ['management', 'reports', 'workspace', 'ui', 'pages', 'support'];

/** Top-level menus for the horizontal and stacked layouts. `groups` = mega menu columns. */
export const HORIZONTAL_MENUS = [
  { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard, groups: [{ title: 'Dashboards', items: mainGroups[0].children }], cols: 3 },
  { id: 'apps', label: 'Applications', icon: LayoutGrid, groups: [{ title: 'Applications', items: mainGroups[1].children }], cols: 2 },
  { id: 'layouts', label: 'Layouts', icon: PanelsTopLeft, groups: [{ title: 'Layouts', items: mainGroups[2].children }], cols: 2 },
  {
    id: 'modules', label: 'Modules', icon: Boxes, mega: true,
    groups: moduleSections.filter(s => !OTHER.includes(s.id)).map(s => ({ title: s.title, items: flatten(s.items) })),
  },
  { id: 'reports', label: 'Reports', icon: FileBarChart, mega: true, groups: section('reports').items.map(i => (i.children ? { title: i.label, items: i.children } : null)).filter(Boolean).concat([{ title: 'Tools', items: section('reports').items.filter(i => !i.children) }]) },
  { id: 'ui', label: 'UI Elements', icon: Component, mega: true, groups: section('ui').items.map(i => (i.children ? { title: i.label, items: i.children } : { title: i.label, items: [i] })) },
  {
    id: 'pages', label: 'Pages', icon: FileStack, mega: true,
    groups: [
      { title: 'Management', items: flatten(section('management').items) },
      { title: 'Workspace', items: flatten(section('workspace').items) },
      ...section('pages').items.map(i => ({ title: i.label, items: i.children || [i] })),
      { title: 'Support', items: flatten(section('support').items) },
    ],
  },
];

const contains = (menu, path) => menu.groups.some(g => g.items.some(i => i.path === path));

/**
 * Navigation bar used by the horizontal-menu (light row) and stacked-header
 * (dark row) layouts. Large screens only — smaller screens use the drawer.
 */
export default function HorizontalNav({ variant = 'light' }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  const dark = variant === 'stacked';

  useEffect(() => { setOpen(null); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const bar = dark
    ? 'sidebar-pattern border-b border-white/[0.06]'
    : 'bg-surface-base border-b border-gray-200';

  return (
    <nav ref={ref} aria-label="Primary navigation" className={`hidden lg:block relative z-20 shrink-0 ${bar}`}>
      <ul className="flex items-center gap-1 px-4 lg:px-6 h-12">
        {HORIZONTAL_MENUS.map(menu => {
          const active = contains(menu, pathname);
          const isOpen = open === menu.id;
          const Icon = menu.icon;
          const btn = dark
            ? `${active || isOpen ? 'bg-white/10 text-white' : 'text-[color:var(--sidebar-text)] hover:text-white hover:bg-white/[0.06]'}`
            : `${active ? 'text-primary-700 bg-primary-50' : isOpen ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`;
          const cols = menu.mega ? 'grid-cols-3 xl:grid-cols-5' : menu.cols === 3 ? 'grid-cols-3' : 'grid-cols-2';
          return (
            <li key={menu.id} className={menu.mega ? '' : 'relative'}>
              <button
                type="button"
                onClick={() => setOpen(o => (o === menu.id ? null : menu.id))}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 h-9 px-3 rounded text-[13px] font-semibold transition-colors ${btn}`}
              >
                <Icon size={15} aria-hidden="true" className={dark && active ? 'text-primary-300' : ''} />
                {menu.label}
                <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {isOpen && (
                <div
                  className={`menu-panel absolute top-full mt-1 z-50 p-3 max-h-[70vh] overflow-y-auto ${menu.mega ? 'inset-x-4 lg:inset-x-6' : 'start-0 w-[min(560px,calc(100vw-2rem))]'}`}
                  style={{ transformOrigin: 'top' }}
                >
                  <div className={menu.mega ? `grid ${cols} gap-x-4 gap-y-4` : ''}>
                    {menu.groups.map(g => (
                      <div key={g.title} className="min-w-0">
                        {(menu.mega || menu.groups.length > 1) && <p className="px-2 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-gray-400 truncate">{g.title}</p>}
                        <ul className={menu.mega ? 'space-y-0.5' : `grid ${cols} gap-0.5`}>
                          {g.items.map(item => {
                            const ItemIcon = item.icon;
                            const here = item.path === pathname;
                            return (
                              <li key={item.path}>
                                <Link to={item.path} className={`menu-item !py-1.5 ${here ? 'is-active' : ''}`} aria-current={here ? 'page' : undefined}>
                                  {ItemIcon && <ItemIcon size={14} className="shrink-0" aria-hidden="true" />}
                                  <span className="truncate">{item.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
