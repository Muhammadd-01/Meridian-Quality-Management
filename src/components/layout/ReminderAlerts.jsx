import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BellRing, Check, AlarmClock, X } from 'lucide-react';
import useCollection from '../../hooks/useCollection';
import { useSettings } from '../../lib/settings';
import { completeReminder, playChime, snoozeReminder, useReminderPrefs } from '../../lib/reminders';

const CHECK_EVERY_MS = 15000;

/**
 * Global pop-up alerts for in-app reminders. Mounted once in AppLayout, so a
 * reminder rings on whatever page the user is on.
 */
export default function ReminderAlerts() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useCollection('reminders');
  const [{ profile }] = useSettings();
  const [prefs] = useReminderPrefs();
  const [alerts, setAlerts] = useState([]);
  const latest = useRef(reminders);
  latest.current = reminders;

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const due = latest.current.filter(r => !r.done && !r.notified && r.assignee === profile.name && new Date(r.remindAt) <= now);
      if (!due.length) return;
      const ids = new Set(due.map(r => r.id));
      setReminders(prev => prev.map(r => (ids.has(r.id) ? { ...r, notified: true } : r)));
      setAlerts(prev => [...prev.filter(a => !ids.has(a.id)), ...due].slice(-4));
      if (prefs.sound) playChime();
      if (prefs.browser && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        due.forEach(r => { try { new Notification(`⏰ ${r.title}`, { body: r.note || 'Meridian reminder', tag: r.id }); } catch { /* ignore */ } });
      }
    };
    check();
    const t = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(t);
  }, [profile.name, prefs.sound, prefs.browser, setReminders]);

  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));
  const act = (alert, fn) => {
    setReminders(prev => prev.map(r => (r.id === alert.id ? fn(r) : r)));
    dismiss(alert.id);
  };

  if (!alerts.length) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] space-y-3" role="region" aria-label="Reminders" aria-live="assertive">
      {alerts.map(a => (
        <div key={a.id} className="relative overflow-hidden rounded-2xl shadow-xl text-white animate-slide-up" style={{ background: 'var(--gradient-hero)' }}>
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--gradient-underline)' }} aria-hidden="true" />
          <div className="p-4 flex gap-3">
            <span className="w-11 h-11 rounded-xl bg-primrose text-primary-ink grid place-items-center shrink-0 shadow-glow-primary">
              <BellRing size={20} className="animate-ring" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-primrose">Reminder · {format(new Date(a.remindAt), 'h:mm a')}</p>
              <p className="font-bold leading-snug mt-0.5">{a.title}</p>
              {a.note && <p className="text-xs text-white/70 mt-1">{a.note}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" onClick={() => act(a, completeReminder)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primrose text-primary-ink text-xs font-bold hover:brightness-105"><Check size={13} /> Done</button>
                <button type="button" onClick={() => act(a, r => snoozeReminder(r, 10))} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"><AlarmClock size={13} /> Snooze 10 min</button>
                <button type="button" onClick={() => { dismiss(a.id); navigate('/team/reminders'); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10">Open</button>
              </div>
            </div>
            <button type="button" onClick={() => dismiss(a.id)} className="self-start p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10" aria-label="Dismiss reminder"><X size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
