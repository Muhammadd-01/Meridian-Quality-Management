import React, { useMemo, useState } from 'react';
import { format, subDays, isSunday, parseISO } from 'date-fns';
import {
  LogIn, LogOut, Coffee, Play, Users, Clock, AlarmClock, Plane, Building2, Home, MapPin, TimerReset, Sparkles,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useCollection from '../../hooks/useCollection';
import { initialAttendance } from '../../data/teamData';
import { generateId } from '../../utils/format';
import {
  MemberAvatar, ProgressRing, Pill, DeptChip, MiniStat, useTeamMembers, useNow,
} from './teamUi';

const LATE_AFTER = '09:15';
const TARGET_MIN = 8 * 60;
const MODES = [
  { id: 'Office', icon: Building2 },
  { id: 'Remote', icon: Home },
  { id: 'Client site', icon: MapPin },
];

const toMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const hhmm = (d) => format(d, 'HH:mm');
const fmtDur = (min) => `${Math.floor(min / 60)}h ${String(Math.max(0, Math.round(min % 60))).padStart(2, '0')}m`;
const to12 = (t) => (t ? format(parseISO(`2000-01-01T${t}`), 'h:mm a') : '—');

/** Minutes worked for a record (live when still checked in), minus breaks. */
function workedMinutes(rec, now) {
  if (!rec?.checkIn) return 0;
  const end = rec.checkOut ? toMin(rec.checkOut) : now.getHours() * 60 + now.getMinutes();
  const breaks = (rec.breaks || []).reduce((s, b) => s + ((b.end ? toMin(b.end) : now.getHours() * 60 + now.getMinutes()) - toMin(b.start)), 0);
  return Math.max(0, end - toMin(rec.checkIn) - breaks);
}

export default function Attendance() {
  const addToast = useToast();
  const now = useNow(1000);
  const { members, me, departmentOf } = useTeamMembers();
  const [records, setRecords] = useLocalStorage('meridian-attendance', initialAttendance);
  const [leaves] = useCollection('leaveRequests');
  const [mode, setMode] = useState('Office');
  const [dept, setDept] = useState('all');

  const todayKey = format(now, 'yyyy-MM-dd');
  const mine = records.find(r => r.member === me && r.date === todayKey);
  const onBreak = !!mine?.breaks?.some(b => !b.end);
  const worked = workedMinutes(mine, now);

  const onLeaveToday = useMemo(() => new Set(
    leaves.filter(l => l.status === 'Approved' && l.type !== 'Work from home' && l.from <= todayKey && l.to >= todayKey).map(l => l.member),
  ), [leaves, todayKey]);

  const updateMine = (fn) => setRecords(prev => prev.map(r => (r.id === mine.id ? fn(r) : r)));

  const checkIn = () => {
    const t = hhmm(new Date());
    setRecords(prev => [...prev, { id: `att-${generateId()}`, member: me, date: todayKey, checkIn: t, checkOut: '', mode, breaks: [] }]);
    addToast(t > LATE_AFTER ? `Checked in at ${to12(t)} — a little late today.` : `Checked in at ${to12(t)}. Have a productive day!`, t > LATE_AFTER ? 'warning' : 'success');
  };
  const checkOut = () => {
    const t = hhmm(new Date());
    updateMine(r => ({ ...r, checkOut: t, breaks: (r.breaks || []).map(b => (b.end ? b : { ...b, end: t })) }));
    addToast(`Checked out at ${to12(t)} · ${fmtDur(worked)} worked today.`, 'success');
  };
  const toggleBreak = () => {
    const t = hhmm(new Date());
    updateMine(r => ({
      ...r,
      breaks: onBreak ? r.breaks.map(b => (b.end ? b : { ...b, end: t })) : [...(r.breaks || []), { start: t, end: '' }],
    }));
    addToast(onBreak ? 'Welcome back — break ended.' : 'Break started. Enjoy your chai ☕', 'info');
  };
  const undoCheckOut = () => {
    updateMine(r => ({ ...r, checkOut: '' }));
    addToast('Check-out undone — you are working again.', 'info');
  };

  // ── Today's roster ──
  const roster = members.map(m => {
    const rec = records.find(r => r.member === m.name && r.date === todayKey);
    let state = 'absent';
    if (onLeaveToday.has(m.name)) state = 'leave';
    if (rec) state = rec.checkOut ? 'out' : 'in';
    return { ...m, rec, state, late: rec ? rec.checkIn > LATE_AFTER : false, minutes: workedMinutes(rec, now) };
  });
  const present = roster.filter(r => r.rec).length;
  const late = roster.filter(r => r.late).length;
  const onLeave = roster.filter(r => r.state === 'leave').length;
  const missing = roster.filter(r => r.state === 'absent').length;

  // ── Last 7 working days ──
  const days = [];
  for (let i = 0; days.length < 7 && i < 14; i++) {
    const d = subDays(now, i);
    if (i === 0 || !isSunday(d)) days.unshift(d);
  }
  const weekRecords = records.filter(r => r.date >= format(days[0], 'yyyy-MM-dd'));
  const weekHours = weekRecords.filter(r => r.checkOut).map(r => workedMinutes(r, now));
  const avgHours = weekHours.length ? weekHours.reduce((a, b) => a + b, 0) / weekHours.length : 0;

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const filteredRoster = roster.filter(r => dept === 'all' || r.department === dept);
  const departments = [...new Set(members.map(m => m.department))];

  const STATE = {
    in: { label: 'Working', tone: 'success' },
    out: { label: 'Checked out', tone: 'neutral' },
    leave: { label: 'On leave', tone: 'primary' },
    absent: { label: 'Not checked in', tone: 'danger' },
  };

  return (
    <div>
      <PageHeader title="Check-in & Check-out" subtitle="Live attendance for the whole team — check in, take breaks and see who is working right now." />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 mb-6">
        {/* Punch card */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-lg" style={{ background: 'var(--gradient-hero)' }}>
          <span className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primrose/10 blur-2xl" aria-hidden="true" />
          <span className="absolute right-10 bottom-[-70px] w-56 h-56 rounded-full border-[18px] border-white/5" aria-hidden="true" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-primrose/90 text-sm font-semibold flex items-center gap-1.5"><Sparkles size={15} /> {greeting}, {me.split(' ')[0]}</p>
              <p className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight mt-2 tabular-nums" aria-live="off">
                {format(now, 'hh:mm')}<span className="text-primrose">:{format(now, 'ss')}</span>
                <span className="text-xl font-bold text-white/60 ml-2">{format(now, 'a')}</span>
              </p>
              <p className="text-white/70 text-sm mt-1">{format(now, 'EEEE, d MMMM yyyy')}</p>

              <div className="mt-5 text-sm">
                {!mine && <p className="text-white/80">You haven’t checked in yet today.</p>}
                {mine && !mine.checkOut && (
                  <p className="text-white/90">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle ${onBreak ? 'bg-accent' : 'bg-success-400 animate-pulse'}`} />
                    {onBreak ? 'On a break' : 'Working'} · checked in at <b>{to12(mine.checkIn)}</b> · {mine.mode}
                  </p>
                )}
                {mine?.checkOut && (
                  <p className="text-white/90">Day complete · {to12(mine.checkIn)} → {to12(mine.checkOut)}</p>
                )}
              </div>

              {!mine && (
                <div className="flex flex-wrap gap-2 mt-4" role="radiogroup" aria-label="Work location">
                  {MODES.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={mode === m.id}
                      onClick={() => setMode(m.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${mode === m.id ? 'bg-primrose text-primary-ink' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    >
                      <m.icon size={13} /> {m.id}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-5">
                {!mine && (
                  <button type="button" onClick={checkIn} className="btn-primary !px-6 !py-3 !text-base !rounded-xl animate-pulse-glow">
                    <LogIn size={18} /> Check In
                  </button>
                )}
                {mine && !mine.checkOut && (
                  <>
                    <button type="button" onClick={checkOut} className="btn !px-6 !py-3 !text-base !rounded-xl bg-white text-teal-900 hover:bg-primrose">
                      <LogOut size={18} /> Check Out
                    </button>
                    <button type="button" onClick={toggleBreak} className="btn !px-5 !py-3 !rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20">
                      {onBreak ? <><Play size={16} /> End break</> : <><Coffee size={16} /> Take a break</>}
                    </button>
                  </>
                )}
                {mine?.checkOut && (
                  <button type="button" onClick={undoCheckOut} className="btn !py-2.5 !rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20">
                    <TimerReset size={16} /> Undo check-out
                  </button>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
              <ProgressRing value={(worked / TARGET_MIN) * 100} size={150} stroke={12} color="#F2E6A2" track="rgb(255 255 255 / 0.12)">
                <span>
                  <span className="block text-2xl font-extrabold tabular-nums">{fmtDur(worked)}</span>
                  <span className="block text-[11px] uppercase tracking-wider text-white/60">of 8h target</span>
                </span>
              </ProgressRing>
              {mine?.breaks?.length > 0 && <p className="text-xs text-white/60">{mine.breaks.length} break{mine.breaks.length > 1 ? 's' : ''} today</p>}
            </div>
          </div>
        </section>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 content-start">
          <MiniStat icon={Users} label="Present today" value={`${present}/${members.length}`} hint={`${Math.round((present / members.length) * 100)}% attendance`} tone="teal" />
          <MiniStat icon={AlarmClock} label="Late arrivals" value={late} hint={`After ${to12(LATE_AFTER)}`} tone="orange" />
          <MiniStat icon={Plane} label="On leave" value={onLeave} hint="Approved leave today" tone="primrose" />
          <MiniStat icon={Clock} label="Avg. day this week" value={fmtDur(avgHours)} hint={`${missing} not checked in yet`} tone="bright" />
          <div className="col-span-2 card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Who’s working right now</p>
            <div className="flex flex-wrap gap-2">
              {roster.filter(r => r.state === 'in').map(r => (
                <span key={r.name} className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-success-50 ring-1 ring-success/20">
                  <MemberAvatar name={r.name} size="xs" />
                  <span className="text-xs font-semibold text-gray-800">{r.name.split(' ').slice(0, 2).join(' ')}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
                </span>
              ))}
              {roster.every(r => r.state !== 'in') && <p className="text-sm text-gray-500">Nobody is checked in right now.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6">
        {/* Roster */}
        <section className="card overflow-hidden">
          <div className="card-header gap-3 flex-wrap">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Today’s roster</h2>
              <p className="text-xs text-gray-500">{format(now, 'EEEE, d MMM')} · updates live</p>
            </div>
            <select className="form-select !w-auto text-sm" value={dept} onChange={e => setDept(e.target.value)} aria-label="Filter by department">
              <option value="all">All departments</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead className="bg-gray-50 text-left text-xs text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-bold">Member</th>
                  <th className="px-3 py-3 font-bold">Check-in</th>
                  <th className="px-3 py-3 font-bold">Check-out</th>
                  <th className="px-3 py-3 font-bold">Worked</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map(r => (
                  <tr key={r.name} className={`border-t border-[color:var(--border-subtle)] ${r.name === me ? 'bg-primary-50/60' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={r.name} size="sm" status={r.state === 'in' ? 'bg-success-400' : r.state === 'leave' ? 'bg-primrose-500' : undefined} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 whitespace-nowrap">{r.name}{r.name === me && <span className="text-brand"> (you)</span>}</p>
                          <DeptChip dept={r.department || departmentOf(r.name) || 'Management'} className="mt-0.5 !text-[10.5px]" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {r.rec ? <span className={r.late ? 'text-accent-700 font-semibold' : 'text-gray-700'}>{to12(r.rec.checkIn)}</span> : <span className="text-gray-400">—</span>}
                      {r.late && <Pill tone="warning" className="ml-2">Late</Pill>}
                      {r.rec?.mode && r.rec.mode !== 'Office' && <span className="block text-[11px] text-gray-500">{r.rec.mode}</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{r.rec?.checkOut ? to12(r.rec.checkOut) : <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 w-40">
                      {r.rec ? (
                        <div>
                          <p className="font-semibold text-gray-800 tabular-nums">{fmtDur(r.minutes)}</p>
                          <div className="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${r.minutes >= TARGET_MIN ? 'bg-success-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(100, (r.minutes / TARGET_MIN) * 100)}%` }} />
                          </div>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3"><Pill tone={STATE[r.state].tone} dot>{STATE[r.state].label}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Weekly heat map */}
        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-900">Last 7 working days</h2>
          <p className="text-xs text-gray-500 mb-4">Hover a square for times and hours.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr>
                  <th />
                  {days.map(d => (
                    <th key={d.toISOString()} className={`text-[10.5px] font-bold pb-2 ${format(d, 'yyyy-MM-dd') === todayKey ? 'text-brand' : 'text-gray-500'}`}>
                      {format(d, 'EEE')}<span className="block font-medium">{format(d, 'd')}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.name}>
                    <td className="pr-3 py-1"><span className="flex items-center gap-2"><MemberAvatar name={m.name} size="xs" /><span className="text-xs font-medium text-gray-700 truncate max-w-[110px]">{m.name.split(' ').slice(0, 2).join(' ')}</span></span></td>
                    {days.map(d => {
                      const key = format(d, 'yyyy-MM-dd');
                      const rec = records.find(r => r.member === m.name && r.date === key);
                      const lv = leaves.some(l => l.member === m.name && l.status === 'Approved' && l.from <= key && l.to >= key);
                      const live = rec && !rec.checkOut && key === todayKey;
                      const cls = rec ? (live ? 'bg-teal-500 animate-pulse' : rec.checkIn > LATE_AFTER ? 'bg-accent' : 'bg-teal-800') : lv ? 'bg-primrose' : 'bg-gray-100';
                      const tip = rec ? `${to12(rec.checkIn)} → ${rec.checkOut ? to12(rec.checkOut) : 'now'} · ${fmtDur(workedMinutes(rec, now))}` : lv ? 'On leave' : 'No record';
                      return (
                        <td key={key} className="p-1 text-center">
                          <span title={`${m.name} · ${format(d, 'EEE d MMM')}: ${tip}`} className={`block mx-auto w-7 h-7 rounded-md ${cls} transition-transform hover:scale-110`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-[11.5px] text-gray-600">
            {[['bg-teal-800', 'On time'], ['bg-accent', 'Late'], ['bg-teal-500', 'Working now'], ['bg-primrose', 'Leave'], ['bg-gray-100', 'Absent']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${c}`} />{l}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
