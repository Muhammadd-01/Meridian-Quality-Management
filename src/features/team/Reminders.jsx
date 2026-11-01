import React, { useMemo, useRef, useState } from 'react';
import {
  addDays, addHours, addMinutes, format, formatDistanceToNowStrict, isToday, isTomorrow, nextMonday, setHours, setMinutes, startOfMinute,
} from 'date-fns';
import {
  BellRing, Plus, Check, AlarmClock, Trash2, Repeat, Volume2, VolumeX, MonitorSmartphone, Sparkles, BellOff, CalendarClock, CircleCheckBig,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import useCollection from '../../hooks/useCollection';
import useQuickAction from '../../hooks/useQuickAction';
import { completeReminder, playChime, snoozeReminder, useReminderPrefs } from '../../lib/reminders';
import { generateId } from '../../utils/format';
import { MemberAvatar, Pill, MiniStat, usePopover, useTeamMembers, useNow } from './teamUi';

const localInput = (d) => format(d, "yyyy-MM-dd'T'HH:mm");
const at = (d, h, m = 0) => setMinutes(setHours(d, h), m);

const QUICK = [
  { label: 'In 10 min', get: () => addMinutes(new Date(), 10) },
  { label: 'In 1 hour', get: () => addHours(new Date(), 1) },
  { label: 'This evening', get: () => at(new Date(), 18) },
  { label: 'Tomorrow 9 AM', get: () => at(addDays(new Date(), 1), 9) },
  { label: 'Next Monday', get: () => at(nextMonday(new Date()), 9) },
];

const whenLabel = (iso, now) => {
  const d = new Date(iso);
  if (d <= now) return `${formatDistanceToNowStrict(d)} ago`;
  if (isToday(d)) return `Today · ${format(d, 'h:mm a')} (in ${formatDistanceToNowStrict(d)})`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, 'h:mm a')}`;
  return format(d, 'EEE d MMM · h:mm a');
};

export default function Reminders() {
  const addToast = useToast();
  const now = useNow(30000);
  const { members, me } = useTeamMembers();
  const [reminders, setReminders] = useCollection('reminders');
  const [prefs, setPrefs] = useReminderPrefs();
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(() => localInput(startOfMinute(addHours(new Date(), 1))));
  const [repeat, setRepeat] = useState('none');
  const [assignee, setAssignee] = useState(me);
  const [note, setNote] = useState('');
  const [menu, setMenu, menuRef] = usePopover();
  const [showDone, setShowDone] = useState(false);
  const inputRef = useRef(null);

  useQuickAction('new', () => inputRef.current?.focus());

  const groups = useMemo(() => {
    const open = reminders.filter(r => !r.done).sort((a, b) => a.remindAt.localeCompare(b.remindAt));
    return {
      due: open.filter(r => new Date(r.remindAt) <= now),
      today: open.filter(r => new Date(r.remindAt) > now && isToday(new Date(r.remindAt))),
      later: open.filter(r => new Date(r.remindAt) > now && !isToday(new Date(r.remindAt))),
      done: reminders.filter(r => r.done).sort((a, b) => (b.completedAt || b.remindAt).localeCompare(a.completedAt || a.remindAt)),
    };
  }, [reminders, now]);

  const add = (e) => {
    e.preventDefault();
    if (!title.trim() || !when) return;
    const r = {
      id: `rem-${generateId()}`, title: title.trim(), remindAt: new Date(when).toISOString(), repeat, note: note.trim(), assignee,
      done: false, notified: false, createdAt: new Date().toISOString(),
    };
    setReminders(prev => [...prev, r]);
    setTitle('');
    setNote('');
    addToast(`Reminder set for ${whenLabel(r.remindAt, new Date())}${assignee !== me ? ` for ${assignee}` : ''}.`, 'success');
  };

  const update = (r, fn, msg) => {
    setReminders(prev => prev.map(x => (x.id === r.id ? fn(x) : x)));
    setMenu(null);
    if (msg) addToast(msg, 'success');
  };

  const remove = (r) => {
    setReminders(prev => prev.filter(x => x.id !== r.id));
    addToast('Reminder deleted.', 'success');
  };

  const toggleBrowser = async () => {
    if (prefs.browser) { setPrefs(p => ({ ...p, browser: false })); return; }
    if (typeof Notification === 'undefined') { addToast('This browser does not support desktop notifications.', 'error'); return; }
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm === 'granted') {
      setPrefs(p => ({ ...p, browser: true }));
      addToast('Desktop notifications are on.', 'success');
    } else {
      addToast('Notifications were blocked in the browser settings.', 'error');
    }
  };

  const Section = ({ id, title: heading, icon: Icon, tone, items, empty }) => (
    <section aria-labelledby={`rem-${id}`}>
      <h2 id={`rem-${id}`} className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 mb-3">
        <Icon size={14} className={tone} /> {heading} <span className="text-gray-400">· {items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 px-4 py-5 rounded-xl border-2 border-dashed border-[color:var(--border-subtle)] text-center">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map(r => {
            const overdue = id === 'due';
            return (
              <li key={r.id} className={`card p-4 flex items-start gap-3.5 hover:-translate-y-0.5 ${overdue ? '!border-accent/50 bg-accent-50' : ''}`}>
                <button
                  type="button"
                  onClick={() => update(r, completeReminder, r.repeat !== 'none' ? `Done — next one scheduled (${r.repeat}).` : 'Reminder completed.')}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 grid place-items-center shrink-0 transition-colors ${r.done ? 'bg-success-500 border-success-500 text-white' : 'border-[color:var(--border-strong)] hover:border-success-500 hover:bg-success-50 text-transparent hover:text-success-600'}`}
                  aria-label={`Complete ${r.title}`}
                  disabled={r.done}
                >
                  <Check size={13} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] font-semibold ${r.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{r.title}</p>
                  {r.note && <p className="text-xs text-gray-500 mt-0.5">{r.note}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${overdue ? 'text-accent-700' : 'text-gray-600'}`}>
                      {overdue ? <BellRing size={12} className="animate-ring" /> : <AlarmClock size={12} />} {r.done ? `Done ${r.completedAt ? format(new Date(r.completedAt), 'd MMM, h:mm a') : ''}` : whenLabel(r.remindAt, now)}
                    </span>
                    {r.repeat !== 'none' && <Pill tone="info"><Repeat size={10} /> {r.repeat}</Pill>}
                    {r.assignee !== me && <span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><MemberAvatar name={r.assignee} size="xs" /> {r.assignee}</span>}
                  </div>
                </div>
                {!r.done && (
                  <div className="relative" ref={menu === r.id ? menuRef : undefined}>
                    <button type="button" onClick={() => setMenu(menu === r.id ? null : r.id)} className="btn-outline btn-xs !py-1.5 !px-2.5" aria-expanded={menu === r.id}><AlarmClock size={13} /> Snooze</button>
                    {menu === r.id && (
                      <div className="menu-panel absolute right-0 top-9 z-30 w-44 p-1.5" role="menu">
                        {[[10, '10 minutes'], [60, '1 hour'], [60 * 24, 'Tomorrow']].map(([m, l]) => (
                          <button key={m} type="button" role="menuitem" className="menu-item" onClick={() => update(r, x => snoozeReminder(x, m), `Snoozed for ${l}.`)}>{l}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button type="button" onClick={() => remove(r)} className="p-1.5 rounded-md text-gray-400 hover:text-danger hover:bg-danger-50" aria-label={`Delete ${r.title}`}><Trash2 size={15} /></button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div>
      <PageHeader title="Reminders" subtitle="Set in-app reminders for yourself or a teammate — they pop up on any page, with sound and snooze." />

      {/* Quick add */}
      <form onSubmit={add} className="relative overflow-hidden rounded-3xl p-5 sm:p-7 mb-6 text-white shadow-lg" style={{ background: 'var(--gradient-hero)' }}>
        <span className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-primrose/10 blur-2xl" aria-hidden="true" />
        <p className="relative text-primrose text-sm font-semibold flex items-center gap-1.5 mb-3"><Sparkles size={15} /> Remind me to…</p>
        <div className="relative flex flex-col lg:flex-row gap-3">
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Call Ayesha about the GMP findings"
            className="flex-1 min-w-0 rounded-xl bg-white/95 text-gray-900 placeholder:text-gray-500 px-4 py-3 text-[15px] font-medium outline-none focus:ring-4 focus:ring-primrose/50"
            style={{ color: '#102C32' }}
            aria-label="Reminder"
          />
          <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="rounded-xl bg-white/95 px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-primrose/50" style={{ color: '#102C32' }} aria-label="Remind at" />
          <button type="submit" disabled={!title.trim()} className="btn-primary !rounded-xl !px-6 !py-3"><Plus size={17} /> Add reminder</button>
        </div>
        <div className="relative flex flex-wrap items-center gap-2 mt-3">
          {QUICK.map(q => (
            <button key={q.label} type="button" onClick={() => setWhen(localInput(startOfMinute(q.get())))} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors">{q.label}</button>
          ))}
          <span className="hidden sm:block w-px h-5 bg-white/20 mx-1" />
          <select value={repeat} onChange={e => setRepeat(e.target.value)} className="rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold px-3 py-1.5 outline-none [&>option]:text-gray-900" aria-label="Repeat">
            <option value="none">Does not repeat</option>
            <option value="daily">Repeat daily</option>
            <option value="weekly">Repeat weekly</option>
          </select>
          <select value={assignee} onChange={e => setAssignee(e.target.value)} className="rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold px-3 py-1.5 outline-none [&>option]:text-gray-900" aria-label="Remind who">
            {members.map(m => <option key={m.name} value={m.name}>{m.name === me ? 'For me' : `For ${m.name}`}</option>)}
          </select>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" className="flex-1 min-w-[160px] rounded-full bg-white/10 placeholder:text-white/50 text-xs px-3 py-1.5 outline-none focus:bg-white/20" aria-label="Note" />
        </div>
      </form>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-7 min-w-0">
          <Section id="due" title="Due now" icon={BellRing} tone="text-accent" items={groups.due} empty="Nothing due right now. 🎉" />
          <Section id="today" title="Later today" icon={AlarmClock} tone="text-brand" items={groups.today} empty="No more reminders today." />
          <Section id="later" title="Upcoming" icon={CalendarClock} tone="text-brand" items={groups.later} empty="Nothing scheduled ahead." />
          <div>
            <button type="button" onClick={() => setShowDone(s => !s)} className="text-xs font-bold text-brand hover:underline mb-3">
              {showDone ? 'Hide' : 'Show'} completed ({groups.done.length})
            </button>
            {showDone && <Section id="done" title="Completed" icon={CircleCheckBig} tone="text-success" items={groups.done} empty="No completed reminders yet." />}
          </div>
        </div>

        <aside className="space-y-4">
          <MiniStat icon={BellRing} label="Due now" value={groups.due.length} hint="Waiting for you" tone="orange" />
          <MiniStat icon={AlarmClock} label="Scheduled" value={groups.today.length + groups.later.length} hint={`${groups.today.length} later today`} tone="teal" />
          <section className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Alert settings</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="w-9 h-9 rounded-lg grid place-items-center bg-primary-100 text-brand-strong">{prefs.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</span>
              <span className="flex-1"><span className="block text-sm font-semibold text-gray-900">Chime sound</span><span className="block text-xs text-gray-500">Play a soft chime when one is due</span></span>
              <input type="checkbox" className="w-4 h-4 accent-[#145D68]" checked={prefs.sound} onChange={e => setPrefs(p => ({ ...p, sound: e.target.checked }))} />
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="w-9 h-9 rounded-lg grid place-items-center bg-primary-100 text-brand-strong">{prefs.browser ? <MonitorSmartphone size={17} /> : <BellOff size={17} />}</span>
              <span className="flex-1"><span className="block text-sm font-semibold text-gray-900">Desktop notifications</span><span className="block text-xs text-gray-500">Also notify outside this tab</span></span>
              <input type="checkbox" className="w-4 h-4 accent-[#145D68]" checked={prefs.browser} onChange={toggleBrowser} />
            </label>
            <button type="button" className="btn-outline btn-sm w-full" onClick={() => { playChime(); addToast('That’s how a reminder sounds 🔔', 'info'); }}>
              <Volume2 size={14} /> Test sound
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
