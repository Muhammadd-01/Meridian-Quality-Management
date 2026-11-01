import React, { useMemo, useState } from 'react';
import {
  addDays, differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, parseISO, setHours, setMinutes,
} from 'date-fns';
import {
  Plus, Phone, Mail, Users, MessageCircle, AlarmClock, CalendarClock, CheckCircle2, Flame, Search, Clock, Trash2, CornerUpRight, Check,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import useCollection from '../../hooks/useCollection';
import useQuickAction from '../../hooks/useQuickAction';
import { generateId } from '../../utils/format';
import { MemberAvatar, ProgressRing, MiniStat, usePopover, useTeamMembers } from './teamUi';

const CHANNELS = {
  Call: { icon: Phone, cls: 'bg-teal-800 text-primrose' },
  Email: { icon: Mail, cls: 'bg-teal-500 text-white' },
  Meeting: { icon: Users, cls: 'bg-primrose text-primary-ink' },
  WhatsApp: { icon: MessageCircle, cls: 'bg-success-500 text-white' },
};
const PRIORITY = { High: '#B83A2C', Medium: '#F78D00', Low: '#1C7D86' };

const COLUMNS = [
  { id: 'overdue', label: 'Overdue', icon: Flame, accent: 'bg-danger-500', soft: 'bg-danger-50' },
  { id: 'today', label: 'Due today', icon: AlarmClock, accent: 'bg-accent', soft: 'bg-accent-50' },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock, accent: 'bg-teal-500', soft: 'bg-info-50' },
  { id: 'done', label: 'Completed', icon: CheckCircle2, accent: 'bg-success-500', soft: 'bg-success-50' },
];

const bucketOf = (f, now) => {
  if (f.status === 'Done') return 'done';
  const due = parseISO(f.due);
  if (isToday(due)) return 'today';
  return due < now ? 'overdue' : 'upcoming';
};

const dueLabel = (f, now) => {
  const due = parseISO(f.due);
  const days = differenceInCalendarDays(due, now);
  if (f.status === 'Done') return `Done · was due ${format(due, 'd MMM')}`;
  if (isToday(due)) return `${due < now ? 'Was due' : 'Due'} ${format(due, 'h:mm a')}`;
  if (days < 0) return `${formatDistanceToNowStrict(due)} overdue`;
  if (days === 1) return `Tomorrow · ${format(due, 'h:mm a')}`;
  return `${format(due, 'EEE d MMM')} · ${format(due, 'h:mm a')}`;
};

const emptyForm = (owner) => ({
  title: '', contact: '', company: '', channel: 'Call', owner, date: format(new Date(), 'yyyy-MM-dd'), time: '11:00', priority: 'Medium', notes: '',
});

export default function FollowUps() {
  const addToast = useToast();
  const { members, me } = useTeamMembers();
  const [items, setItems] = useCollection('followUps');
  const [owner, setOwner] = useState('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm(me));
  const [completing, setCompleting] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [menu, setMenu, menuRef] = usePopover();
  const now = new Date();

  const openNew = () => { setForm(emptyForm(me)); setModal('new'); };
  useQuickAction('new', openNew);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(f => owner === 'all' || f.owner === owner)
      .filter(f => !q || `${f.title} ${f.contact} ${f.company}`.toLowerCase().includes(q))
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [items, owner, query]);

  const byCol = Object.fromEntries(COLUMNS.map(c => [c.id, []]));
  visible.forEach(f => byCol[bucketOf(f, now)].push(f));
  byCol.done.reverse();

  const total = items.length;
  const doneCount = items.filter(f => f.status === 'Done').length;
  const owners = [...new Set(items.map(f => f.owner))];

  const update = (id, patch) => setItems(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));

  const snooze = (f, days) => {
    const next = addDays(parseISO(f.due) < now ? now : parseISO(f.due), days);
    update(f.id, { due: setMinutes(setHours(next, parseISO(f.due).getHours()), parseISO(f.due).getMinutes()).toISOString() });
    setMenu(null);
    addToast(`Snoozed to ${format(next, 'EEE d MMM')}.`, 'info');
  };
  const reassign = (f, name) => {
    update(f.id, { owner: name });
    setMenu(null);
    addToast(`Follow-up handed over to ${name}.`, 'success');
  };
  const remove = (f) => {
    setItems(prev => prev.filter(x => x.id !== f.id));
    setMenu(null);
    addToast('Follow-up deleted.', 'success');
  };
  const confirmDone = () => {
    update(completing.id, { status: 'Done', outcome: outcome.trim() || 'Completed' });
    addToast('Nice work — follow-up completed! 🎉', 'success');
    setCompleting(null);
    setOutcome('');
  };

  const dropTo = (col) => {
    const f = items.find(x => x.id === dragId);
    setDragId(null);
    setOverCol(null);
    if (!f || bucketOf(f, now) === col) return;
    if (col === 'done') { setCompleting(f); return; }
    const due = parseISO(f.due);
    const base = col === 'today' ? now : col === 'upcoming' ? addDays(now, 1) : addDays(now, -1);
    const next = setMinutes(setHours(base, due.getHours()), due.getMinutes());
    update(f.id, { status: 'Open', due: next.toISOString() });
    addToast(`Moved to ${COLUMNS.find(c => c.id === col).label.toLowerCase()}.`, 'info');
  };

  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.contact.trim()) return;
    const due = new Date(`${form.date}T${form.time || '09:00'}`).toISOString();
    setItems(prev => [...prev, {
      id: `fu-${generateId()}`, title: form.title.trim(), contact: form.contact.trim(), company: form.company.trim(), channel: form.channel,
      owner: form.owner, due, priority: form.priority, status: 'Open', outcome: '', notes: form.notes.trim(),
    }]);
    setModal(null);
    addToast(`Follow-up assigned to ${form.owner}.`, 'success');
  };

  return (
    <div>
      <PageHeader
        title="Team Follow-ups"
        subtitle="Never drop a client conversation — every follow-up has an owner, a due time and an outcome."
        actions={<button type="button" className="btn-primary" onClick={openNew}><Plus size={16} /> New Follow-up</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat icon={Flame} label="Overdue" value={items.filter(f => bucketOf(f, now) === 'overdue').length} hint="Needs attention" tone="red" />
        <MiniStat icon={AlarmClock} label="Due today" value={items.filter(f => bucketOf(f, now) === 'today').length} hint={format(now, 'EEEE')} tone="orange" />
        <MiniStat icon={CalendarClock} label="Upcoming" value={items.filter(f => bucketOf(f, now) === 'upcoming').length} hint="Scheduled ahead" tone="bright" />
        <div className="card p-4 flex items-center gap-3.5">
          <ProgressRing value={total ? (doneCount / total) * 100 : 0} size={52} stroke={6} color="#1E8C55">
            <span className="text-[11px] font-extrabold text-gray-900">{total ? Math.round((doneCount / total) * 100) : 0}%</span>
          </ProgressRing>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Completion</p>
            <p className="text-xl font-extrabold text-gray-900 leading-tight">{doneCount}/{total}</p>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative lg:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="search" className="form-input !pl-9" placeholder="Search follow-ups…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search follow-ups" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by owner">
          <button type="button" onClick={() => setOwner('all')} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${owner === 'all' ? 'bg-teal-800 text-primrose' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Everyone</button>
          {owners.map(o => (
            <button key={o} type="button" onClick={() => setOwner(owner === o ? 'all' : o)} aria-pressed={owner === o} className={`shrink-0 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-xs font-semibold transition-colors ${owner === o ? 'bg-primary text-primary-ink ring-2 ring-primary-500/50' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <MemberAvatar name={o} size="xs" /> {o.split(' ').slice(-1)[0]}
              <span className="opacity-60">{items.filter(f => f.owner === o && f.status !== 'Done').length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => (
          <section
            key={col.id}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverCol(col.id); } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null); }}
            onDrop={(e) => { e.preventDefault(); dropTo(col.id); }}
            className={`rounded-2xl p-3 border transition-colors min-h-[200px] ${overCol === col.id ? 'border-[color:var(--focus-border)] bg-primary-50' : 'border-[color:var(--border-subtle)] bg-surface-sunken'}`}
            aria-label={col.label}
          >
            <header className="flex items-center gap-2 px-1 mb-3">
              <span className={`w-7 h-7 rounded-lg grid place-items-center text-white ${col.accent}`}><col.icon size={15} /></span>
              <h2 className="text-sm font-bold text-gray-900 flex-1">{col.label}</h2>
              <span className="text-xs font-bold text-gray-500 bg-surface-raised rounded-full px-2 py-0.5">{byCol[col.id].length}</span>
            </header>
            <div className="space-y-3">
              {byCol[col.id].length === 0 && <p className="text-xs text-gray-500 text-center py-8 border-2 border-dashed border-[color:var(--border-subtle)] rounded-xl">Drop follow-ups here</p>}
              {byCol[col.id].map(f => {
                const Ch = CHANNELS[f.channel] || CHANNELS.Call;
                const done = f.status === 'Done';
                return (
                  <article
                    key={f.id}
                    draggable
                    onDragStart={(e) => { setDragId(f.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', f.title); }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    className={`relative card p-3.5 pl-4 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 ${dragId === f.id ? 'opacity-50' : ''}`}
                  >
                    <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r" style={{ backgroundColor: PRIORITY[f.priority] }} aria-hidden="true" />
                    <div className="flex items-start gap-2.5">
                      <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${Ch.cls}`} title={f.channel}><Ch.icon size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13.5px] font-semibold leading-snug ${done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{f.title}</p>
                        <p className="text-xs text-gray-500 truncate">{f.contact} · {f.company}</p>
                      </div>
                    </div>
                    {done && f.outcome && <p className="mt-2.5 text-xs text-success-600 bg-success-50 rounded-md px-2 py-1.5">✓ {f.outcome}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-[11.5px] font-semibold flex items-center gap-1 flex-1 min-w-0 truncate ${col.id === 'overdue' ? 'text-danger' : 'text-gray-600'}`}>
                        <Clock size={12} className="shrink-0" /> {dueLabel(f, now)}
                      </span>
                      <MemberAvatar name={f.owner} size="xs" />
                      {!done && (
                        <>
                          <button type="button" onClick={() => setCompleting(f)} className="w-7 h-7 grid place-items-center rounded-md bg-success-50 text-success-600 hover:bg-success-500 hover:text-white transition-colors" aria-label={`Complete ${f.title}`} title="Mark done">
                            <Check size={14} />
                          </button>
                          <div className="relative" ref={menu === f.id ? menuRef : undefined}>
                            <button type="button" onClick={() => setMenu(menu === f.id ? null : f.id)} className="w-7 h-7 grid place-items-center rounded-md text-gray-500 hover:bg-gray-100" aria-label="More actions" aria-expanded={menu === f.id}>
                              <CornerUpRight size={14} />
                            </button>
                            {menu === f.id && (
                              <div className="menu-panel absolute right-0 top-8 z-30 w-56 p-1.5" role="menu">
                                <p className="px-2.5 pt-1 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-gray-500">Snooze</p>
                                <button type="button" role="menuitem" className="menu-item" onClick={() => snooze(f, 1)}><AlarmClock size={14} /> 1 day</button>
                                <button type="button" role="menuitem" className="menu-item" onClick={() => snooze(f, 7)}><CalendarClock size={14} /> 1 week</button>
                                <p className="px-2.5 pt-2 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-gray-500">Hand over to</p>
                                <div className="max-h-40 overflow-y-auto">
                                  {members.filter(m => m.name !== f.owner).map(m => (
                                    <button key={m.name} type="button" role="menuitem" className="menu-item" onClick={() => reassign(f, m.name)}>
                                      <MemberAvatar name={m.name} size="xs" /> <span className="truncate">{m.name}</span>
                                    </button>
                                  ))}
                                </div>
                                <button type="button" role="menuitem" className="menu-item !text-danger hover:!bg-danger-50 mt-1" onClick={() => remove(f)}><Trash2 size={14} /> Delete</button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Modal
        isOpen={modal === 'new'}
        onClose={() => setModal(null)}
        title="New Follow-up"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" form="fu-form" className="btn-primary" disabled={!form.title.trim() || !form.contact.trim()}>Assign Follow-up</button>
          </>
        )}
      >
        <form id="fu-form" onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="fu-title" className="form-label">What needs to happen? *</label>
            <input id="fu-title" className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Send revised proposal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fu-contact" className="form-label">Contact *</label>
              <input id="fu-contact" className="form-input" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="fu-company" className="form-label">Company</label>
              <input id="fu-company" className="form-input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
          </div>
          <div>
            <span className="form-label">Channel</span>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CHANNELS).map(([name, c]) => (
                <button key={name} type="button" onClick={() => setForm(f => ({ ...f, channel: name }))} aria-pressed={form.channel === name} className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs font-semibold transition-all ${form.channel === name ? 'border-[color:var(--focus-border)] bg-primary-50 text-gray-900' : 'border-[color:var(--border-subtle)] text-gray-600 hover:bg-gray-50'}`}>
                  <span className={`w-7 h-7 rounded-lg grid place-items-center ${c.cls}`}><c.icon size={14} /></span>{name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label htmlFor="fu-owner" className="form-label">Owner</label>
              <select id="fu-owner" className="form-select" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
                {members.map(m => <option key={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="fu-date" className="form-label">Date</label>
              <input id="fu-date" type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="fu-time" className="form-label">Time</label>
              <input id="fu-time" type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <span className="form-label">Priority</span>
            <div className="flex gap-2">
              {Object.entries(PRIORITY).map(([p, color]) => (
                <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))} aria-pressed={form.priority === p} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${form.priority === p ? 'border-[color:var(--focus-border)] bg-primary-50 text-gray-900' : 'border-[color:var(--border-subtle)] text-gray-600'}`}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /> {p}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!completing}
        onClose={() => setCompleting(null)}
        title="Complete follow-up"
        size="sm"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setCompleting(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={confirmDone}><CheckCircle2 size={15} /> Mark as done</button>
          </>
        )}
      >
        {completing && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700"><b>{completing.title}</b> with {completing.contact}</p>
            <label htmlFor="fu-outcome" className="form-label">Outcome (optional)</label>
            <textarea id="fu-outcome" rows={3} className="form-input" value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="e.g. Proposal accepted, kickoff next week" />
          </div>
        )}
      </Modal>
    </div>
  );
}
