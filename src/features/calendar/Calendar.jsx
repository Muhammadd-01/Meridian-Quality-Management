import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, parseISO, isValid,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import useCollection from '../../hooks/useCollection';
import useQuickAction from '../../hooks/useQuickAction';
import { generateId } from '../../utils/format';

const SOURCES = {
  event: { label: 'Events', dot: 'bg-primary-500', chip: 'bg-primary-100 text-brand-strong' },
  task: { label: 'Task due dates', dot: 'bg-info', chip: 'bg-info-50 text-info-600' },
  activity: { label: 'CRM activities', dot: 'bg-accent', chip: 'bg-accent-50 text-accent-600' },
  deal: { label: 'Deal close dates', dot: 'bg-success', chip: 'bg-success-50 text-success-600' },
  quote: { label: 'Quotation expiry', dot: 'bg-danger', chip: 'bg-danger-50 text-danger-600' },
  project: { label: 'Project deadlines', dot: 'bg-secondary-500', chip: 'bg-secondary-100 text-secondary-600' },
};

const EVENT_TYPES = ['Meeting', 'Audit', 'Training', 'Reminder', 'Deadline', 'Other'];

const dayKey = (value) => {
  if (!value) return null;
  const d = parseISO(String(value).slice(0, 10));
  return isValid(d) ? format(d, 'yyyy-MM-dd') : null;
};

const emptyForm = (date) => ({ title: '', type: 'Meeting', date: date || format(new Date(), 'yyyy-MM-dd'), time: '', relatedTo: '', notes: '' });

export default function Calendar() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [events, setEvents] = useCollection('calendarEvents');
  const [tasks] = useCollection('tasks');
  const [activities] = useCollection('activities');
  const [deals] = useCollection('deals');
  const [quotations] = useCollection('quotations');
  const [projects] = useCollection('projects');
  const [companies] = useCollection('companies');

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [enabled, setEnabled] = useState(() => Object.fromEntries(Object.keys(SOURCES).map(k => [k, true])));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = (date) => {
    setForm(emptyForm(date || selectedDay));
    setFormError('');
    setModalOpen(true);
  };
  useQuickAction('new', () => openCreate());

  // Every item links back to its source record.
  const items = useMemo(() => {
    const list = [];
    events.forEach(e => list.push({ id: `event:${e.id}`, source: 'event', date: dayKey(e.date), title: e.title, meta: [e.type, e.time, e.relatedTo].filter(Boolean).join(' · '), record: e }));
    tasks.forEach(t => list.push({ id: `task:${t.id}`, source: 'task', date: dayKey(t.dueDate), title: t.title, meta: `${t.status} · ${t.assignedTo}`, to: `/projects/tasks?q=${encodeURIComponent(t.title)}` }));
    activities.forEach(a => list.push({ id: `act:${a.id}`, source: 'activity', date: dayKey(a.dateTime), title: a.title, meta: `${a.type} · ${String(a.dateTime).slice(11)} · ${a.company}`, to: `/crm/activities?q=${encodeURIComponent(a.title)}` }));
    deals.filter(d => !String(d.stage).startsWith('Closed')).forEach(d => list.push({ id: `deal:${d.id}`, source: 'deal', date: dayKey(d.expectedClose), title: d.name, meta: `${d.stage} · expected close`, to: `/sales-analytics/deals?q=${encodeURIComponent(d.name)}` }));
    quotations.filter(q => ['Sent', 'Draft'].includes(q.status)).forEach(q => list.push({ id: `quote:${q.id}`, source: 'quote', date: dayKey(q.expiryDate), title: `${q.quoteNumber} expires`, meta: q.customer, to: `/sales-analytics/quotations?q=${encodeURIComponent(q.quoteNumber)}` }));
    projects.filter(p => p.status !== 'Completed').forEach(p => list.push({ id: `proj:${p.id}`, source: 'project', date: dayKey(p.dueDate), title: `${p.name} due`, meta: p.company || p.client, to: `/projects?q=${encodeURIComponent(p.name)}` }));
    return list.filter(i => i.date && enabled[i.source]);
  }, [events, tasks, activities, deals, quotations, projects, enabled]);

  const byDay = useMemo(() => {
    const map = new Map();
    items.forEach(i => map.set(i.date, [...(map.get(i.date) || []), i]));
    return map;
  }, [items]);

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const selectedItems = byDay.get(selectedDay) || [];

  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.date) { setFormError('Date is required.'); return; }
    setEvents(prev => [...prev, { ...form, title: form.title.trim(), id: `evt-${generateId()}`, createdAt: new Date().toISOString() }]);
    setModalOpen(false);
    setSelectedDay(form.date);
    setMonth(startOfMonth(parseISO(form.date)));
    addToast('Event added to the calendar.', 'success');
  };

  const confirmDelete = () => {
    setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
    setDeleteTarget(null);
    addToast('Event deleted.', 'success');
  };

  const openItem = (item) => {
    if (item.to) navigate(item.to);
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Meetings, deadlines and follow-ups from every module in one schedule."
        breadcrumbs={[{ label: 'Workspace' }, { label: 'Calendar' }]}
        actions={<button type="button" className="btn-primary" onClick={() => openCreate()}><Plus size={16} aria-hidden="true" /> New Event</button>}
      />

      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Calendar sources">
        {Object.entries(SOURCES).map(([key, s]) => (
          <label key={key} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-colors ${enabled[key] ? 'border-gray-300 bg-white text-gray-700' : 'border-transparent bg-gray-100 text-gray-400'}`}>
            <input type="checkbox" className="sr-only" checked={enabled[key]} onChange={(e) => setEnabled(en => ({ ...en, [key]: e.target.checked }))} />
            <span className={`w-2 h-2 rounded-full ${enabled[key] ? s.dot : 'bg-gray-300'}`} aria-hidden="true" />
            {s.label}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="card xl:col-span-2" aria-label="Month view">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-800" aria-live="polite">{format(month, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1">
              <button type="button" className="btn-outline btn-sm !px-2" onClick={() => setMonth(m => subMonths(m, 1))} aria-label="Previous month"><ChevronLeft size={14} /></button>
              <button type="button" className="btn-outline btn-sm" onClick={() => { setMonth(startOfMonth(new Date())); setSelectedDay(format(new Date(), 'yyyy-MM-dd')); }}>Today</button>
              <button type="button" className="btn-outline btn-sm !px-2" onClick={() => setMonth(m => addMonths(m, 1))} aria-label="Next month"><ChevronRight size={14} /></button>
            </div>
          </div>
          <div className="p-2 sm:p-3">
            <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1" aria-hidden="true">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const dayItems = byDay.get(key) || [];
                const selected = key === selectedDay;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    onDoubleClick={() => openCreate(key)}
                    aria-pressed={selected}
                    aria-label={`${format(day, 'EEEE, MMMM d')}: ${dayItems.length} item${dayItems.length === 1 ? '' : 's'}`}
                    className={`min-h-[64px] sm:min-h-[92px] rounded-lg border p-1.5 text-left flex flex-col transition-colors ${
                      selected ? 'border-primary-400 bg-primary-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    } ${isSameMonth(day, month) ? '' : 'opacity-45'}`}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 grid place-items-center rounded-full ${isToday(day) ? 'bg-primrose-fill ring-1 ring-primary-400' : 'text-gray-700'}`}>{format(day, 'd')}</span>
                    <span className="hidden sm:flex flex-col gap-0.5 mt-1 w-full">
                      {dayItems.slice(0, 2).map(i => (
                        <span key={i.id} className={`truncate text-[10px] px-1.5 py-0.5 rounded ${SOURCES[i.source].chip}`}>{i.title}</span>
                      ))}
                      {dayItems.length > 2 && <span className="text-[10px] text-gray-500 px-1">+{dayItems.length - 2} more</span>}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="sm:hidden flex gap-0.5 mt-auto flex-wrap" aria-hidden="true">
                        {dayItems.slice(0, 4).map(i => <span key={i.id} className={`w-1.5 h-1.5 rounded-full ${SOURCES[i.source].dot}`} />)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 px-1">Tip: double-click a day to schedule an event.</p>
          </div>
        </section>

        <section className="card" aria-labelledby="agenda-title">
          <div className="card-header">
            <h2 id="agenda-title" className="text-sm font-semibold text-gray-800">{format(parseISO(selectedDay), 'EEEE, MMM d')}</h2>
            <button type="button" className="btn-outline btn-sm" onClick={() => openCreate(selectedDay)}><Plus size={13} aria-hidden="true" /> Add</button>
          </div>
          <div className="p-3">
            {selectedItems.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays size={24} className="mx-auto text-gray-300 mb-2" aria-hidden="true" />
                <p className="text-sm text-gray-500">Nothing scheduled.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedItems.map(i => (
                  <li key={i.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SOURCES[i.source].dot}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      {i.to ? (
                        <button type="button" onClick={() => openItem(i)} className="text-sm font-medium text-gray-800 hover:text-brand text-left">{i.title}</button>
                      ) : (
                        <p className="text-sm font-medium text-gray-800">{i.title}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate">{SOURCES[i.source].label} · {i.meta}</p>
                      {i.record?.notes && <p className="text-xs text-gray-500 mt-1">{i.record.notes}</p>}
                    </div>
                    {i.source === 'event' && (
                      <button type="button" onClick={() => setDeleteTarget(i.record)} className="p-1 text-gray-400 hover:text-danger rounded" aria-label={`Delete event ${i.title}`}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Event"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="event-form" className="btn-primary">Save Event</button>
          </>
        }
      >
        <form id="event-form" onSubmit={save} className="space-y-4" noValidate>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div>
            <label htmlFor="evt-title" className="form-label">Title *</label>
            <input id="evt-title" className="form-input" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Supplier audit debrief" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="evt-type" className="form-label">Type</label>
              <select id="evt-type" className="form-select" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="evt-date" className="form-label">Date *</label>
              <input id="evt-date" type="date" className="form-input" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="evt-time" className="form-label">Time</label>
              <input id="evt-time" type="time" className="form-input" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label htmlFor="evt-related" className="form-label">Related company or project</label>
            <select id="evt-related" className="form-select" value={form.relatedTo} onChange={(e) => setForm(f => ({ ...f, relatedTo: e.target.value }))}>
              <option value="">— None —</option>
              <optgroup label="Companies">{companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</optgroup>
              <optgroup label="Projects">{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <label htmlFor="evt-notes" className="form-label">Notes</label>
            <textarea id="evt-notes" rows={3} className="form-input" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete event"
        message={`Delete “${deleteTarget?.title}”? This cannot be undone.`}
      />
    </div>
  );
}
