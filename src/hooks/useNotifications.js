import { useMemo, useCallback } from 'react';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import useLocalStorage from './useLocalStorage';
import useCollection from './useCollection';
import { AUDIT_LOG_KEY, NOTIFICATION_STATE_KEY, ACTION_LABELS } from '../lib/auditLog';
import { useSettings } from '../lib/settings';

const toDate = (s) => {
  if (!s) return null;
  const d = parseISO(String(s).slice(0, 10));
  return isValid(d) ? d : null;
};

/**
 * Notifications are derived, never invented:
 *  - record changes come from the audit log (real edits made in this browser);
 *  - deadline alerts come from task due dates and quotation expiry dates.
 */
export default function useNotifications() {
  const [log] = useLocalStorage(AUDIT_LOG_KEY, []);
  const [state, setState] = useLocalStorage(NOTIFICATION_STATE_KEY, { readIds: [] });
  const [tasks] = useCollection('tasks');
  const [quotations] = useCollection('quotations');
  const [settings] = useSettings();
  const prefs = settings.notifications;

  const items = useMemo(() => {
    const today = new Date();
    const list = [];

    if (prefs.deadlines) {
      tasks.forEach(t => {
        const due = toDate(t.dueDate);
        if (!due || t.status === 'Completed') return;
        const days = differenceInCalendarDays(due, today);
        if (days < 0) {
          list.push({ id: `task-overdue:${t.id}:${t.dueDate}`, kind: 'danger', title: `Task overdue: ${t.title}`, detail: `${Math.abs(days)} day(s) past due · ${t.assignedTo || 'Unassigned'}`, at: due.toISOString(), to: `/projects/tasks?q=${encodeURIComponent(t.title)}` });
        } else if (days <= 3) {
          list.push({ id: `task-due:${t.id}:${t.dueDate}`, kind: 'warning', title: `Task due ${days === 0 ? 'today' : `in ${days} day(s)`}: ${t.title}`, detail: t.project, at: today.toISOString(), to: `/projects/tasks?q=${encodeURIComponent(t.title)}` });
        }
      });
    }

    if (prefs.quotationExpiry) {
      quotations.forEach(q => {
        const exp = toDate(q.expiryDate);
        if (!exp || q.status !== 'Sent') return;
        const days = differenceInCalendarDays(exp, today);
        if (days <= 7) {
          list.push({ id: `quote-exp:${q.id}:${q.expiryDate}`, kind: days < 0 ? 'danger' : 'warning', title: days < 0 ? `Quotation expired: ${q.quoteNumber}` : `Quotation expires in ${days} day(s): ${q.quoteNumber}`, detail: q.customer, at: exp.toISOString(), to: `/sales-analytics/quotations?q=${encodeURIComponent(q.quoteNumber)}` });
        }
      });
    }

    if (prefs.recordChanges) {
      (Array.isArray(log) ? log : []).slice(0, 30).forEach(e => {
        list.push({
          id: e.id,
          kind: e.action === 'deleted' ? 'danger' : e.action === 'created' || e.action === 'imported' ? 'success' : 'info',
          title: `${ACTION_LABELS[e.action] || e.action} ${e.entityLabel?.toLowerCase() || 'record'}${e.recordName ? `: ${e.recordName}` : ''}`,
          detail: [e.details, e.actor].filter(Boolean).join(' · '),
          at: e.at,
          to: e.path ? (e.recordName ? `${e.path}?q=${encodeURIComponent(e.recordName)}` : e.path) : '/audit-log',
        });
      });
    }

    return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }, [log, tasks, quotations, prefs.deadlines, prefs.quotationExpiry, prefs.recordChanges]);

  const readIds = useMemo(() => new Set(state?.readIds || []), [state]);
  const withRead = useMemo(() => items.map(i => ({ ...i, read: readIds.has(i.id) })), [items, readIds]);
  const unreadCount = withRead.filter(i => !i.read).length;

  const markRead = useCallback((id) => {
    setState(prev => ({ readIds: Array.from(new Set([...(prev?.readIds || []), id])).slice(-1000) }));
  }, [setState]);

  const markAllRead = useCallback(() => {
    setState(prev => ({ readIds: Array.from(new Set([...(prev?.readIds || []), ...items.map(i => i.id)])).slice(-1000) }));
  }, [setState, items]);

  return { items: withRead, unreadCount, markRead, markAllRead };
}
