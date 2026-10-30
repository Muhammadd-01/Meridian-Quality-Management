import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDays, addMonths, addWeeks, differenceInCalendarDays, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isToday, isValid, parseISO, startOfMonth, startOfWeek, subDays, subMonths, subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2, CalendarDays, GripVertical, Link2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import useCollection from '../../hooks/useCollection';
import useQuickAction from '../../hooks/useQuickAction';
import { generateId } from '../../utils/format';

// Event categories: the draggable list on the left and the event bar colours.
const TYPES = {
  Meeting: { label: 'Client Meeting', bar: 'bg-info-500 text-white', dot: 'bg-info-500' },
  Audit: { label: 'Audit', bar: 'bg-teal-800 text-primrose', dot: 'bg-teal-800' },
  Training: { label: 'Training Session', bar: 'bg-success-500 text-white', dot: 'bg-success-500' },
  Deadline: { label: 'Report Deadline', bar: 'bg-danger-500 text-white', dot: 'bg-danger-500' },
  Reminder: { label: 'Reminder', bar: 'bg-accent text-white', dot: 'bg-accent' },
  Other: { label: 'Other', bar: 'bg-primrose text-primary-ink', dot: 'bg-primrose-500' },
};
const typeOf = (type) => TYPES[type] || TYPES.Other;

// Records from other modules that can be overlaid on the calendar.
const SOURCES = {
  task: { label: 'Task due dates', dot: 'bg-info', chip: 'bg-info-50 text-info-600 ring-1 ring-inset ring-info/30' },
  activity: { label: 'CRM activities', dot: 'bg-accent', chip: 'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent/30' },
  deal: { label: 'Deal close dates', dot: 'bg-success', chip: 'bg-success-50 text-success-600 ring-1 ring-inset ring-success/30' },
  quote: { label: 'Quotation expiry', dot: 'bg-danger', chip: 'bg-danger-50 text-danger-600 ring-1 ring-inset ring-danger/30' },
  project: { label: 'Project deadlines', dot: 'bg-secondary-500', chip: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300' },
};

const VIEWS = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
  { id: 'list', label: 'List' },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_OPTS = { weekStartsOn: 1 };
const MAX_LANES = 3;
const HOUR_PX = 44;

const dayKey = (value) => {
  if (!value) return null;
  const d = parseISO(String(value).slice(0, 10));
  return isValid(d) ? format(d, 'yyyy-MM-dd') : null;
};
const keyOf = (date) => format(date, 'yyyy-MM-dd');
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
const fromMin = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const shortTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h >= 12 ? 'p' : 'a'}`;
};
const hourLabel = (h) => `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;

const emptyForm = (date, extra = {}) => ({
  title: '', type: 'Meeting', date: date || keyOf(new Date()), endDate: '', time: '', endTime: '', relatedTo: '', notes: '', ...extra,
});

/** Side-by-side columns for overlapping timed events in one day. */
function layoutDay(timed) {
  const sorted = [...timed].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const out = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = [];
    cluster.forEach(ev => {
      let c = cols.findIndex(end => end <= ev.startMin);
      if (c === -1) { c = cols.length; cols.push(0); }
      cols[c] = ev.endMin;
      ev.col = c;
    });
    cluster.forEach(ev => out.push({ ...ev, cols: cols.length }));
    cluster = [];
    clusterEnd = -1;
  };
  sorted.forEach(ev => {
    if (cluster.length && ev.startMin >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.endMin);
  });
  if (cluster.length) flush();
  return out;
}

/** Illustration under the category list, drawn in the palette. */
function PlannerIllustration() {
  return (
    <svg viewBox="0 0 260 190" className="w-full max-w-[240px] mx-auto" aria-hidden="true">
      <ellipse cx="62" cy="40" rx="34" ry="13" fill="rgb(var(--c-gray-100))" />
      <ellipse cx="208" cy="112" rx="34" ry="13" fill="rgb(var(--c-gray-100))" />
      <ellipse cx="130" cy="178" rx="96" ry="8" fill="rgb(var(--c-gray-200))" />
      <rect x="72" y="26" width="116" height="146" rx="10" fill="#1C7D86" opacity="0.18" />
      <rect x="78" y="32" width="104" height="134" rx="8" fill="var(--surface-raised)" stroke="#3B7A84" strokeWidth="2" />
      <rect x="108" y="22" width="44" height="16" rx="5" fill="#093F50" />
      {[62, 96, 130].map((y, i) => (
        <g key={y}>
          <rect x="92" y={y - 6} width="44" height="5" rx="2.5" fill="#9FBAB9" />
          <rect x="92" y={y + 4} width="30" height="4" rx="2" fill="rgb(var(--c-gray-200))" />
          <rect x="148" y={y - 9} width="20" height="20" rx="5" fill={i < 2 ? '#F2E6A2' : 'none'} stroke={i < 2 ? '#CDB64C' : '#9FBAB9'} strokeWidth="1.5" />
          {i < 2 && <path d={`M152 ${y + 1} l4 4 l8 -9`} fill="none" stroke="#093F50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      ))}
      <circle cx="196" cy="54" r="20" fill="#F78D00" />
      <rect x="186" y="46" width="20" height="17" rx="3" fill="#fff" />
      <rect x="186" y="46" width="20" height="5" rx="2" fill="#A45B0B" />
      <circle cx="196" cy="57.5" r="2.4" fill="#F78D00" />
      <circle cx="48" cy="140" r="16" fill="#F2E6A2" />
      <path d="M41 140 l5 5 l10 -11" fill="none" stroke="#093F50" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MonthView({ cursor, items, dragOver, dropHandlers, onDayClick, onItemClick, onMore, itemDragProps }) {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), WEEK_OPTS), end: endOfWeek(endOfMonth(cursor), WEEK_OPTS) });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-[color:var(--border-subtle)]">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-bold text-gray-700 border-r last:border-r-0 border-[color:var(--border-subtle)]">{d}</div>
        ))}
      </div>
      {weeks.map(week => {
        const wStart = keyOf(week[0]);
        const wEnd = keyOf(week[6]);
        const segs = items
          .filter(i => i.start <= wEnd && i.end >= wStart)
          .map(i => {
            const s = i.start < wStart ? wStart : i.start;
            const e = i.end > wEnd ? wEnd : i.end;
            return {
              item: i,
              col: differenceInCalendarDays(parseISO(s), week[0]),
              span: differenceInCalendarDays(parseISO(e), parseISO(s)) + 1,
              isStart: i.start >= wStart,
              isEnd: i.end <= wEnd,
            };
          })
          .sort((a, b) => a.col - b.col || b.span - a.span || (a.item.time || '99').localeCompare(b.item.time || '99'));

        // Greedy lane assignment so multi-day bars stay on one row.
        const laneEnds = [];
        const hidden = Array(7).fill(0);
        segs.forEach(seg => {
          let lane = laneEnds.findIndex(end => end < seg.col);
          if (lane === -1) { lane = laneEnds.length; laneEnds.push(-1); }
          laneEnds[lane] = seg.col + seg.span - 1;
          seg.lane = lane;
          if (lane >= MAX_LANES) for (let c = seg.col; c < seg.col + seg.span; c++) hidden[c] += 1;
        });

        return (
          <div
            key={wStart}
            className="grid grid-cols-7 border-b last:border-b-0 border-[color:var(--border-subtle)]"
            style={{ gridTemplateRows: `30px repeat(${MAX_LANES}, 24px) minmax(22px, 1fr)`, minHeight: 124 }}
          >
            {week.map((day, col) => {
              const key = keyOf(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${format(day, 'EEEE, MMMM d')} — add event`}
                  onClick={() => onDayClick(key)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onDayClick(key); }}
                  {...dropHandlers(key)}
                  style={{ gridColumn: col + 1, gridRow: '1 / -1' }}
                  className={`border-r last:border-r-0 border-[color:var(--border-subtle)] cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--focus-border)] ${
                    dragOver === key ? 'bg-primary-100' : isToday(day) ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`block text-right px-2 pt-1.5 text-[13px] ${inMonth ? 'text-gray-700' : 'text-gray-400'} ${isToday(day) ? 'font-extrabold !text-brand-strong' : 'font-medium'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}

            {segs.filter(s => s.lane < MAX_LANES).map(seg => (
              <button
                key={`${seg.item.id}-${wStart}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); onItemClick(seg.item); }}
                {...itemDragProps(seg.item)}
                style={{ gridColumn: `${seg.col + 1} / span ${seg.span}`, gridRow: seg.lane + 2 }}
                title={`${seg.item.time ? `${shortTime(seg.item.time)} ` : ''}${seg.item.title}`}
                className={`z-10 self-center h-[21px] flex items-center gap-1.5 px-1.5 text-[11px] leading-none text-left overflow-hidden whitespace-nowrap shadow-xs hover:brightness-110 hover:shadow-sm transition ${seg.item.cls}
                  ${seg.isStart ? 'ml-1 rounded-l-[4px]' : ''} ${seg.isEnd ? 'mr-1 rounded-r-[4px]' : ''} ${seg.item.draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                {seg.item.time && seg.isStart && <span className="font-bold shrink-0">{shortTime(seg.item.time)}</span>}
                <span className={`font-semibold truncate ${seg.span > 1 ? 'flex-1 text-center' : ''}`}>{seg.item.title}</span>
              </button>
            ))}

            {hidden.map((n, col) => n > 0 && (
              <button
                key={`more-${col}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); onMore(week[col]); }}
                style={{ gridColumn: col + 1, gridRow: MAX_LANES + 2 }}
                className="z-10 self-start justify-self-start ml-1.5 mt-0.5 text-[11px] font-bold text-brand hover:underline"
              >
                +{n} more
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TimeGridView({ days, items, dragOver, dropHandlers, onSlotClick, onItemClick, itemDragProps }) {
  const scrollRef = useRef(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX;
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;
  const isAllDay = (i) => !i.time || i.start !== i.end;

  return (
    <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden">
      <div className={days.length > 1 ? 'overflow-x-auto' : ''}>
        <div className={days.length > 1 ? 'min-w-[600px]' : ''}>
          <div className="grid bg-gray-50 border-b border-[color:var(--border-subtle)]" style={{ gridTemplateColumns: cols }}>
            <div />
            {days.map(d => (
              <div key={keyOf(d)} className={`py-2 text-center border-l border-[color:var(--border-subtle)] ${isToday(d) ? 'bg-primary-50' : ''}`}>
                <p className="text-xs font-bold text-gray-700">{format(d, days.length > 1 ? 'EEE' : 'EEEE')}</p>
                <p className={`text-[13px] ${isToday(d) ? 'font-extrabold text-brand-strong' : 'text-gray-500'}`}>{format(d, days.length > 1 ? 'd/M' : 'MMMM d')}</p>
              </div>
            ))}
          </div>

          {/* All-day row */}
          <div className="grid border-b border-[color:var(--border-subtle)]" style={{ gridTemplateColumns: cols }}>
            <div className="text-[10px] font-semibold text-gray-500 text-right pr-2 py-2">all-day</div>
            {days.map(d => {
              const key = keyOf(d);
              const dayItems = items.filter(i => isAllDay(i) && i.start <= key && i.end >= key);
              return (
                <div key={key} {...dropHandlers(key)} className={`min-h-[34px] p-1 space-y-1 border-l border-[color:var(--border-subtle)] ${dragOver === key ? 'bg-primary-100' : isToday(d) ? 'bg-primary-50' : ''}`}>
                  {dayItems.map(i => (
                    <button key={i.id} type="button" onClick={() => onItemClick(i)} {...itemDragProps(i)} className={`w-full block truncate text-left text-[11px] font-semibold px-1.5 py-1 rounded ${i.cls}`} title={i.title}>
                      {i.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          <div ref={scrollRef} className="max-h-[560px] overflow-y-auto">
            <div className="grid relative" style={{ gridTemplateColumns: cols }}>
              <div>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-[10.5px] text-gray-500 text-right pr-2" style={{ height: HOUR_PX }}>
                    {h > 0 && <span className="relative -top-2">{hourLabel(h)}</span>}
                  </div>
                ))}
              </div>
              {days.map(d => {
                const key = keyOf(d);
                const timed = layoutDay(items
                  .filter(i => !isAllDay(i) && i.start === key)
                  .map(i => {
                    const startMin = toMin(i.time);
                    const end = i.endTime ? toMin(i.endTime) : 0;
                    return { item: i, startMin, endMin: end > startMin ? end : startMin + 60 };
                  }));
                const nowMin = now.getHours() * 60 + now.getMinutes();
                return (
                  <div key={key} className={`relative border-l border-[color:var(--border-subtle)] ${isToday(d) ? 'bg-primary-50/60' : ''}`}>
                    {Array.from({ length: 24 }, (_, h) => {
                      const slot = `${key}T${String(h).padStart(2, '0')}`;
                      return (
                        <div
                          key={h}
                          onClick={() => onSlotClick(key, `${String(h).padStart(2, '0')}:00`)}
                          {...dropHandlers(key, `${String(h).padStart(2, '0')}:00`, slot)}
                          className={`border-b border-dashed border-[color:var(--border-subtle)] cursor-pointer transition-colors ${dragOver === slot ? 'bg-primary-100' : 'hover:bg-gray-50/80'}`}
                          style={{ height: HOUR_PX }}
                        />
                      );
                    })}
                    {timed.map(({ item, startMin, endMin, col, cols: n }) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onItemClick(item)}
                        {...itemDragProps(item)}
                        className={`absolute z-10 rounded-md px-1.5 py-1 text-left overflow-hidden shadow-sm hover:brightness-110 transition border border-white/40 ${item.cls}`}
                        style={{
                          top: (startMin / 60) * HOUR_PX + 1,
                          height: Math.max(22, ((endMin - startMin) / 60) * HOUR_PX - 2),
                          left: `calc(${(col / n) * 100}% + 2px)`,
                          width: `calc(${100 / n}% - 4px)`,
                        }}
                        title={item.title}
                      >
                        <span className="block text-[10.5px] font-bold leading-tight">{shortTime(item.time)}{item.endTime ? ` – ${shortTime(item.endTime)}` : ''}</span>
                        <span className="block text-[11.5px] font-semibold leading-tight truncate">{item.title}</span>
                      </button>
                    ))}
                    {isToday(d) && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: (nowMin / 60) * HOUR_PX }}>
                        <span className="w-2 h-2 -ml-1 rounded-full bg-danger" />
                        <span className="flex-1 h-0.5 bg-danger" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListView({ cursor, items, onItemClick }) {
  const monthStart = keyOf(startOfMonth(cursor));
  const monthEnd = keyOf(endOfMonth(cursor));
  const days = eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) })
    .map(d => {
      const key = keyOf(d);
      const dayItems = items
        .filter(i => i.start <= key && i.end >= key && i.start <= monthEnd && i.end >= monthStart)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      return { d, key, dayItems };
    })
    .filter(x => x.dayItems.length);

  if (!days.length) {
    return (
      <div className="border border-[color:var(--border-subtle)] rounded-lg py-16 text-center">
        <CalendarDays size={28} className="mx-auto text-gray-300 mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-500">No events to display this month.</p>
      </div>
    );
  }

  return (
    <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden">
      {days.map(({ d, key, dayItems }) => (
        <div key={key}>
          <div className={`flex items-center justify-between px-4 py-2 text-[13px] font-bold border-b border-[color:var(--border-subtle)] ${isToday(d) ? 'bg-primary-100 text-brand-strong' : 'bg-gray-50 text-gray-800'}`}>
            <span>{format(d, 'EEEE')}</span>
            <span>{format(d, 'MMMM d, yyyy')}</span>
          </div>
          {dayItems.map(i => (
            <button
              key={i.id}
              type="button"
              onClick={() => onItemClick(i)}
              className="w-full flex items-center gap-4 px-4 py-2.5 text-left border-b last:border-b-0 border-[color:var(--border-subtle)] hover:bg-gray-50 transition-colors"
            >
              <span className="w-28 shrink-0 text-[12.5px] text-gray-600">
                {i.start !== i.end ? 'Multi-day' : i.time ? `${shortTime(i.time)}${i.endTime ? ` – ${shortTime(i.endTime)}` : ''}` : 'All day'}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${i.dot}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-gray-900 truncate">{i.title}</span>
                {i.meta && <span className="block text-xs text-gray-500 truncate">{i.meta}</span>}
              </span>
              {i.to && <Link2 size={14} className="text-gray-400 shrink-0" aria-label="Opens the linked record" />}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

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

  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [category, setCategory] = useState('all');
  const [enabled, setEnabled] = useState(() => Object.fromEntries(Object.keys(SOURCES).map(k => [k, false])));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const drag = useRef(null);

  const openCreate = (date, extra) => {
    setEditing(null);
    setForm(emptyForm(date, { type: category !== 'all' ? category : 'Meeting', ...extra }));
    setFormError('');
    setModalOpen(true);
  };
  const openEdit = (record) => {
    setEditing(record);
    setForm({ ...emptyForm(record.date), ...record, endDate: record.endDate || '', endTime: record.endTime || '' });
    setFormError('');
    setModalOpen(true);
  };
  useQuickAction('new', () => openCreate());

  const items = useMemo(() => {
    const list = [];
    events.forEach(e => {
      const start = dayKey(e.date);
      if (!start) return;
      const endKey = dayKey(e.endDate);
      const t = typeOf(e.type);
      list.push({
        id: `event:${e.id}`, source: 'event', type: e.type, start, end: endKey && endKey >= start ? endKey : start,
        time: e.time || '', endTime: e.endTime || '', title: e.title,
        meta: [t.label, e.relatedTo, e.notes].filter(Boolean).join(' · '), cls: t.bar, dot: t.dot, record: e, draggable: true,
      });
    });
    const linked = (source, date, title, meta, to) => {
      const key = dayKey(date);
      if (key) list.push({ id: `${source}:${to}:${title}`, source, start: key, end: key, time: '', title, meta, cls: SOURCES[source].chip, dot: SOURCES[source].dot, to });
    };
    if (enabled.task) tasks.forEach(t => linked('task', t.dueDate, t.title, `Task · ${t.status} · ${t.assignedTo}`, `/projects/tasks?q=${encodeURIComponent(t.title)}`));
    if (enabled.activity) activities.forEach(a => linked('activity', a.dateTime, a.title, `${a.type} · ${a.company}`, `/crm/activities?q=${encodeURIComponent(a.title)}`));
    if (enabled.deal) deals.filter(d => !String(d.stage).startsWith('Closed')).forEach(d => linked('deal', d.expectedClose, d.name, `Deal · ${d.stage} · expected close`, `/sales-analytics/deals?q=${encodeURIComponent(d.name)}`));
    if (enabled.quote) quotations.filter(q => ['Sent', 'Draft'].includes(q.status)).forEach(q => linked('quote', q.expiryDate, `${q.quoteNumber} expires`, `Quotation · ${q.customer}`, `/sales-analytics/quotations?q=${encodeURIComponent(q.quoteNumber)}`));
    if (enabled.project) projects.filter(p => p.status !== 'Completed').forEach(p => linked('project', p.dueDate, `${p.name} due`, `Project · ${p.company || p.client}`, `/projects?q=${encodeURIComponent(p.name)}`));
    return category === 'all' ? list : list.filter(i => i.source === 'event' && i.type === category);
  }, [events, tasks, activities, deals, quotations, projects, enabled, category]);

  // ── Drag and drop: categories create events, events move between days ──
  const itemDragProps = (item) => (item.draggable ? {
    draggable: true,
    onDragStart: (e) => {
      drag.current = { kind: 'event', record: item.record };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.title);
    },
    onDragEnd: () => { drag.current = null; setDragOver(null); },
  } : {});

  const categoryDragProps = (type) => ({
    draggable: true,
    onDragStart: (e) => {
      drag.current = { kind: 'type', type };
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', TYPES[type].label);
    },
    onDragEnd: () => { drag.current = null; setDragOver(null); },
  });

  const dropOn = (date, time) => {
    const payload = drag.current;
    drag.current = null;
    setDragOver(null);
    if (!payload) return;
    if (payload.kind === 'type') {
      const record = {
        ...emptyForm(date), title: TYPES[payload.type].label, type: payload.type, time: time || '',
        id: `evt-${generateId()}`, createdAt: new Date().toISOString(),
      };
      setEvents(prev => [...prev, record]);
      addToast(`“${record.title}” added on ${format(parseISO(date), 'MMM d')}. Click it to edit.`, 'success');
      return;
    }
    const r = payload.record;
    const shift = differenceInCalendarDays(parseISO(date), parseISO(r.date));
    const next = { ...r, date };
    if (r.endDate) next.endDate = keyOf(addDays(parseISO(r.endDate), shift));
    if (time) {
      next.time = time;
      if (r.time && r.endTime) next.endTime = fromMin(toMin(time) + (toMin(r.endTime) - toMin(r.time)));
    }
    if (!shift && next.time === r.time) return;
    setEvents(prev => prev.map(e => (e.id === r.id ? next : e)));
    addToast(`“${r.title}” moved to ${format(parseISO(date), 'EEE, MMM d')}${time ? ` at ${shortTime(time)}` : ''}.`, 'success');
  };

  const dropHandlers = (date, time, highlightKey = date) => ({
    onDragOver: (e) => {
      if (!drag.current) return;
      e.preventDefault();
      if (dragOver !== highlightKey) setDragOver(highlightKey);
    },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(d => (d === highlightKey ? null : d)); },
    onDrop: (e) => { e.preventDefault(); dropOn(date, time); },
  });

  const onItemClick = (item) => {
    if (item.record) openEdit(item.record);
    else if (item.to) navigate(item.to);
  };

  // ── Toolbar ──
  const step = (dir) => {
    setCursor(c => {
      if (view === 'week') return dir > 0 ? addWeeks(c, 1) : subWeeks(c, 1);
      if (view === 'day') return dir > 0 ? addDays(c, 1) : subDays(c, 1);
      return dir > 0 ? addMonths(c, 1) : subMonths(c, 1);
    });
  };
  const weekDays = eachDayOfInterval({ start: startOfWeek(cursor, WEEK_OPTS), end: endOfWeek(cursor, WEEK_OPTS) });
  const today = new Date();
  const showingToday = view === 'day'
    ? keyOf(cursor) === keyOf(today)
    : view === 'week'
      ? weekDays.some(d => isToday(d))
      : format(cursor, 'yyyy-MM') === format(today, 'yyyy-MM');
  const title = view === 'week'
    ? `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], weekDays[0].getMonth() === weekDays[6].getMonth() ? 'd, yyyy' : 'MMM d, yyyy')}`
    : view === 'day' ? format(cursor, 'EEEE, MMMM d, yyyy') : format(cursor, 'MMMM yyyy');

  // ── Save / delete ──
  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.date) { setFormError('Date is required.'); return; }
    if (form.endDate && form.endDate < form.date) { setFormError('End date cannot be before the start date.'); return; }
    if (form.time && form.endTime && form.endTime <= form.time && (!form.endDate || form.endDate === form.date)) { setFormError('End time must be after the start time.'); return; }
    const record = { ...form, title: form.title.trim(), endDate: form.endDate && form.endDate !== form.date ? form.endDate : '' };
    if (editing) {
      setEvents(prev => prev.map(ev => (ev.id === editing.id ? { ...editing, ...record } : ev)));
      addToast('Event updated.', 'success');
    } else {
      setEvents(prev => [...prev, { ...record, id: `evt-${generateId()}`, createdAt: new Date().toISOString() }]);
      setCursor(parseISO(form.date));
      addToast('Event added to the calendar.', 'success');
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
    setDeleteTarget(null);
    setModalOpen(false);
    addToast('Event deleted.', 'success');
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start" data-no-reveal>
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <aside className="card p-5 space-y-5 xl:sticky xl:top-4">
        <div className="flex gap-2">
          <select className="form-select flex-1 min-w-0 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {Object.entries(TYPES).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
          </select>
          <button type="button" className="btn-primary btn-sm shrink-0 !px-3" onClick={() => openCreate(keyOf(cursor))}>
            <PlusCircle size={15} aria-hidden="true" /> Create Event
          </button>
        </div>

        <div>
          <p className="text-[12.5px] text-gray-500 mb-3">Drag and drop your event or click in the calendar</p>
          <ul className="space-y-2">
            {Object.entries(TYPES).filter(([key]) => key !== 'Other').map(([key, t]) => (
              <li key={key}>
                <div
                  {...categoryDragProps(key)}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-semibold cursor-grab active:cursor-grabbing select-none shadow-xs hover:shadow-md hover:-translate-y-px transition ${t.bar}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
                  <span className="flex-1">{t.label}</span>
                  <GripVertical size={14} className="opacity-50 group-hover:opacity-90" aria-hidden="true" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <fieldset className="pt-4 border-t border-[color:var(--border-subtle)]">
          <legend className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 mb-2.5">Show from modules</legend>
          <div className="space-y-2">
            {Object.entries(SOURCES).map(([key, s]) => (
              <label key={key} className="flex items-center gap-2.5 text-[13px] text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#145D68]"
                  checked={enabled[key]}
                  onChange={(e) => setEnabled(en => ({ ...en, [key]: e.target.checked }))}
                />
                <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="hidden xl:block pt-2">
          <PlannerIllustration />
        </div>
      </aside>

      {/* ── Calendar ───────────────────────────────────────────────── */}
      <section className="card p-4 sm:p-5 min-w-0 hover:!shadow-sm" aria-label="Calendar">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md overflow-hidden shadow-xs">
              <button type="button" onClick={() => step(-1)} className="btn-primary !rounded-none !px-2.5 !py-1.5" aria-label={`Previous ${view === 'list' ? 'month' : view}`}><ChevronLeft size={16} /></button>
              <button type="button" onClick={() => step(1)} className="btn-primary !rounded-none !px-2.5 !py-1.5 border-l border-primary-500/40" aria-label={`Next ${view === 'list' ? 'month' : view}`}><ChevronRight size={16} /></button>
            </div>
            <button type="button" onClick={() => setCursor(new Date())} disabled={showingToday} className="btn-primary btn-sm">Today</button>
          </div>

          <h2 className="order-last sm:order-none w-full sm:w-auto sm:flex-1 text-center text-[15px] sm:text-base font-extrabold uppercase tracking-wide text-gray-900" aria-live="polite">{title}</h2>

          <div role="tablist" aria-label="Calendar view" className="ml-auto sm:ml-0 inline-flex rounded-md overflow-hidden border border-primary-500/50">
            {VIEWS.map(v => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={`px-3 sm:px-3.5 py-1.5 text-[13px] font-semibold transition-colors border-l first:border-l-0 border-primary-500/40 ${
                  view === v.id ? 'bg-teal-800 text-primrose' : 'bg-primary text-primary-ink hover:bg-primary-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {view === 'month' && (
          <MonthView
            cursor={cursor}
            items={items}
            dragOver={dragOver}
            dropHandlers={dropHandlers}
            onDayClick={(key) => openCreate(key)}
            onItemClick={onItemClick}
            onMore={(day) => { setCursor(day); setView('day'); }}
            itemDragProps={itemDragProps}
          />
        )}
        {(view === 'week' || view === 'day') && (
          <TimeGridView
            key={view}
            days={view === 'week' ? weekDays : [cursor]}
            items={items}
            dragOver={dragOver}
            dropHandlers={dropHandlers}
            onSlotClick={(date, time) => openCreate(date, { time })}
            onItemClick={onItemClick}
            itemDragProps={itemDragProps}
          />
        )}
        {view === 'list' && <ListView cursor={cursor} items={items} onItemClick={onItemClick} />}
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Event' : 'New Event'}
        footer={
          <>
            {editing && (
              <button type="button" className="btn-ghost !text-danger mr-auto" onClick={() => setDeleteTarget(editing)}>
                <Trash2 size={15} aria-hidden="true" /> Delete
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="event-form" className="btn-primary">{editing ? 'Save Changes' : 'Save Event'}</button>
          </>
        }
      >
        <form id="event-form" onSubmit={save} className="space-y-4" noValidate>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div>
            <label htmlFor="evt-title" className="form-label">Title *</label>
            <input id="evt-title" className="form-input" value={form.title} onChange={setField('title')} placeholder="e.g. Supplier audit debrief" autoFocus />
          </div>
          <div>
            <span className="form-label">Category</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: key }))}
                  aria-pressed={form.type === key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    form.type === key ? 'border-[color:var(--focus-border)] bg-primary-50 text-gray-900' : 'border-[color:var(--border-subtle)] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} aria-hidden="true" /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="evt-date" className="form-label">Start date *</label>
              <input id="evt-date" type="date" className="form-input" value={form.date} onChange={setField('date')} />
            </div>
            <div>
              <label htmlFor="evt-end-date" className="form-label">End date</label>
              <input id="evt-end-date" type="date" className="form-input" value={form.endDate} min={form.date} onChange={setField('endDate')} />
            </div>
            <div>
              <label htmlFor="evt-time" className="form-label">Start time</label>
              <input id="evt-time" type="time" className="form-input" value={form.time} onChange={setField('time')} />
            </div>
            <div>
              <label htmlFor="evt-end-time" className="form-label">End time</label>
              <input id="evt-end-time" type="time" className="form-input" value={form.endTime} onChange={setField('endTime')} disabled={!form.time} />
            </div>
          </div>
          <div>
            <label htmlFor="evt-related" className="form-label">Related company or project</label>
            <select id="evt-related" className="form-select" value={form.relatedTo} onChange={setField('relatedTo')}>
              <option value="">— None —</option>
              <optgroup label="Companies">{companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</optgroup>
              <optgroup label="Projects">{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <label htmlFor="evt-notes" className="form-label">Notes</label>
            <textarea id="evt-notes" rows={3} className="form-input" value={form.notes} onChange={setField('notes')} />
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
