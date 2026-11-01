/**
 * In-app reminder helpers shared by the Reminders page and the global
 * pop-up alerts (components/layout/ReminderAlerts.jsx).
 */
import { addDays, addMinutes } from 'date-fns';
import useLocalStorage from '../hooks/useLocalStorage';

export const REMINDER_PREFS_KEY = 'meridian-reminder-prefs';
const DEFAULT_PREFS = { sound: true, browser: false };

export function useReminderPrefs() {
  const [prefs, setPrefs] = useLocalStorage(REMINDER_PREFS_KEY, DEFAULT_PREFS);
  return [{ ...DEFAULT_PREFS, ...(prefs || {}) }, setPrefs];
}

/** Completing a repeating reminder schedules its next occurrence instead. */
export function completeReminder(r) {
  if (r.repeat === 'daily' || r.repeat === 'weekly') {
    let next = new Date(r.remindAt);
    const step = r.repeat === 'daily' ? 1 : 7;
    do { next = addDays(next, step); } while (next <= new Date());
    return { ...r, remindAt: next.toISOString(), notified: false };
  }
  return { ...r, done: true, notified: true, completedAt: new Date().toISOString() };
}

export function snoozeReminder(r, minutes) {
  return { ...r, remindAt: addMinutes(new Date(), minutes).toISOString(), notified: false, done: false };
}

/** Short two-tone chime using Web Audio (no audio files needed). */
export function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [[880, 0], [1320, 0.16]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {
    // Audio is a nicety; ignore browsers that block it.
  }
}
