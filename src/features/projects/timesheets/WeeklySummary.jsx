import React, { useMemo, useState } from 'react';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';

/**
 * Weekly timesheet summary: hours per person per day (Mon–Sun) for one week,
 * computed from the timesheet entries passed in (respecting page filters).
 */
export default function WeeklySummary({ entries }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dayKeys = useMemo(() => days.map(d => format(d, 'yyyy-MM-dd')), [days]);

  const rows = useMemo(() => {
    const inWeek = entries.filter(e => dayKeys.includes(e.date));
    const byPerson = new Map();
    inWeek.forEach(e => {
      const row = byPerson.get(e.employee) || { employee: e.employee, perDay: {}, total: 0, approved: 0, pending: 0 };
      row.perDay[e.date] = (row.perDay[e.date] || 0) + (Number(e.hours) || 0);
      row.total += Number(e.hours) || 0;
      if (e.status === 'Approved') row.approved += Number(e.hours) || 0;
      if (e.status === 'Pending') row.pending += Number(e.hours) || 0;
      byPerson.set(e.employee, row);
    });
    return [...byPerson.values()].sort((a, b) => b.total - a.total);
  }, [entries, dayKeys]);

  const dayTotals = dayKeys.map(k => rows.reduce((s, r) => s + (r.perDay[k] || 0), 0));
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);
  const fmt = (h) => (h ? Number(h.toFixed(2)).toString() : '—');

  return (
    <section className="card mb-6" aria-labelledby="weekly-summary-title">
      <div className="card-header flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarRange size={16} className="text-brand" aria-hidden="true" />
          <h3 id="weekly-summary-title" className="text-sm font-semibold text-gray-800">
            Weekly Summary · {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="btn-outline btn-sm !px-2" onClick={() => setWeekStart(w => addWeeks(w, -1))} aria-label="Previous week"><ChevronLeft size={14} /></button>
          <button type="button" className="btn-outline btn-sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This week</button>
          <button type="button" className="btn-outline btn-sm !px-2" onClick={() => setWeekStart(w => addWeeks(w, 1))} aria-label="Next week"><ChevronRight size={14} /></button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-500">No time logged this week for the current filters.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <caption className="sr-only">Hours per person per day</caption>
            <thead>
              <tr>
                <th>Consultant</th>
                {days.map(d => <th key={d.toISOString()} className="text-right">{format(d, 'EEE d')}</th>)}
                <th className="text-right">Total</th>
                <th className="text-right">Approved</th>
                <th className="text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.employee}>
                  <td className="text-xs font-semibold">{r.employee}</td>
                  {dayKeys.map(k => <td key={k} className="text-right text-xs tabular-nums">{fmt(r.perDay[k])}</td>)}
                  <td className="text-right text-xs font-bold tabular-nums">{fmt(r.total)}</td>
                  <td className="text-right text-xs tabular-nums text-success">{fmt(r.approved)}</td>
                  <td className="text-right text-xs tabular-nums text-warning-600">{fmt(r.pending)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="text-xs font-bold">Total</td>
                {dayTotals.map((t, i) => <td key={dayKeys[i]} className="text-right text-xs font-bold tabular-nums">{fmt(t)}</td>)}
                <td className="text-right text-xs font-bold tabular-nums">{fmt(weekTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
