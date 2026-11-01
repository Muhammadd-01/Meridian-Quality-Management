import React, { useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, format, isSunday, parseISO, isValid } from 'date-fns';
import {
  Plus, Check, X, CalendarDays, Plane, Clock3, CheckCircle2, XCircle, PartyPopper, Inbox,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import useCollection from '../../hooks/useCollection';
import useQuickAction from '../../hooks/useQuickAction';
import { LEAVE_TYPES } from '../../data/teamData';
import { generateId } from '../../utils/format';
import {
  MemberAvatar, ProgressRing, Pill, DeptChip, MiniStat, Segmented, useTeamMembers,
} from './teamUi';

const HOLIDAYS = [
  { date: '2026-11-09', name: 'Iqbal Day' },
  { date: '2026-12-25', name: 'Quaid-e-Azam Day' },
  { date: '2027-02-05', name: 'Kashmir Solidarity Day' },
  { date: '2027-03-23', name: 'Pakistan Day' },
];

const STATUS_TONE = { Pending: 'warning', Approved: 'success', Rejected: 'danger' };

/** Working days in a range (Sundays excluded); a half day counts 0.5. */
export function leaveDays(from, to, halfDay) {
  const a = parseISO(from);
  const b = parseISO(to);
  if (!isValid(a) || !isValid(b) || b < a) return 0;
  const n = eachDayOfInterval({ start: a, end: b }).filter(d => !isSunday(d)).length;
  return halfDay && n === 1 ? 0.5 : n;
}

const range = (l) => (l.from === l.to ? format(parseISO(l.from), 'd MMM yyyy') : `${format(parseISO(l.from), 'd MMM')} – ${format(parseISO(l.to), 'd MMM yyyy')}`);

export default function Leaves() {
  const addToast = useToast();
  const { members, me, departmentOf } = useTeamMembers();
  const [requests, setRequests] = useCollection('leaveRequests');
  const [tab, setTab] = useState('approvals');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const year = todayKey.slice(0, 4);

  const openRequest = () => {
    setForm({ type: 'Annual', from: todayKey, to: todayKey, halfDay: false, reason: '', member: me });
    setError('');
    setModalOpen(true);
  };
  useQuickAction('new', openRequest);

  const used = useMemo(() => {
    const u = Object.fromEntries(Object.keys(LEAVE_TYPES).map(k => [k, 0]));
    requests.filter(r => r.member === me && r.status === 'Approved' && r.from.startsWith(year))
      .forEach(r => { u[r.type] = (u[r.type] || 0) + leaveDays(r.from, r.to, r.halfDay); });
    return u;
  }, [requests, me, year]);

  const pending = requests.filter(r => r.status === 'Pending');
  const outToday = requests.filter(r => r.status === 'Approved' && r.from <= todayKey && r.to >= todayKey);
  const list = useMemo(() => {
    const base = tab === 'approvals' ? pending : tab === 'mine' ? requests.filter(r => r.member === me) : requests;
    return [...base].sort((a, b) => b.from.localeCompare(a.from));
  }, [tab, requests, pending, me]);

  const decide = (req, status) => {
    setRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status, decidedBy: me, decidedOn: todayKey } : r)));
    addToast(`${req.member.split(' ')[0]}’s ${req.type.toLowerCase()} leave ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info');
  };
  const cancel = (req) => {
    setRequests(prev => prev.filter(r => r.id !== req.id));
    addToast('Leave request withdrawn.', 'info');
  };

  const days = form ? leaveDays(form.from, form.to, form.halfDay) : 0;
  const balanceAfter = form && form.member === me ? LEAVE_TYPES[form.type].total - (used[form.type] || 0) - days : null;

  const submit = (e) => {
    e.preventDefault();
    if (!form.from || !form.to || form.to < form.from) { setError('Choose a valid date range.'); return; }
    if (!days) { setError('The selected range has no working days.'); return; }
    if (!form.reason.trim()) { setError('Please add a short reason.'); return; }
    const req = {
      ...form, id: `lv-${generateId()}`, reason: form.reason.trim(), department: departmentOf(form.member) || 'Management',
      status: 'Pending', appliedOn: todayKey, halfDay: form.halfDay && form.from === form.to,
    };
    setRequests(prev => [req, ...prev]);
    setModalOpen(false);
    setTab('mine');
    addToast(`Leave request sent for ${days} day${days === 1 ? '' : 's'}. Your manager will be notified.`, 'success');
  };

  // Next 14 days "who's out" strip.
  const strip = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Request time off, track balances and approve your team’s leave in one place."
        actions={<button type="button" className="btn-primary" onClick={openRequest}><Plus size={16} /> Request Leave</button>}
      />

      {/* Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(LEAVE_TYPES).map(([type, cfg]) => {
          const left = cfg.total - (used[type] || 0);
          return (
            <div key={type} className="card p-4 flex items-center gap-4 hover:-translate-y-0.5">
              <ProgressRing value={(left / cfg.total) * 100} size={68} stroke={7} color={cfg.color}>
                <span className="text-base font-extrabold text-gray-900">{left}</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{type}</p>
                <p className="text-xs text-gray-500">{used[type] || 0} used of {cfg.total} days</p>
                <p className="text-[11px] font-semibold mt-1 text-gray-700">{left} left this year</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Who's out */}
          <section className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Who’s out — next 2 weeks</h2>
                <p className="text-xs text-gray-500">Approved leave is solid, pending is faded.</p>
              </div>
              <Pill tone="primary"><Plane size={12} /> {outToday.length} out today</Pill>
            </div>
            <div className="grid grid-cols-7 lg:grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5">
              {strip.map(d => {
                const key = format(d, 'yyyy-MM-dd');
                const out = requests.filter(r => r.status !== 'Rejected' && r.from <= key && r.to >= key);
                const holiday = HOLIDAYS.find(h => h.date === key);
                return (
                  <div
                    key={key}
                    title={holiday ? holiday.name : out.map(o => `${o.member} (${o.type}${o.status === 'Pending' ? ', pending' : ''})`).join('\n') || 'Everyone in'}
                    className={`rounded-lg p-1.5 min-h-[86px] border text-center ${key === todayKey ? 'border-[color:var(--focus-border)] bg-primary-50' : 'border-[color:var(--border-subtle)]'} ${isSunday(d) ? 'bg-gray-50' : ''}`}
                  >
                    <p className="text-[10px] font-bold uppercase text-gray-500">{format(d, 'EEE')}</p>
                    <p className={`text-sm font-extrabold ${key === todayKey ? 'text-brand' : 'text-gray-800'}`}>{format(d, 'd')}</p>
                    {holiday && <PartyPopper size={14} className="mx-auto mt-1 text-accent" aria-label={holiday.name} />}
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {out.slice(0, 3).map(o => (
                        <span key={o.id} className={o.status === 'Pending' ? 'opacity-40' : ''}><MemberAvatar name={o.member} size="xs" /></span>
                      ))}
                      {out.length > 3 && <span className="text-[10px] font-bold text-gray-500">+{out.length - 3}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Requests */}
          <section className="card overflow-hidden">
            <div className="card-header flex-wrap gap-3">
              <h2 className="text-[15px] font-bold text-gray-900">Leave requests</h2>
              <Segmented
                label="Leave lists"
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'approvals', label: 'Approvals', icon: Inbox, count: pending.length },
                  { value: 'mine', label: 'My requests' },
                  { value: 'all', label: 'All' },
                ]}
              />
            </div>
            <ul className="divide-y divide-[color:var(--border-subtle)]">
              {list.length === 0 && (
                <li className="py-14 text-center">
                  <CheckCircle2 size={30} className="mx-auto text-success mb-2" />
                  <p className="font-semibold text-gray-900">All caught up</p>
                  <p className="text-sm text-gray-500">No leave requests here.</p>
                </li>
              )}
              {list.map(r => {
                const n = leaveDays(r.from, r.to, r.halfDay);
                return (
                  <li key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <MemberAvatar name={r.member} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                          {r.member}
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LEAVE_TYPES[r.type]?.color }} />{r.type}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5"><CalendarDays size={12} /> {range(r)} · {n} day{n === 1 ? '' : 's'}{r.halfDay ? ' (half)' : ''}</p>
                        <p className="text-xs text-gray-600 mt-1 italic truncate">“{r.reason}”</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.department && <DeptChip dept={r.department} className="hidden md:inline-flex" />}
                      {r.status === 'Pending' && r.member !== me ? (
                        <>
                          <button type="button" onClick={() => decide(r, 'Rejected')} className="btn-outline btn-sm !text-danger !border-danger/30 hover:!bg-danger-50"><X size={14} /> Reject</button>
                          <button type="button" onClick={() => decide(r, 'Approved')} className="btn-primary btn-sm"><Check size={14} /> Approve</button>
                        </>
                      ) : (
                        <>
                          <Pill tone={STATUS_TONE[r.status]} dot>{r.status}</Pill>
                          {r.status === 'Pending' && r.member === me && (
                            <button type="button" onClick={() => cancel(r)} className="btn-ghost btn-sm">Withdraw</button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <MiniStat icon={Clock3} label="Awaiting approval" value={pending.length} hint="Requests from your team" tone="orange" />
          <MiniStat icon={CheckCircle2} label="Approved this year" value={requests.filter(r => r.status === 'Approved' && r.from.startsWith(year)).length} hint={`${members.length} team members`} tone="green" />
          <MiniStat icon={XCircle} label="Rejected" value={requests.filter(r => r.status === 'Rejected').length} tone="red" />
          <section className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><PartyPopper size={16} className="text-accent" /> Upcoming public holidays</h3>
            <ul className="space-y-3">
              {HOLIDAYS.filter(h => h.date >= todayKey).map(h => (
                <li key={h.date} className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-primrose text-primary-ink grid place-items-center leading-none shrink-0">
                    <span className="text-center">
                      <span className="block text-[10px] font-bold uppercase">{format(parseISO(h.date), 'MMM')}</span>
                      <span className="block text-base font-extrabold">{format(parseISO(h.date), 'd')}</span>
                    </span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{h.name}</span>
                    <span className="block text-xs text-gray-500">{format(parseISO(h.date), 'EEEE')}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request Leave"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="leave-form" className="btn-primary"><Plane size={15} /> Send Request</button>
          </>
        )}
      >
        {form && (
          <form id="leave-form" onSubmit={submit} className="space-y-4" noValidate>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div>
              <span className="form-label">Leave type</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LEAVE_TYPES).map(([type, cfg]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type }))}
                    aria-pressed={form.type === type}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${form.type === type ? 'border-[color:var(--focus-border)] bg-primary-50 shadow-sm' : 'border-[color:var(--border-subtle)] hover:bg-gray-50'}`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{type}</span>
                      <span className="block text-[11px] text-gray-500">{cfg.total - (used[type] || 0)} days left</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="lv-member" className="form-label">Employee</label>
              <select id="lv-member" className="form-select" value={form.member} onChange={e => setForm(f => ({ ...f, member: e.target.value }))}>
                {members.map(m => <option key={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="lv-from" className="form-label">From</label>
                <input id="lv-from" type="date" className="form-input" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value, to: f.to < e.target.value ? e.target.value : f.to }))} />
              </div>
              <div>
                <label htmlFor="lv-to" className="form-label">To</label>
                <input id="lv-to" type="date" className="form-input" min={form.from} value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
              </div>
            </div>
            {form.from === form.to && (
              <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#145D68]" checked={form.halfDay} onChange={e => setForm(f => ({ ...f, halfDay: e.target.checked }))} /> Half day only
              </label>
            )}
            <div>
              <label htmlFor="lv-reason" className="form-label">Reason</label>
              <textarea id="lv-reason" rows={3} className="form-input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Family event" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary-50 border border-[color:var(--hover-border)] px-4 py-3 text-sm">
              <span className="font-semibold text-gray-900">{days} working day{days === 1 ? '' : 's'}</span>
              {balanceAfter !== null && (
                <span className={balanceAfter < 0 ? 'text-danger font-semibold' : 'text-gray-600'}>
                  {balanceAfter < 0 ? `Exceeds balance by ${Math.abs(balanceAfter)}` : `${balanceAfter} ${form.type.toLowerCase()} days left after`}
                </span>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
