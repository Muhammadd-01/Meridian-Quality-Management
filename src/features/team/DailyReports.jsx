import React, { useMemo, useState } from 'react';
import { format, isToday, parseISO, subDays } from 'date-fns';
import {
  Plus, FileSpreadsheet, Clock, AlertTriangle, OctagonAlert, CheckCircle2, ChevronDown, Search, BellRing, Minus, Send, Target, ListTodo,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import DataTransferActions from '../../components/data-transfer/DataTransferActions';
import useCollection from '../../hooks/useCollection';
import useQuickAction from '../../hooks/useQuickAction';
import { ENTITIES } from '../../data/entities';
import { exportRecords } from '../../utils/dataTransfer';
import { generateId } from '../../utils/format';
import {
  MemberAvatar, ProgressRing, Pill, DeptChip, MiniStat, useTeamMembers,
} from './teamUi';

const STATUS = {
  'On track': { tone: 'success', icon: CheckCircle2, color: '#1E8C55' },
  'At risk': { tone: 'warning', icon: AlertTriangle, color: '#F78D00' },
  Blocked: { tone: 'danger', icon: OctagonAlert, color: '#B83A2C' },
};

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'all', label: 'All' },
];

const splitTasks = (text = '') => String(text).split(/;|\n/).map(s => s.trim()).filter(Boolean);

export default function DailyReports() {
  const addToast = useToast();
  const { members, me, departmentOf } = useTeamMembers();
  const [reports, setReports] = useCollection('dailyReports');
  const [, setReminders] = useCollection('reminders');
  const [range, setRange] = useState('today');
  const [member, setMember] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);

  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const openForm = (existing) => {
    const base = existing || reports.find(r => r.member === me && r.date === todayKey);
    setForm(base
      ? { ...base, tasksText: splitTasks(base.tasksCompleted).join('\n') }
      : { date: todayKey, member: me, tasksText: '', hours: 8, status: 'On track', blockers: '', tomorrowPlan: '' });
    setModal(true);
  };
  useQuickAction('new', () => openForm());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const yKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const wKey = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    return reports
      .filter(r => range === 'all' || (range === 'today' ? r.date === todayKey : range === 'yesterday' ? r.date === yKey : r.date >= wKey))
      .filter(r => member === 'all' || r.member === member)
      .filter(r => status === 'all' || r.status === status)
      .filter(r => !q || `${r.member} ${r.department} ${r.tasksCompleted} ${r.blockers}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || a.member.localeCompare(b.member));
  }, [reports, range, member, status, query, todayKey]);

  const todays = reports.filter(r => r.date === todayKey);
  const submitted = new Set(todays.map(r => r.member));
  const missing = members.filter(m => !submitted.has(m.name));
  const hoursToday = todays.reduce((s, r) => s + (Number(r.hours) || 0), 0);

  const nudge = (name) => {
    setReminders(prev => [...prev, {
      id: `rem-${generateId()}`, title: 'Submit your daily report', remindAt: new Date().toISOString(), repeat: 'none',
      note: `Requested by ${me}`, assignee: name, done: false, notified: false, createdAt: new Date().toISOString(),
    }]);
    addToast(`Reminder sent to ${name}.`, 'success');
  };

  const exportExcel = () => {
    try {
      const res = exportRecords({ records: filtered, fields: ENTITIES.dailyReports.fields, format: 'xlsx', filename: 'meridian_daily_report', title: 'Daily Report' });
      addToast(`Exported ${res.count} report${res.count === 1 ? '' : 's'} to ${res.filename}.`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const save = (e) => {
    e.preventDefault();
    const tasks = splitTasks(form.tasksText);
    if (!tasks.length) return;
    const record = {
      id: form.id || `dr-${generateId()}`, date: form.date, member: form.member, department: departmentOf(form.member) || 'Management',
      tasksCompleted: tasks.join('; '), hours: Number(form.hours) || 0, status: form.status, blockers: form.blockers.trim(), tomorrowPlan: form.tomorrowPlan.trim(),
    };
    const exists = reports.some(r => r.id === record.id || (r.member === record.member && r.date === record.date));
    setReports(prev => (exists
      ? prev.map(r => (r.id === record.id || (r.member === record.member && r.date === record.date) ? { ...record, id: r.id } : r))
      : [record, ...prev]));
    setModal(false);
    addToast(exists ? 'Daily report updated.' : 'Daily report submitted — great work today! ✨', 'success');
  };

  const toggle = (id) => setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle="End-of-day updates from every team member — import and export them as Excel in one click."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <DataTransferActions entityType="dailyReports" records={reports} setRecords={setReports} filtered={filtered} />
            <button type="button" className="btn-outline btn-sm" onClick={exportExcel}><FileSpreadsheet size={14} /> Excel</button>
            <button type="button" className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Submit Report</button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 mb-6">
        <section className="card p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-center">
          <ProgressRing value={(submitted.size / Math.max(1, members.length)) * 100} size={128} stroke={12} color="#1C7D86">
            <span>
              <span className="block text-2xl font-extrabold text-gray-900">{submitted.size}/{members.length}</span>
              <span className="block text-[10.5px] uppercase tracking-wider text-gray-500">submitted</span>
            </span>
          </ProgressRing>
          <div className="flex-1 min-w-0 w-full">
            <h2 className="text-[15px] font-bold text-gray-900">Today’s submissions</h2>
            <p className="text-xs text-gray-500 mb-3">{format(new Date(), 'EEEE, d MMMM')}</p>
            {missing.length === 0 ? (
              <p className="text-sm text-success-600 font-semibold flex items-center gap-2"><CheckCircle2 size={16} /> Everyone has submitted. 🎉</p>
            ) : (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Still waiting on</p>
                <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {missing.map(m => (
                    <li key={m.name} className="flex items-center gap-2.5">
                      <MemberAvatar name={m.name} size="sm" />
                      <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">{m.name}</span>
                      {m.name === me ? (
                        <button type="button" className="btn-primary btn-xs !py-1.5 !px-2.5" onClick={() => openForm()}>Submit mine</button>
                      ) : (
                        <button type="button" className="btn-outline btn-xs !py-1.5 !px-2.5" onClick={() => nudge(m.name)}><BellRing size={12} /> Nudge</button>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
        <div className="grid grid-cols-2 gap-4 content-start">
          <MiniStat icon={Clock} label="Hours logged today" value={`${hoursToday}h`} hint={`${todays.length ? (hoursToday / todays.length).toFixed(1) : 0}h average`} tone="teal" />
          <MiniStat icon={CheckCircle2} label="On track" value={todays.filter(r => r.status === 'On track').length} tone="green" />
          <MiniStat icon={AlertTriangle} label="At risk" value={todays.filter(r => r.status === 'At risk').length} tone="orange" />
          <MiniStat icon={OctagonAlert} label="Blocked" value={todays.filter(r => r.status === 'Blocked').length} hint="Need a hand" tone="red" />
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="p-4 flex flex-col xl:flex-row xl:items-center gap-3 border-b border-[color:var(--border-subtle)]">
          <div className="inline-flex p-1 rounded-lg bg-gray-100 gap-1 self-start">
            {RANGES.map(r => (
              <button key={r.id} type="button" onClick={() => setRange(r.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${range === r.id ? 'bg-surface-raised text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{r.label}</button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" className="form-input !pl-9" placeholder="Search reports…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search reports" />
          </div>
          <select className="form-select xl:!w-48 text-sm" value={member} onChange={e => setMember(e.target.value)} aria-label="Filter by member">
            <option value="all">All members</option>
            {members.map(m => <option key={m.name}>{m.name}</option>)}
          </select>
          <select className="form-select xl:!w-40 text-sm" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">Any status</option>
            {Object.keys(STATUS).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <ul className="divide-y divide-[color:var(--border-subtle)]">
          {filtered.length === 0 && (
            <li className="py-14 text-center">
              <ListTodo size={30} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No reports for this filter.</p>
            </li>
          )}
          {filtered.map(r => {
            const st = STATUS[r.status] || STATUS['On track'];
            const tasks = splitTasks(r.tasksCompleted);
            const isOpen = open.has(r.id);
            return (
              <li key={r.id}>
                <button type="button" onClick={() => toggle(r.id)} aria-expanded={isOpen} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: st.color }} aria-hidden="true" />
                  <MemberAvatar name={r.member} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{r.member}</span>
                      <DeptChip dept={r.department} className="!text-[10.5px] hidden sm:inline-flex" />
                    </span>
                    <span className="block text-xs text-gray-500 truncate mt-0.5">{tasks[0]}{tasks.length > 1 ? ` +${tasks.length - 1} more` : ''}</span>
                  </span>
                  <span className="hidden md:block text-xs text-gray-500 text-right shrink-0">
                    <span className="block font-semibold text-gray-700">{isToday(parseISO(r.date)) ? 'Today' : format(parseISO(r.date), 'EEE d MMM')}</span>
                    {r.hours}h logged
                  </span>
                  <Pill tone={st.tone} dot>{r.status}</Pill>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pl-[76px] grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                    <div className="md:col-span-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Completed</p>
                      <ul className="space-y-1.5">
                        {tasks.map(t => <li key={t} className="flex items-start gap-2 text-sm text-gray-800"><CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />{t}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      {r.blockers && (
                        <div className="rounded-lg bg-danger-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-danger-600 mb-1">Blockers</p>
                          <p className="text-sm text-gray-800">{r.blockers}</p>
                        </div>
                      )}
                      {r.tomorrowPlan && (
                        <div className="rounded-lg bg-primary-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand mb-1 flex items-center gap-1"><Target size={12} /> Tomorrow</p>
                          <p className="text-sm text-gray-800">{r.tomorrowPlan}</p>
                        </div>
                      )}
                      {(r.member === me) && <button type="button" className="btn-outline btn-sm" onClick={() => openForm(r)}>Edit report</button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={form?.id ? 'Update Daily Report' : 'Submit Daily Report'}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" form="dr-form" className="btn-primary" disabled={!form || !splitTasks(form.tasksText).length}><Send size={15} /> {form?.id ? 'Save' : 'Submit'}</button>
          </>
        )}
      >
        {form && (
          <form id="dr-form" onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="dr-date" className="form-label">Date</label>
                <input id="dr-date" type="date" className="form-input" value={form.date} max={todayKey} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="dr-member" className="form-label">Team member</label>
                <select id="dr-member" className="form-select" value={form.member} onChange={e => setForm(f => ({ ...f, member: e.target.value }))}>
                  {members.map(m => <option key={m.name}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="dr-tasks" className="form-label">What did you complete today? * <span className="font-normal text-gray-500">(one per line)</span></label>
              <textarea id="dr-tasks" rows={5} className="form-input" value={form.tasksText} onChange={e => setForm(f => ({ ...f, tasksText: e.target.value }))} placeholder={'Closed 3 CAPA actions\nPrepared audit checklist'} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-end">
              <div>
                <span className="form-label">Hours worked</span>
                <div className="inline-flex items-center rounded-lg border border-[color:var(--color-line)] overflow-hidden">
                  <button type="button" className="px-3 py-2.5 hover:bg-gray-50" onClick={() => setForm(f => ({ ...f, hours: Math.max(0, Number(f.hours) - 0.5) }))} aria-label="Less"><Minus size={14} /></button>
                  <input type="number" step="0.5" min="0" max="24" className="w-16 text-center bg-transparent text-sm font-bold text-gray-900 outline-none" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} aria-label="Hours worked" />
                  <button type="button" className="px-3 py-2.5 hover:bg-gray-50" onClick={() => setForm(f => ({ ...f, hours: Math.min(24, Number(f.hours) + 0.5) }))} aria-label="More"><Plus size={14} /></button>
                </div>
              </div>
              <div>
                <span className="form-label">How did the day go?</span>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STATUS).map(([s, cfg]) => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))} aria-pressed={form.status === s} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-semibold transition-all ${form.status === s ? 'border-transparent text-white shadow-sm' : 'border-[color:var(--border-subtle)] text-gray-600 hover:bg-gray-50'}`} style={form.status === s ? { backgroundColor: cfg.color } : undefined}>
                      <cfg.icon size={14} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dr-blockers" className="form-label">Blockers</label>
                <textarea id="dr-blockers" rows={2} className="form-input" value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))} placeholder="Anything slowing you down?" />
              </div>
              <div>
                <label htmlFor="dr-plan" className="form-label">Plan for tomorrow</label>
                <textarea id="dr-plan" rows={2} className="form-input" value={form.tomorrowPlan} onChange={e => setForm(f => ({ ...f, tomorrowPlan: e.target.value }))} />
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
