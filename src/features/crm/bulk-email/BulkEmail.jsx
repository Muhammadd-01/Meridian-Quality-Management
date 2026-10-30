import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send, Plus, Search, Users, Filter, SlidersHorizontal, ChevronDown, ChevronRight, ChevronLeft, ChevronsUpDown,
  ChevronUp, MoreVertical, MoreHorizontal, Move, X, ArrowRight, Repeat, Trash2, Pencil, Mail, UserMinus, Check,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import useSort from '../../../hooks/useSort';
import usePagination from '../../../hooks/usePagination';
import { generateId } from '../../../utils/format';
import {
  initialEmailGroups, initialEmailClients, GROUP_COLORS, EMAIL_TEMPLATES,
} from '../../../data/bulkEmailData';

const STATUSES = ['Active', 'Inactive', 'Unsubscribed'];
const STATUS_PILL = {
  Active: 'bg-success-50 text-success-600 ring-success/25',
  Inactive: 'bg-danger-50 text-danger-600 ring-danger/25',
  Unsubscribed: 'bg-gray-100 text-gray-600 ring-gray-300',
};

/** Tinted chip that reads in light and dark mode. */
const tint = (color, pct = 14) => ({ backgroundColor: `color-mix(in srgb, ${color} ${pct}%, transparent)` });

/** Popover that closes on outside click or Escape. */
function usePopover() {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (open === null) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return [open, setOpen, ref];
}

function GroupChip({ group }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-md text-[11.5px] font-semibold text-gray-800 whitespace-nowrap" style={tint(group.color)}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} aria-hidden="true" />
      {group.name}
    </span>
  );
}

/** Bulk-bar button with an upward dropdown of choices. */
function BulkMenu({ id, label, icon: Icon, heading, options, onPick, open, setOpen, menuRef, chevron = 'down', disabled }) {
  const isOpen = open === id;
  return (
    <div className="relative" ref={isOpen ? menuRef : undefined}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(isOpen ? null : id)}
        aria-expanded={isOpen}
        className="btn-outline btn-sm !bg-surface-raised !pr-2"
      >
        <Icon size={15} aria-hidden="true" /> {label}
        <span className="ml-1 pl-2 border-l border-[color:var(--border-subtle)]">
          {chevron === 'down' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {isOpen && (
        <div className="menu-panel absolute left-0 bottom-full mb-2 z-30 w-60 p-1.5" role="menu">
          {heading && <p className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-gray-500">{heading}</p>}
          {options.map(o => (
            <button key={o.value} type="button" role="menuitem" className={`menu-item ${o.danger ? '!text-danger hover:!bg-danger-50' : ''}`} onClick={() => { setOpen(null); onPick(o.value); }}>
              {o.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: o.color }} />}
              {o.icon && <o.icon size={14} />}
              <span className="flex-1 truncate">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BulkEmail() {
  const addToast = useToast();
  const [groups, setGroups] = useLocalStorage('meridian-bulk-email-groups', initialEmailGroups);
  const [clients, setClients] = useLocalStorage('meridian-bulk-email-clients', initialEmailClients);

  const [groupQuery, setGroupQuery] = useState('');
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [emailedFilter, setEmailedFilter] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  const [menu, setMenu, menuRef] = usePopover();

  const [groupModal, setGroupModal] = useState(null); // { mode: 'new' | 'edit', group? }
  const [groupForm, setGroupForm] = useState({ name: '', color: GROUP_COLORS[0], addSelected: true });
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(false);

  const [compose, setCompose] = useState(null); // { audience: 'selected' | groupId | 'all' }
  const [mail, setMail] = useState({ template: 'blank', subject: '', body: '', schedule: 'now', sendAt: '' });
  const [mailError, setMailError] = useState('');

  const [dragId, setDragId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  const groupById = useMemo(() => Object.fromEntries(groups.map(g => [g.id, g])), [groups]);
  const groupCounts = useMemo(() => {
    const counts = {};
    clients.forEach(c => c.groups.forEach(g => { counts[g] = (counts[g] || 0) + 1; }));
    return counts;
  }, [clients]);
  const companies = useMemo(() => [...new Set(clients.map(c => c.company))].sort(), [clients]);

  // ── Table data ──
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter(c => !q || `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q))
      .filter(c => groupFilter === 'all' || c.groups.includes(groupFilter))
      .filter(c => statusFilter === 'all' || c.status === statusFilter)
      .filter(c => companyFilter === 'all' || c.company === companyFilter)
      .filter(c => emailedFilter === 'all' || (emailedFilter === 'never' ? !c.lastEmailed : !!c.lastEmailed))
      .map(c => ({ ...c, groupLabel: c.groups.map(g => groupById[g]?.name).filter(Boolean).join(', ') }));
  }, [clients, query, groupFilter, statusFilter, companyFilter, emailedFilter, groupById]);

  const { sorted, sortKey, sortDir, toggleSort } = useSort(rows);
  const pager = usePagination(sorted, 10);
  const pageIds = pager.paginatedData.map(c => c.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const someOnPage = pageIds.some(id => selected.has(id));
  const headerCheckRef = useRef(null);
  useEffect(() => { if (headerCheckRef.current) headerCheckRef.current.indeterminate = someOnPage && !allOnPage; }, [someOnPage, allOnPage]);

  const moreFilterCount = (companyFilter !== 'all') + (emailedFilter !== 'all');

  const toggleRow = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const togglePage = () => setSelected(prev => {
    const next = new Set(prev);
    if (allOnPage) pageIds.forEach(id => next.delete(id)); else pageIds.forEach(id => next.add(id));
    return next;
  });
  const clearSelection = () => setSelected(new Set());

  const updateClients = (ids, fn) => setClients(prev => prev.map(c => (ids.has(c.id) ? fn(c) : c)));
  const selectedCount = selected.size;
  const plural = (n, word = 'client') => `${n} ${word}${n === 1 ? '' : 's'}`;

  // ── Bulk actions ──
  const addToGroup = (gid) => {
    updateClients(selected, c => (c.groups.includes(gid) ? c : { ...c, groups: [...c.groups, gid] }));
    addToast(`${plural(selectedCount)} added to ${groupById[gid].name}.`, 'success');
  };
  const moveToGroup = (gid) => {
    updateClients(selected, c => ({ ...c, groups: [gid] }));
    addToast(`${plural(selectedCount)} moved to ${groupById[gid].name}.`, 'success');
  };
  const replaceStatus = (status) => {
    updateClients(selected, c => ({ ...c, status }));
    addToast(`Status set to ${status} for ${plural(selectedCount)}.`, 'success');
  };
  const removeSelected = () => {
    if (groupFilter !== 'all') {
      updateClients(selected, c => ({ ...c, groups: c.groups.filter(g => g !== groupFilter) }));
      addToast(`${plural(selectedCount)} removed from ${groupById[groupFilter].name}.`, 'success');
    } else {
      setClients(prev => prev.filter(c => !selected.has(c.id)));
      addToast(`${plural(selectedCount)} removed from the mailing list.`, 'success');
    }
    clearSelection();
    setRemoveConfirm(false);
  };

  // ── Groups ──
  const openNewGroup = () => {
    setGroupForm({ name: '', color: GROUP_COLORS[groups.length % GROUP_COLORS.length], addSelected: selectedCount > 0 });
    setGroupModal({ mode: 'new' });
  };
  const openEditGroup = (group) => {
    setGroupForm({ name: group.name, color: group.color, addSelected: false });
    setGroupModal({ mode: 'edit', group });
    setMenu(null);
  };
  const saveGroup = (e) => {
    e.preventDefault();
    const name = groupForm.name.trim();
    if (!name) return;
    if (groupModal.mode === 'edit') {
      setGroups(prev => prev.map(g => (g.id === groupModal.group.id ? { ...g, name, color: groupForm.color } : g)));
      addToast('Group updated.', 'success');
    } else {
      const group = { id: `grp-${generateId()}`, name, color: groupForm.color };
      setGroups(prev => [...prev, group]);
      if (groupForm.addSelected && selectedCount) {
        updateClients(selected, c => ({ ...c, groups: [...c.groups, group.id] }));
      }
      addToast(`Group “${name}” created${groupForm.addSelected && selectedCount ? ` with ${plural(selectedCount)}` : ''}.`, 'success');
    }
    setGroupModal(null);
  };
  const confirmDeleteGroup = () => {
    const gid = deleteGroup.id;
    setGroups(prev => prev.filter(g => g.id !== gid));
    setClients(prev => prev.map(c => (c.groups.includes(gid) ? { ...c, groups: c.groups.filter(g => g !== gid) } : c)));
    if (groupFilter === gid) setGroupFilter('all');
    addToast(`Group “${deleteGroup.name}” deleted. Its clients were kept.`, 'success');
    setDeleteGroup(null);
  };

  // Drag-and-drop reordering of the group list.
  const reorder = (toIndex) => {
    if (!dragId) return;
    setGroups(prev => {
      const from = prev.findIndex(g => g.id === dragId);
      if (from === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(toIndex > from ? toIndex - 1 : toIndex, 0, moved);
      return next;
    });
    setDragId(null);
    setDropIndex(null);
  };
  const groupDropProps = (index) => ({
    onDragOver: (e) => {
      if (!dragId) return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const target = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
      if (target !== dropIndex) setDropIndex(target);
    },
    onDrop: (e) => { e.preventDefault(); reorder(dropIndex ?? index); },
  });

  // ── Compose ──
  const audienceClients = (audience) => {
    if (audience === 'selected') return clients.filter(c => selected.has(c.id));
    if (audience === 'all') return clients;
    return clients.filter(c => c.groups.includes(audience));
  };
  const openCompose = (audience) => {
    setMail({ template: 'blank', subject: '', body: '', schedule: 'now', sendAt: '' });
    setMailError('');
    setCompose({ audience });
    setMenu(null);
  };
  const recipients = compose ? audienceClients(compose.audience) : [];
  const deliverable = recipients.filter(c => c.status === 'Active');
  const skipped = recipients.length - deliverable.length;

  const applyTemplate = (id) => {
    const t = EMAIL_TEMPLATES.find(x => x.id === id);
    setMail(m => ({ ...m, template: id, subject: t.subject, body: t.body }));
  };
  const sendCampaign = (e) => {
    e.preventDefault();
    if (!deliverable.length) { setMailError('There are no active recipients in this audience.'); return; }
    if (!mail.subject.trim()) { setMailError('Subject is required.'); return; }
    if (!mail.body.trim()) { setMailError('Write a message or pick a template.'); return; }
    if (mail.schedule === 'later' && !mail.sendAt) { setMailError('Pick a date and time to schedule the campaign.'); return; }
    if (mail.schedule === 'now') {
      const ids = new Set(deliverable.map(c => c.id));
      const today = new Date().toISOString().slice(0, 10);
      updateClients(ids, c => ({ ...c, lastEmailed: today }));
    }
    addToast(
      `${mail.schedule === 'now' ? 'Campaign queued' : 'Campaign scheduled'} for ${plural(deliverable.length, 'recipient')}. Demo only — no email service is connected yet.`,
      'info',
      5500,
    );
    setCompose(null);
  };

  const groupList = groups.filter(g => g.name.toLowerCase().includes(groupQuery.trim().toLowerCase()));
  const canReorder = !groupQuery.trim();

  const SortHeader = ({ k, children }) => (
    <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 font-bold hover:text-gray-900">
      {children}
      {sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={13} className="opacity-50" />}
    </button>
  );

  const groupOptions = groups.map(g => ({ value: g.id, label: g.name, color: g.color }));

  return (
    <div data-no-reveal>
      <PageHeader
        title="Bulk Email Management"
        subtitle="Manage your client groups and send bulk emails with ease. Organise your contacts, create targeted campaigns, and keep your audience engaged."
        icon={Mail}
        actions={(
          <button type="button" className="btn-primary" onClick={() => openCompose(selectedCount ? 'selected' : 'all')}>
            <Send size={16} aria-hidden="true" /> New Campaign
          </button>
        )}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        {/* ── Client groups ────────────────────────────────────────── */}
        <section className="card p-5 hover:!shadow-sm" aria-labelledby="groups-title">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 id="groups-title" className="text-lg font-extrabold text-gray-900">Client Groups</h2>
            <button type="button" className="btn-primary btn-sm" onClick={openNewGroup}><Plus size={15} aria-hidden="true" /> New Group</button>
          </div>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" value={groupQuery} onChange={e => setGroupQuery(e.target.value)} placeholder="Search groups…" className="form-input !pl-9" aria-label="Search groups" />
          </div>

          <ul className="space-y-2.5" onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropIndex(null); }}>
            {groupList.length === 0 && <li className="text-sm text-gray-500 text-center py-6">No groups match “{groupQuery}”.</li>}
            {groupList.map((g, index) => {
              const active = groupFilter === g.id;
              return (
                <li key={g.id} className="relative" {...(canReorder ? groupDropProps(index) : {})}>
                  {dropIndex === index && dragId && <span className="absolute -top-[7px] left-2 right-2 h-0.5 rounded bg-[color:var(--focus-border)]" />}
                  <div
                    draggable={canReorder}
                    onDragStart={(e) => { setDragId(g.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', g.name); }}
                    onDragEnd={() => { setDragId(null); setDropIndex(null); }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={active}
                    onClick={() => { setGroupFilter(active ? 'all' : g.id); clearSelection(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setGroupFilter(active ? 'all' : g.id); clearSelection(); } }}
                    className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-lg border cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-border)] ${
                      dragId === g.id ? 'opacity-50 border-dashed border-[color:var(--focus-border)]' : ''
                    } ${active ? 'bg-primary-50 border-[color:var(--hover-border)] shadow-sm' : 'border-[color:var(--border-subtle)] hover:bg-gray-50 hover:border-[color:var(--border-default)]'}`}
                  >
                    {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[color:var(--focus-border)]" aria-hidden="true" />}
                    <span className="w-5 h-5 rounded-full shrink-0 ring-4" style={{ backgroundColor: g.color, '--tw-ring-color': `color-mix(in srgb, ${g.color} 18%, transparent)` }} aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-semibold text-gray-900 truncate">{g.name}</span>
                      <span className="block text-xs text-gray-500">{plural(groupCounts[g.id] || 0)}</span>
                    </span>
                    {canReorder && <Move size={15} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" aria-hidden="true" />}
                    <div className="relative" ref={menu === `g:${g.id}` ? menuRef : undefined}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenu(menu === `g:${g.id}` ? null : `g:${g.id}`); }}
                        className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        aria-label={`Options for ${g.name}`}
                        aria-expanded={menu === `g:${g.id}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menu === `g:${g.id}` && (
                        <div className="menu-panel absolute right-0 top-8 z-30 w-48 p-1.5" role="menu" onClick={e => e.stopPropagation()}>
                          <button type="button" role="menuitem" className="menu-item" onClick={() => openCompose(g.id)}><Send size={14} /> Email this group</button>
                          <button type="button" role="menuitem" className="menu-item" onClick={() => openEditGroup(g)}><Pencil size={14} /> Edit group</button>
                          <button type="button" role="menuitem" className="menu-item !text-danger hover:!bg-danger-50" onClick={() => { setDeleteGroup(g); setMenu(null); }}><Trash2 size={14} /> Delete group</button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            {...(canReorder ? {
              onDragOver: (e) => { if (dragId) { e.preventDefault(); setDropIndex(groups.length); } },
              onDrop: (e) => { e.preventDefault(); reorder(groups.length); },
            } : {})}
            className={`mt-5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragId && dropIndex === groups.length ? 'border-[color:var(--focus-border)] bg-primary-50' : 'border-[color:var(--border-default)]'
            }`}
          >
            <p className="flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-600"><Move size={15} aria-hidden="true" /> Drag and drop groups to reorder</p>
            <p className="text-xs text-gray-500 mt-1">You can also create new groups to organise your clients.</p>
          </div>
        </section>

        {/* ── All clients ──────────────────────────────────────────── */}
        <section className="card p-5 min-w-0 hover:!shadow-sm" aria-labelledby="clients-title">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 id="clients-title" className="text-lg font-extrabold text-gray-900">
              {groupFilter === 'all' ? 'All Clients' : groupById[groupFilter]?.name}
            </h2>
            <span className="text-[13px] text-gray-500">{plural(rows.length)}</span>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients by name or email…" className="form-input !pl-9" aria-label="Search clients" />
            </div>
            <label className="relative">
              <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select value={groupFilter} onChange={e => { setGroupFilter(e.target.value); clearSelection(); }} className="form-select !pl-9 min-w-[150px] text-sm" aria-label="Filter by group">
                <option value="all">All Groups</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label className="relative">
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select !pl-9 min-w-[120px] text-sm" aria-label="Filter by status">
                <option value="all">Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="relative" ref={menu === 'filters' ? menuRef : undefined}>
              <button type="button" onClick={() => setMenu(menu === 'filters' ? null : 'filters')} aria-expanded={menu === 'filters'} className="btn-outline h-full">
                <SlidersHorizontal size={15} aria-hidden="true" /> More Filters
                {moreFilterCount > 0 && <span className="grid place-items-center w-5 h-5 rounded-full bg-primary text-primary-ink text-[10px] font-bold">{moreFilterCount}</span>}
              </button>
              {menu === 'filters' && (
                <div className="menu-panel absolute right-0 top-full mt-2 z-30 w-72 p-4 space-y-3">
                  <div>
                    <label htmlFor="flt-company" className="form-label">Company</label>
                    <select id="flt-company" className="form-select text-sm" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
                      <option value="all">All companies</option>
                      {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="flt-emailed" className="form-label">Last emailed</label>
                    <select id="flt-emailed" className="form-select text-sm" value={emailedFilter} onChange={e => setEmailedFilter(e.target.value)}>
                      <option value="all">Any time</option>
                      <option value="emailed">Emailed before</option>
                      <option value="never">Never emailed</option>
                    </select>
                  </div>
                  <div className="flex justify-between pt-1">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => { setCompanyFilter('all'); setEmailedFilter('all'); setStatusFilter('all'); setQuery(''); }}>Reset all</button>
                    <button type="button" className="btn-primary btn-sm" onClick={() => setMenu(null)}>Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="table-container overflow-x-auto rounded-lg border border-[color:var(--border-subtle)]">
            <table className="w-full text-[13px] min-w-[720px]">
              <thead className="bg-gray-50 text-gray-600 text-left text-xs">
                <tr>
                  <th className="w-10 px-2.5 py-3">
                    <input ref={headerCheckRef} type="checkbox" checked={allOnPage} onChange={togglePage} className="w-4 h-4 rounded accent-[#145D68] align-middle" aria-label="Select all clients on this page" />
                  </th>
                  <th className="px-2.5 py-3"><SortHeader k="name">Client Name</SortHeader></th>
                  <th className="px-2.5 py-3"><SortHeader k="email">Email Address</SortHeader></th>
                  <th className="px-2.5 py-3"><SortHeader k="groupLabel">Group</SortHeader></th>
                  <th className="px-2.5 py-3"><SortHeader k="status">Status</SortHeader></th>
                  <th className="px-2.5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pager.paginatedData.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">No clients match these filters.</td></tr>
                )}
                {pager.paginatedData.map(c => {
                  const isSel = selected.has(c.id);
                  const cGroups = c.groups.map(g => groupById[g]).filter(Boolean);
                  return (
                    <tr key={c.id} className={`border-t border-[color:var(--border-subtle)] transition-colors ${isSel ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-2.5 py-3">
                        <input type="checkbox" checked={isSel} onChange={() => toggleRow(c.id)} className="w-4 h-4 rounded accent-[#145D68] align-middle" aria-label={`Select ${c.name}`} />
                      </td>
                      <td className="px-2.5 py-3">
                        <p className="font-semibold text-gray-900 whitespace-nowrap">{c.name}</p>
                        <p className="text-[11.5px] text-gray-500 whitespace-nowrap">{c.company}</p>
                      </td>
                      <td className="px-2.5 py-3 text-[12.5px] text-gray-600 whitespace-nowrap">{c.email}</td>
                      <td className="px-2.5 py-3">
                        <span className="flex items-center gap-1.5">
                          {cGroups[0] ? <GroupChip group={cGroups[0]} /> : <span className="text-gray-400">—</span>}
                          {cGroups.length > 1 && (
                            <span className="text-[11px] font-bold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100" title={cGroups.slice(1).map(g => g.name).join(', ')}>+{cGroups.length - 1}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-2.5 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold ring-1 ring-inset ${STATUS_PILL[c.status]}`}>{c.status}</span>
                      </td>
                      <td className="px-2.5 py-3 text-right">
                        <div className="relative inline-block" ref={menu === `c:${c.id}` ? menuRef : undefined}>
                          <button type="button" onClick={() => setMenu(menu === `c:${c.id}` ? null : `c:${c.id}`)} className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100" aria-label={`Actions for ${c.name}`} aria-expanded={menu === `c:${c.id}`}>
                            <MoreHorizontal size={16} />
                          </button>
                          {menu === `c:${c.id}` && (
                            <div className="menu-panel absolute right-0 top-8 z-30 w-48 p-1.5 text-left" role="menu">
                              <button type="button" role="menuitem" className="menu-item" onClick={() => { setSelected(new Set([c.id])); openCompose('selected'); }}><Mail size={14} /> Email client</button>
                              <button
                                type="button"
                                role="menuitem"
                                className="menu-item"
                                onClick={() => {
                                  const status = c.status === 'Active' ? 'Inactive' : 'Active';
                                  updateClients(new Set([c.id]), x => ({ ...x, status }));
                                  setMenu(null);
                                  addToast(`${c.name} marked ${status}.`, 'success');
                                }}
                              >
                                <Repeat size={14} /> Mark {c.status === 'Active' ? 'inactive' : 'active'}
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="menu-item !text-danger hover:!bg-danger-50"
                                onClick={() => {
                                  setClients(prev => prev.filter(x => x.id !== c.id));
                                  setSelected(prev => { const n = new Set(prev); n.delete(c.id); return n; });
                                  setMenu(null);
                                  addToast(`${c.name} removed from the mailing list.`, 'success');
                                }}
                              >
                                <UserMinus size={14} /> Remove client
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-[13px] text-gray-600 flex items-center gap-2 min-h-[28px]">
              {selectedCount > 0 ? (
                <>
                  <span className="font-semibold">{plural(selectedCount)} selected</span>
                  <button type="button" onClick={clearSelection} className="p-0.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100" aria-label="Clear selection"><X size={15} /></button>
                </>
              ) : (
                <span className="text-gray-500">Showing {pager.startIndex}–{pager.endIndex} of {pager.totalItems}</span>
              )}
            </p>
            {pager.totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center gap-1.5">
                <button type="button" onClick={() => pager.goToPage(pager.currentPage - 1)} disabled={pager.currentPage === 1} className="w-8 h-8 grid place-items-center rounded-md border border-[color:var(--border-subtle)] text-gray-600 hover:bg-gray-50 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button>
                {Array.from({ length: pager.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => pager.goToPage(p)}
                    aria-current={p === pager.currentPage ? 'page' : undefined}
                    className={`w-8 h-8 rounded-md text-[13px] font-semibold transition-colors ${p === pager.currentPage ? 'bg-primary text-primary-ink shadow-glow-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                ))}
                <button type="button" onClick={() => pager.goToPage(pager.currentPage + 1)} disabled={pager.currentPage === pager.totalPages} className="w-8 h-8 grid place-items-center rounded-md border border-[color:var(--border-subtle)] text-gray-600 hover:bg-gray-50 disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button>
              </nav>
            )}
          </div>

          {selectedCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5 p-3 rounded-lg bg-primary-50 border border-[color:var(--hover-border)] animate-slide-up">
              <BulkMenu id="b:group" label="Group" icon={Users} heading="Add to group" options={groupOptions} onPick={addToGroup} open={menu} setOpen={setMenu} menuRef={menuRef} />
              <BulkMenu id="b:move" label="Move" icon={ArrowRight} heading="Move to group (replaces groups)" options={groupOptions} onPick={moveToGroup} open={menu} setOpen={setMenu} menuRef={menuRef} />
              <BulkMenu
                id="b:replace"
                label="Replace"
                icon={Repeat}
                heading="Replace status with"
                options={STATUSES.map(s => ({ value: s, label: s, icon: s === 'Active' ? Check : X }))}
                onPick={replaceStatus}
                open={menu}
                setOpen={setMenu}
                menuRef={menuRef}
              />
              <button type="button" onClick={() => setRemoveConfirm(true)} className="btn-outline btn-sm !bg-surface-raised !text-danger !border-danger/30 hover:!bg-danger-50">
                <Trash2 size={15} aria-hidden="true" /> Remove <ChevronRight size={14} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => openCompose('selected')} className="btn-primary btn-sm sm:ml-1">
                <Send size={15} aria-hidden="true" /> Compose Email
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ── Group modal ── */}
      <Modal
        isOpen={!!groupModal}
        onClose={() => setGroupModal(null)}
        title={groupModal?.mode === 'edit' ? 'Edit Group' : 'New Group'}
        size="sm"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setGroupModal(null)}>Cancel</button>
            <button type="submit" form="group-form" className="btn-primary" disabled={!groupForm.name.trim()}>{groupModal?.mode === 'edit' ? 'Save Changes' : 'Create Group'}</button>
          </>
        )}
      >
        <form id="group-form" onSubmit={saveGroup} className="space-y-4">
          <div>
            <label htmlFor="grp-name" className="form-label">Group name *</label>
            <input id="grp-name" className="form-input" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pharma Accounts" />
          </div>
          <div>
            <span className="form-label">Colour</span>
            <div className="flex flex-wrap gap-2.5">
              {GROUP_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setGroupForm(f => ({ ...f, color }))}
                  aria-label={`Colour ${color}`}
                  aria-pressed={groupForm.color === color}
                  className={`w-8 h-8 rounded-full grid place-items-center transition-transform hover:scale-110 ${groupForm.color === color ? 'ring-2 ring-offset-2 ring-[color:var(--focus-border)] ring-offset-[color:var(--surface-raised)]' : ''}`}
                  style={{ backgroundColor: color }}
                >
                  {groupForm.color === color && <Check size={15} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
          {groupModal?.mode === 'new' && selectedCount > 0 && (
            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-[#145D68]" checked={groupForm.addSelected} onChange={e => setGroupForm(f => ({ ...f, addSelected: e.target.checked }))} />
              Add the {plural(selectedCount)} selected to this group
            </label>
          )}
        </form>
      </Modal>

      {/* ── Compose modal ── */}
      <Modal
        isOpen={!!compose}
        onClose={() => setCompose(null)}
        title="Compose Campaign"
        size="lg"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setCompose(null)}>Cancel</button>
            <button type="submit" form="compose-form" className="btn-primary">
              <Send size={15} aria-hidden="true" /> {mail.schedule === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
            </button>
          </>
        )}
      >
        {compose && (
          <form id="compose-form" onSubmit={sendCampaign} className="space-y-4" noValidate>
            {mailError && <p className="form-error" role="alert">{mailError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="mail-audience" className="form-label">Send to</label>
                <select id="mail-audience" className="form-select" value={compose.audience} onChange={e => setCompose({ audience: e.target.value })}>
                  {selectedCount > 0 && <option value="selected">Selected clients ({selectedCount})</option>}
                  <option value="all">All clients ({clients.length})</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({groupCounts[g.id] || 0})</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="mail-template" className="form-label">Template</label>
                <select id="mail-template" className="form-select" value={mail.template} onChange={e => applyTemplate(e.target.value)}>
                  {EMAIL_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-[color:var(--border-subtle)] bg-gray-50 p-3">
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-bold text-gray-900">{plural(deliverable.length, 'recipient')}</span>
                {skipped > 0 && <> · {skipped} inactive or unsubscribed will be skipped</>}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {deliverable.slice(0, 8).map(c => (
                  <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-surface-raised border border-[color:var(--border-subtle)] text-gray-700">{c.name}</span>
                ))}
                {deliverable.length > 8 && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-bold bg-primary-100 text-brand-strong">+{deliverable.length - 8} more</span>}
              </div>
            </div>

            <div>
              <label htmlFor="mail-subject" className="form-label">Subject *</label>
              <input id="mail-subject" className="form-input" value={mail.subject} onChange={e => setMail(m => ({ ...m, subject: e.target.value }))} placeholder="e.g. Your November quality update" />
            </div>
            <div>
              <label htmlFor="mail-body" className="form-label">Message *</label>
              <textarea id="mail-body" rows={7} className="form-input font-[inherit]" value={mail.body} onChange={e => setMail(m => ({ ...m, body: e.target.value }))} placeholder="Write your message…" />
              <p className="text-[11.5px] text-gray-500 mt-1.5">Personalise with <code className="px-1 rounded bg-gray-100">{'{{first_name}}'}</code> and <code className="px-1 rounded bg-gray-100">{'{{company}}'}</code>.</p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <fieldset className="flex items-center gap-4 text-sm text-gray-700">
                <legend className="form-label">Delivery</legend>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="schedule" className="accent-[#145D68]" checked={mail.schedule === 'now'} onChange={() => setMail(m => ({ ...m, schedule: 'now' }))} /> Send now</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="schedule" className="accent-[#145D68]" checked={mail.schedule === 'later'} onChange={() => setMail(m => ({ ...m, schedule: 'later' }))} /> Schedule</label>
              </fieldset>
              {mail.schedule === 'later' && (
                <input type="datetime-local" className="form-input !w-auto" value={mail.sendAt} onChange={e => setMail(m => ({ ...m, sendAt: e.target.value }))} aria-label="Send at" />
              )}
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteGroup}
        onClose={() => setDeleteGroup(null)}
        onConfirm={confirmDeleteGroup}
        title="Delete group"
        message={`Delete “${deleteGroup?.name}”? Clients in this group stay on the mailing list.`}
      />
      <ConfirmDialog
        isOpen={removeConfirm}
        onClose={() => setRemoveConfirm(false)}
        onConfirm={removeSelected}
        title={groupFilter === 'all' ? 'Remove clients' : 'Remove from group'}
        confirmLabel="Remove"
        message={groupFilter === 'all'
          ? `Remove ${plural(selectedCount)} from the mailing list?`
          : `Remove ${plural(selectedCount)} from ${groupById[groupFilter]?.name}? They stay on the mailing list.`}
      />
    </div>
  );
}
