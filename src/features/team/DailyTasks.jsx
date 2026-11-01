import React, { useMemo, useState } from 'react';
import { addDays, format, isToday, parseISO, subDays } from 'date-fns';
import {
  Plus, ChevronLeft, ChevronRight, LayoutGrid, History, Circle, Loader, CheckCircle2, Clock, Repeat, Users,
  Trash2, ArrowRightLeft, Flag, PlusCircle, UserCheck, TrendingUp, CalendarArrowUp,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import useCollection from '../../hooks/useCollection';
import useQuickAction from '../../hooks/useQuickAction';
import { deptColor } from '../../data/teamData';
import { generateId } from '../../utils/format';
import {
  MemberAvatar, AvatarStack, ProgressRing, Pill, DeptChip, Segmented, useTeamMembers,
} from './teamUi';

const STATUS_COLS = [
  { id: 'To Do', icon: Circle, tone: 'bg-gray-400' },
  { id: 'In Progress', icon: Loader, tone: 'bg-accent' },
  { id: 'Done', icon: CheckCircle2, tone: 'bg-success-500' },
];
const PRIORITY_TONE = { High: 'danger', Medium: 'warning', Low: 'info' };
const statusFor = (p) => (p >= 100 ? 'Done' : p > 0 ? 'In Progress' : 'To Do');
const ACTION_META = {
  created: { icon: PlusCircle, cls: 'bg-teal-800 text-primrose', verb: 'created' },
  assigned: { icon: UserCheck, cls: 'bg-teal-500 text-white', verb: 'reassigned' },
  progress: { icon: TrendingUp, cls: 'bg-accent text-white', verb: 'updated' },
  completed: { icon: CheckCircle2, cls: 'bg-success-500 text-white', verb: 'completed' },
  moved: { icon: CalendarArrowUp, cls: 'bg-primrose text-primary-ink', verb: 'carried over' },
};

const emptyForm = (date, department) => ({
  title: '', description: '', department, assignee: '', date, dueTime: '17:00', priority: 'Medium', repeatDaily: false,
});

export default function DailyTasks() {
  const addToast = useToast();
  const { members, me } = useTeamMembers();
  const [tasks, setTasks] = useCollection('dailyTasks');
  const [date, setDate] = useState(() => new Date());
  const [dept, setDept] = useState('all');
  const [view, setView] = useState('board');
  const [historyMember, setHistoryMember] = useState('all');
  const [draft, setDraft] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const dateKey = format(date, 'yyyy-MM-dd');
  const departments = useMemo(() => [...new Set([...members.map(m => m.department), ...tasks.map(t => t.department)])].filter(Boolean), [members, tasks]);

  const openAssign = () => {
    setForm(emptyForm(dateKey, dept !== 'all' ? dept : departments[0]));
    setModal(true);
  };
  useQuickAction('new', openAssign);

  const dayTasks = tasks.filter(t => t.date === dateKey);
  const shown = dayTasks.filter(t => dept === 'all' || t.department === dept);
  const avg = (list) => (list.length ? Math.round(list.reduce((s, t) => s + t.progress, 0) / list.length) : 0);
  const detail = tasks.find(t => t.id === detailId);

  const log = (t, action, detailText) => [...(t.history || []), { at: new Date().toISOString(), by: me, action, detail: detailText }];

  const commitProgress = (t, value) => {
    setDraft(d => { const n = { ...d }; delete n[t.id]; return n; });
    if (value === t.progress) return;
    const done = value >= 100;
    setTasks(prev => prev.map(x => (x.id === t.id ? {
      ...x, progress: value, status: statusFor(value), history: log(x, done ? 'completed' : 'progress', done ? 'Marked as done' : `Progress set to ${value}%`),
    } : x)));
    if (done) addToast(`“${t.title}” completed! 🎉`, 'success');
  };

  const reassign = (t, assignee) => {
    setTasks(prev => prev.map(x => (x.id === t.id ? { ...x, assignee, history: log(x, 'assigned', `Assigned to ${assignee || `whole ${x.department} team`}`) } : x)));
    addToast(`Task reassigned to ${assignee || t.department}.`, 'success');
  };

  const carryOver = () => {
    const unfinished = shown.filter(t => t.progress < 100);
    if (!unfinished.length) { addToast('Nothing to carry over — every task is done.', 'info'); return; }
    const next = format(addDays(date, 1), 'yyyy-MM-dd');
    const ids = new Set(unfinished.map(t => t.id));
    setTasks(prev => prev.map(x => (ids.has(x.id) ? { ...x, date: next, history: log(x, 'moved', `Carried over to ${format(addDays(date, 1), 'EEE d MMM')}`) } : x)));
    addToast(`${unfinished.length} unfinished task${unfinished.length > 1 ? 's' : ''} moved to tomorrow.`, 'success');
  };

  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const who = form.assignee || `whole ${form.department} team`;
    setTasks(prev => [...prev, {
      ...form, id: `dt-${generateId()}`, title: form.title.trim(), progress: 0, status: 'To Do',
      history: [{ at: new Date().toISOString(), by: me, action: 'created', detail: `Assigned to ${who}` }],
    }]);
    setModal(false);
    setDate(parseISO(form.date));
    addToast(`Task assigned to ${who}.`, 'success');
  };

  // ── History feed ──
  const historyFeed = useMemo(() => tasks
    .filter(t => dept === 'all' || t.department === dept)
    .flatMap(t => (t.history || []).map((h, i) => ({ ...h, key: `${t.id}-${i}`, task: t })))
    .filter(h => historyMember === 'all' || h.by === historyMember || h.task.assignee === historyMember)
    .sort((a, b) => b.at.localeCompare(a.at)), [tasks, dept, historyMember]);
  const historyByDay = historyFeed.reduce((acc, h) => {
    const k = h.at.slice(0, 10);
    (acc[k] ||= []).push(h);
    return acc;
  }, {});

  const deptMembers = (d) => members.filter(m => m.department === d);

  // A render function (not a component) so the progress slider keeps focus while dragging.
  const renderTask = (t) => {
    const value = draft[t.id] ?? t.progress;
    return (
      <article key={t.id} className="card p-4 hover:-translate-y-0.5 group">
        <button type="button" onClick={() => setDetailId(t.id)} className="block w-full text-left">
          <div className="flex items-start gap-2">
            <p className={`flex-1 text-[13.5px] font-semibold leading-snug ${t.progress >= 100 ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{t.title}</p>
            <Pill tone={PRIORITY_TONE[t.priority]}><Flag size={10} />{t.priority}</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <DeptChip dept={t.department} className="!text-[10.5px]" />
            {t.repeatDaily && <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-brand"><Repeat size={11} /> Daily</span>}
          </div>
        </button>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11.5px] mb-1">
            <span className="text-gray-500 flex items-center gap-1"><Clock size={11} /> Due {t.dueTime ? format(parseISO(`2000-01-01T${t.dueTime}`), 'h:mm a') : '—'}</span>
            <span className="font-bold text-gray-900 tabular-nums">{value}%</span>
          </div>
          {/* Drag the bar to update progress (a transparent range input sits on top). */}
          <div className="relative h-5 flex items-center">
            <div className="relative w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`absolute inset-y-0 left-0 rounded-full transition-[width] ${value >= 100 ? 'bg-success-500' : 'bg-gradient-to-r from-teal-500 to-teal-800'}`} style={{ width: `${value}%` }} />
            </div>
            <span
              className="absolute w-4 h-4 -ml-2 rounded-full bg-primrose border-2 border-teal-800 shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${value}%` }}
              aria-hidden="true"
            />
            <input
              type="range" min="0" max="100" step="5" value={value}
              onChange={e => setDraft(d => ({ ...d, [t.id]: Number(e.target.value) }))}
              onPointerUp={e => commitProgress(t, Number(e.currentTarget.value))}
              onKeyUp={e => commitProgress(t, Number(e.currentTarget.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={`Progress for ${t.title}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          {t.assignee ? (
            <span className="flex items-center gap-2 text-xs text-gray-700 font-medium min-w-0"><MemberAvatar name={t.assignee} size="xs" /><span className="truncate">{t.assignee}</span></span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-brand"><Users size={13} /> Whole department</span>
          )}
          {t.progress < 100 && (
            <button type="button" onClick={() => commitProgress(t, 100)} className="text-[11px] font-bold text-success-600 hover:underline shrink-0">Mark done</button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div>
      <PageHeader
        title="Daily Tasks"
        subtitle="Assign the day’s work to people or whole departments, track progress live and keep a full history."
        actions={<button type="button" className="btn-primary" onClick={openAssign}><Plus size={16} /> Assign Task</button>}
      />

      {/* Day bar */}
      <section className="card p-4 sm:p-5 mb-5 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-3">
          <button type="button" className="btn-icon border border-[color:var(--border-subtle)]" onClick={() => setDate(d => subDays(d, 1))} aria-label="Previous day"><ChevronLeft size={18} /></button>
          <div className="text-center min-w-[170px]">
            <p className="text-lg font-extrabold text-gray-900">{isToday(date) ? 'Today' : format(date, 'EEEE')}</p>
            <p className="text-xs text-gray-500">{format(date, 'd MMMM yyyy')}</p>
          </div>
          <button type="button" className="btn-icon border border-[color:var(--border-subtle)]" onClick={() => setDate(d => addDays(d, 1))} aria-label="Next day"><ChevronRight size={18} /></button>
          {!isToday(date) && <button type="button" className="btn-outline btn-sm" onClick={() => setDate(new Date())}>Today</button>}
        </div>
        <div className="flex items-center gap-4 lg:ml-auto">
          <ProgressRing value={avg(shown)} size={64} stroke={7} color="#1C7D86">
            <span className="text-sm font-extrabold text-gray-900">{avg(shown)}%</span>
          </ProgressRing>
          <div className="grid grid-cols-3 gap-5 text-center">
            {STATUS_COLS.map(c => (
              <div key={c.id}>
                <p className="text-xl font-extrabold text-gray-900">{shown.filter(t => t.status === c.id).length}</p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${c.tone}`} />{c.id}</p>
              </div>
            ))}
          </div>
          <button type="button" className="btn-outline btn-sm hidden sm:inline-flex" onClick={carryOver} title="Move unfinished tasks to the next day">
            <ArrowRightLeft size={14} /> Carry over
          </button>
        </div>
      </section>

      {/* Departments */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setDept('all')}
          className={`shrink-0 w-48 text-left rounded-2xl p-4 border transition-all ${dept === 'all' ? 'bg-teal-800 text-white border-transparent shadow-glow-teal' : 'card hover:-translate-y-0.5'}`}
        >
          <p className={`text-xs font-bold uppercase tracking-wider ${dept === 'all' ? 'text-primrose' : 'text-gray-500'}`}>All departments</p>
          <p className="text-2xl font-extrabold mt-1">{dayTasks.length} <span className="text-sm font-semibold opacity-70">tasks</span></p>
          <div className={`h-1.5 rounded-full mt-3 overflow-hidden ${dept === 'all' ? 'bg-white/15' : 'bg-gray-100'}`}>
            <div className="h-full rounded-full bg-primrose" style={{ width: `${avg(dayTasks)}%` }} />
          </div>
          <p className={`text-[11px] mt-1.5 ${dept === 'all' ? 'text-white/70' : 'text-gray-500'}`}>{avg(dayTasks)}% complete</p>
        </button>
        {departments.map(d => {
          const list = dayTasks.filter(t => t.department === d);
          const color = deptColor(d);
          const active = dept === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDept(active ? 'all' : d)}
              aria-pressed={active}
              className={`shrink-0 w-52 text-left card p-4 hover:-translate-y-0.5 ${active ? '!border-[color:var(--focus-border)] ring-2 ring-[color:var(--focus-ring)]' : ''}`}
            >
              <p className="flex items-center gap-2 text-[12.5px] font-bold text-gray-900 truncate"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />{d}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-extrabold text-gray-900">{list.length}</p>
                <AvatarStack names={deptMembers(d).map(m => m.name)} max={3} size="xs" />
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${avg(list)}%`, backgroundColor: color }} /></div>
              <p className="text-[11px] text-gray-500 mt-1.5">{avg(list)}% complete</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Segmented
          label="Daily task views"
          value={view}
          onChange={setView}
          options={[{ value: 'board', label: 'Progress board', icon: LayoutGrid }, { value: 'history', label: 'Task history', icon: History }]}
        />
        {view === 'history' && (
          <select className="form-select !w-auto text-sm" value={historyMember} onChange={e => setHistoryMember(e.target.value)} aria-label="Filter history by member">
            <option value="all">Everyone</option>
            {members.map(m => <option key={m.name}>{m.name}</option>)}
          </select>
        )}
      </div>

      {view === 'board' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {STATUS_COLS.map(col => {
            const list = shown.filter(t => t.status === col.id).sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''));
            return (
              <section key={col.id} className="rounded-2xl p-3 bg-surface-sunken border border-[color:var(--border-subtle)]">
                <header className="flex items-center gap-2 px-1 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.tone}`} />
                  <h2 className="text-sm font-bold text-gray-900 flex-1">{col.id}</h2>
                  <span className="text-xs font-bold text-gray-500 bg-surface-raised rounded-full px-2 py-0.5">{list.length}</span>
                </header>
                <div className="space-y-3">
                  {list.length === 0 && <p className="text-xs text-gray-500 text-center py-8 border-2 border-dashed border-[color:var(--border-subtle)] rounded-xl">No tasks</p>}
                  {list.map(renderTask)}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {view === 'history' && (
        <section className="card p-5 sm:p-6">
          {Object.keys(historyByDay).length === 0 && <p className="text-sm text-gray-500 text-center py-10">No history yet.</p>}
          {Object.entries(historyByDay).map(([day, entries]) => (
            <div key={day} className="mb-6 last:mb-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 mb-3">{isToday(parseISO(day)) ? 'Today' : format(parseISO(day), 'EEEE, d MMM')}</p>
              <ol className="relative ml-4 border-l-2 border-[color:var(--border-subtle)] space-y-4">
                {entries.map(h => {
                  const meta = ACTION_META[h.action] || ACTION_META.progress;
                  return (
                    <li key={h.key} className="relative pl-6">
                      <span className={`absolute -left-[15px] top-0 w-7 h-7 rounded-full grid place-items-center ring-4 ring-[color:var(--surface-raised)] ${meta.cls}`}><meta.icon size={13} /></span>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-[13px] text-gray-800"><b>{h.by}</b> {meta.verb} <button type="button" className="font-semibold text-brand hover:underline" onClick={() => setDetailId(h.task.id)}>{h.task.title}</button></p>
                        <span className="text-[11px] text-gray-500">{format(parseISO(h.at), 'h:mm a')}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">{h.detail} <DeptChip dept={h.task.department} className="!text-[10px] !py-0" /></p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </section>
      )}

      {/* Assign modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Assign Daily Task"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" form="dt-form" className="btn-primary" disabled={!form?.title.trim()}>Assign Task</button>
          </>
        )}
      >
        {form && (
          <form id="dt-form" onSubmit={save} className="space-y-4">
            <div>
              <label htmlFor="dt-title" className="form-label">Task *</label>
              <input id="dt-title" className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Update calibration log" />
            </div>
            <div>
              <label htmlFor="dt-desc" className="form-label">Details</label>
              <textarea id="dt-desc" rows={2} className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <span className="form-label">Department</span>
              <div className="flex flex-wrap gap-2">
                {departments.map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, department: d, assignee: '' }))} aria-pressed={form.department === d} className={`rounded-md transition-all ${form.department === d ? 'ring-2 ring-[color:var(--focus-border)] ring-offset-1 ring-offset-[color:var(--surface-raised)]' : 'opacity-70 hover:opacity-100'}`}>
                    <DeptChip dept={d} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="form-label">Assign to</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, assignee: '' }))} aria-pressed={!form.assignee} className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border text-xs font-semibold ${!form.assignee ? 'border-[color:var(--focus-border)] bg-primary-50 text-gray-900' : 'border-[color:var(--border-subtle)] text-gray-600'}`}>
                  <span className="w-6 h-6 rounded-full grid place-items-center bg-teal-800 text-primrose"><Users size={12} /></span> Whole department
                </button>
                {(deptMembers(form.department).length ? deptMembers(form.department) : members).map(m => (
                  <button key={m.name} type="button" onClick={() => setForm(f => ({ ...f, assignee: m.name }))} aria-pressed={form.assignee === m.name} className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-xs font-semibold ${form.assignee === m.name ? 'border-[color:var(--focus-border)] bg-primary-50 text-gray-900' : 'border-[color:var(--border-subtle)] text-gray-600'}`}>
                    <MemberAvatar name={m.name} size="xs" /> {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="dt-date" className="form-label">Date</label>
                <input id="dt-date" type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="dt-due" className="form-label">Due by</label>
                <input id="dt-due" type="time" className="form-input" value={form.dueTime} onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="dt-pri" className="form-label">Priority</label>
                <select id="dt-pri" className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[#145D68]" checked={form.repeatDaily} onChange={e => setForm(f => ({ ...f, repeatDaily: e.target.checked }))} /> Repeats every working day
            </label>
          </form>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetailId(null)}
        title="Task details"
        size="lg"
        footer={detail && (
          <>
            <button type="button" className="btn-ghost !text-danger mr-auto" onClick={() => setDeleteTarget(detail)}><Trash2 size={15} /> Delete</button>
            <button type="button" className="btn-secondary" onClick={() => setDetailId(null)}>Close</button>
            {detail.progress < 100 && <button type="button" className="btn-primary" onClick={() => commitProgress(detail, 100)}><CheckCircle2 size={15} /> Mark done</button>}
          </>
        )}
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <ProgressRing value={detail.progress} size={72} stroke={8} color={detail.progress >= 100 ? '#1E8C55' : '#1C7D86'}>
                <span className="text-sm font-extrabold text-gray-900">{detail.progress}%</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900">{detail.title}</p>
                {detail.description && <p className="text-sm text-gray-600 mt-1">{detail.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <DeptChip dept={detail.department} />
                  <Pill tone={PRIORITY_TONE[detail.priority]}>{detail.priority}</Pill>
                  <Pill tone="neutral">{format(parseISO(detail.date), 'EEE d MMM')} · {detail.dueTime || 'no time'}</Pill>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="dt-progress" className="form-label">Progress</label>
              <input
                id="dt-progress" type="range" min="0" max="100" step="5" value={draft[detail.id] ?? detail.progress}
                onChange={e => setDraft(d => ({ ...d, [detail.id]: Number(e.target.value) }))}
                onPointerUp={e => commitProgress(detail, Number(e.currentTarget.value))}
                onKeyUp={e => commitProgress(detail, Number(e.currentTarget.value))}
                className="w-full accent-[#145D68]"
              />
            </div>
            <div>
              <label htmlFor="dt-reassign" className="form-label">Assignee</label>
              <select id="dt-reassign" className="form-select" value={detail.assignee} onChange={e => reassign(detail, e.target.value)}>
                <option value="">Whole {detail.department} team</option>
                {members.map(m => <option key={m.name} value={m.name}>{m.name} — {m.department}</option>)}
              </select>
            </div>
            <div>
              <p className="form-label">History</p>
              <ol className="relative ml-3 border-l-2 border-[color:var(--border-subtle)] space-y-3">
                {[...(detail.history || [])].reverse().map((h, i) => {
                  const meta = ACTION_META[h.action] || ACTION_META.progress;
                  return (
                    <li key={i} className="relative pl-5">
                      <span className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full grid place-items-center ring-2 ring-[color:var(--surface-raised)] ${meta.cls}`}><meta.icon size={10} /></span>
                      <p className="text-[13px] text-gray-800"><b>{h.by}</b> · {h.detail}</p>
                      <p className="text-[11px] text-gray-500">{format(parseISO(h.at), 'EEE d MMM, h:mm a')}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
          setDeleteTarget(null);
          setDetailId(null);
          addToast('Task deleted.', 'success');
        }}
        title="Delete task"
        message={`Delete “${deleteTarget?.title}” and its history?`}
      />
    </div>
  );
}
