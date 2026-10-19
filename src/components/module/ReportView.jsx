/**
 * Standalone report page. A report definition has the same shape as the ones in
 * src/features/reports/reportDefinitions.js:
 *
 *   {
 *     id, module, title, description,
 *     formula: 'How every figure is calculated',
 *     entities: ['orders', 'products'],            // registered collections
 *     dateField: { entity: 'orders', field: 'date' },  // optional, enables the date range
 *     build: (data) => ({
 *       columns: [{ key, label, accessor? }],
 *       rows: [{ id, ... }],
 *       chart: { xKey, bars: [{ key, label, color }], stacked?, currency?, type?: 'bar'|'area'|'line' },
 *       summary: [{ label, value }],
 *     }),
 *   }
 *
 *   <ReportView report={definition} icon={Icon} />
 */
import React, { useMemo, useState } from 'react';
import { Download, Calculator, FileBarChart, CalendarRange } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import ExportDialog from '../data-transfer/ExportDialog';
import useCollections from '../../hooks/useCollections';
import { formatCurrency } from '../../utils/format';
import { DashboardHero, Panel, TrendChart } from './DashboardKit';

const dayOf = (v) => String(v || '').slice(0, 10);

export default function ReportView({ report, icon }) {
  const data = useCollections(report.entities);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  const scoped = useMemo(() => {
    if (!report.dateField || (!from && !to)) return data;
    const { entity, field } = report.dateField;
    return {
      ...data,
      [entity]: data[entity].filter(r => {
        const d = dayOf(r[field]);
        return d && (!from || d >= from) && (!to || d <= to);
      }),
    };
  }, [data, from, to, report]);

  const result = useMemo(() => report.build(scoped), [report, scoped]);
  const recordCount = report.entities.reduce((n, e) => n + (scoped[e]?.length || 0), 0);
  const chart = result.chart;

  return (
    <div className="space-y-4">
      <DashboardHero
        eyebrow={`${report.module} report`}
        title={report.title}
        subtitle={report.description}
        icon={icon || FileBarChart}
        tone="midnight"
        actions={(
          <>
            {report.dateField && (
              <div className="flex flex-wrap items-end gap-2 rounded-lg p-1.5 bg-white/[0.06] border border-white/10">
                <CalendarRange size={15} className="text-white/60 ms-1 mb-2" aria-hidden="true" />
                <label className="text-[11px] text-white/70">From
                  <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="form-input !py-1 !w-36 mt-0.5 text-xs" />
                </label>
                <label className="text-[11px] text-white/70">To
                  <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="form-input !py-1 !w-36 mt-0.5 text-xs" />
                </label>
                {(from || to) && <button type="button" className="btn-glass btn-sm mb-0.5" onClick={() => { setFrom(''); setTo(''); }}>Clear</button>}
              </div>
            )}
            <button type="button" className="btn-accent" onClick={() => setExportOpen(true)} disabled={!result.rows.length}>
              <Download size={14} aria-hidden="true" /> Export
            </button>
          </>
        )}
      />

      <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600">
        <Calculator size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-gray-800">How it’s calculated:</strong> {report.formula} Based on {recordCount} record{recordCount === 1 ? '' : 's'}
          {report.dateField && (from || to) ? ` with ${report.dateField.field} in the selected range` : ''}.
        </span>
      </div>

      {recordCount === 0 || !result.rows.length ? (
        <div className="card"><EmptyState icon={FileBarChart} title="No records in this range" description="Widen the date range or add records in the module." /></div>
      ) : (
        <>
          {result.summary?.length > 0 && (
            <div className={`grid grid-cols-2 ${result.summary.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
              {result.summary.map(s => (
                <div key={s.label} className="card card-lift card-body">
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">{s.label}</p>
                  <p className="font-display text-[24px] font-extrabold text-gray-900 mt-1 tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          )}
          {chart && (
            <Panel title="Breakdown" subtitle={report.description}>
              <TrendChart
                data={result.rows}
                xKey={chart.xKey}
                type={chart.type || 'bar'}
                stacked={chart.stacked}
                series={chart.bars}
                valueFormatter={chart.currency ? (v) => formatCurrency(v) : undefined}
              />
            </Panel>
          )}
          <Panel title="Details" bodyClassName="">
            <div className="table-container">
              <table className="data-table">
                <caption className="sr-only">{report.title}</caption>
                <thead><tr>{result.columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
                <tbody>
                  {result.rows.map(r => (
                    <tr key={r.id}>
                      {result.columns.map(c => <td key={c.key} className="tabular-nums">{c.accessor ? c.accessor(r) : r[c.key]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title={report.title}
        filename={`meridian_report_${report.id}`}
        fields={result.columns}
        allRecords={result.rows}
        entityType="reports"
      />
    </div>
  );
}
