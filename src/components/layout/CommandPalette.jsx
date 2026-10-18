import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, FileText, Zap, Database } from 'lucide-react';
import { allPages, quickActions } from '../../app/navigation';
import { ENTITY_LIST, recordTitle } from '../../data/entities';
import { getStorageItem } from '../../lib/storage';

const MAX_PER_GROUP = 5;

function matches(text, q) {
  return text && String(text).toLowerCase().includes(q);
}

/**
 * Global command palette (Ctrl/⌘+K). Searches pages, quick actions and the
 * records stored in this browser for every registered entity type. There is no
 * server-side index — results reflect exactly what the app currently holds.
 */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const returnFocusRef = useRef(null);
  const [collections, setCollections] = useState([]);

  // Snapshot collections each time the palette opens so results are current.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    setQuery('');
    setActive(0);
    setCollections(ENTITY_LIST.map(entity => {
      const records = getStorageItem(entity.key, entity.seed);
      return { entity, records: Array.isArray(records) ? records : [] };
    }));
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      const el = returnFocusRef.current;
      if (el && typeof el.focus === 'function') el.focus();
    };
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = [];
    const pages = allPages
      .filter(p => !q || matches(p.label, q) || matches(p.group, q))
      .slice(0, q ? MAX_PER_GROUP : 8)
      .map(p => ({ id: `page:${p.path}`, label: p.label, hint: p.group, icon: p.icon || FileText, to: p.path }));
    if (pages.length) result.push({ title: 'Pages', items: pages });

    const actions = quickActions
      .filter(a => !q || matches(a.label, q))
      .slice(0, q ? MAX_PER_GROUP : 4)
      .map(a => ({ id: `action:${a.id}`, label: a.label, hint: 'Quick action', icon: a.icon || Zap, to: a.path }));
    if (actions.length) result.push({ title: 'Quick actions', items: actions });

    if (q.length >= 2) {
      collections.forEach(({ entity, records }) => {
        const hits = records
          .filter(r => r && entity.searchFields.some(f => matches(r[f], q)))
          .slice(0, MAX_PER_GROUP)
          .map(r => {
            const title = recordTitle(entity, r);
            let subtitle = '';
            try { subtitle = entity.subtitle?.(r) || ''; } catch { subtitle = ''; }
            return {
              id: `${entity.type}:${r.id}`,
              label: title,
              hint: subtitle,
              icon: Database,
              to: `${entity.path}?q=${encodeURIComponent(title)}`,
            };
          });
        if (hits.length) result.push({ title: entity.label, items: hits });
      });
    }
    return result;
  }, [query, collections]);

  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (item) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(flat[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      // Keep focus inside the dialog; the input is the only tab stop.
      e.preventDefault();
    }
  };

  let index = -1;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]">
      <div className="fixed inset-0 bg-black/40 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="relative w-full max-w-xl bg-white rounded-xl shadow-modal border border-gray-200 overflow-hidden animate-scale-in"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-100">
          <Search size={17} className="text-gray-500 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions, customers, deals, tasks, courses…"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={flat[active] ? `cmd-${active}` : undefined}
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-semibold text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div ref={listRef} id="command-palette-list" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-gray-900">No results for “{query}”</p>
              <p className="text-xs text-gray-500 mt-1">Try a company, lead, deal, task, course or page name.</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.title} className="mb-1.5" role="group" aria-label={group.title}>
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">{group.title}</p>
                {group.items.map(item => {
                  index += 1;
                  const i = index;
                  const Icon = item.icon;
                  const isActive = i === active;
                  return (
                    <button
                      key={item.id}
                      id={`cmd-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      tabIndex={-1}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`grid place-items-center w-7 h-7 rounded-lg shrink-0 ${isActive ? 'bg-primary/15' : 'bg-gray-100'}`}>
                        <Icon size={14} aria-hidden="true" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium truncate">{item.label}</span>
                        {item.hint && <span className="block text-[11px] text-gray-500 truncate">{item.hint}</span>}
                      </span>
                      {isActive && <CornerDownLeft size={13} className="shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500">
          <span className="flex items-center gap-2">
            <ArrowUp size={12} aria-hidden="true" /><ArrowDown size={12} aria-hidden="true" /> navigate
            <CornerDownLeft size={12} className="ml-2" aria-hidden="true" /> open
          </span>
          <span className="truncate">Searches records stored in this browser</span>
        </div>
      </div>
    </div>
  );
}
