import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileBarChart, Calculator } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import ExportDialog from '../../components/data-transfer/ExportDialog';
import useCollection from '../../hooks/useCollection';
import { REPORTS, REPORT_MODULES } from './reportDefinitions';
import { formatCurrency, formatNumber } from '../../utils/format';
import { CHART, TOOLTIP_STYLE } from '../../lib/chartColors';

const tooltipStyle = TOOLTIP_STYLE;
const dayOf = (v) => String(v || '').slice(0, 10);

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const activeId = params.get('report') || REPORTS[0].id;
  const report = REPORTS.find(r => r.id === activeId) || REPORTS[0];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  const [activities] = useCollection('activities');
  const [communications] = useCollection('communications');
  const [companies] = useCollection('companies');
  const [leads] = useCollection('leads');
  const [deals] = useCollection('deals');
  const [quotations] = useCollection('quotations');
  const [tasks] = useCollection('tasks');
  const [timesheets] = useCollection('timesheets');
  const [projects] = useCollection('projects');

  const collections = useMemo(() => ({
    activities, communications, companies, leads, deals, quotations, tasks, timesheets, projects,
  }), [activities, communications, companies, leads, deals, quotations, tasks, timesheets, projects]);

  // Restrict the report's collections to the selected date range (when it has a date field).
  const scoped = useMemo(() => {
    const data = {};
    report.entities.forEach(e => { data[e] = collections[e] || []; });
    if (report.dateField && (from || to)) {
      const { entity, field } = report.dateField;
      data[entity] = data[entity].filter(r => {
        const d = dayOf(r[field]);
        if (!d) return false;
        return (!from || d >= from) && (!to || d <= to);
      });
    }
    return data;
  }, [report, from, to, collections]);

  const result = useMemo(() => report.build(scoped), [report, scoped]);
  const recordCount = report.entities.reduce((n, e) => n + (scoped[e]?.length || 0), 0);

  const selectReport = (id) => {
    const next = new URLSearchParams(params);
    next.set('report', id);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Cross-module reports calculated from the records in this workspace."
        breadcrumbs={[{ label: 'Workspace' }, { label: 'Reports' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Report directory */}
        <nav className="card p-3 lg:self-start" aria-label="Report directory">
          <label htmlFor="report-select" className="sr-only">Choose report</label>
          <select id="report-select" className="form-select lg:hidden" value={report.id} onChange={(e) => selectReport(e.target.value)}>
            {REPORT_MODULES.map(m => (
              <optgroup key={m} label={m}>
                {REPORTS.filter(r => r.module === m).map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </optgroup>
            ))}
          </select>
          <div className="hidden lg:block space-y-3">
            {REPORT_MODULES.map(m => (
              <div key={m}>
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{m}</p>
                <ul className="space-y-0.5">
                  {REPORTS.filter(r => r.module === m).map(r => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => selectReport(r.id)}
                        aria-current={r.id === report.id ? 'page' : undefined}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-colors ${r.id === report.id ? 'bg-primary-100 text-brand font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {r.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Report body */}
        <div className="lg:col-span-3 space-y-4 min-w-0">
          <section className="card">
            <div className="card-header flex-wrap gap-3">
              <div className="min-w-0">
                <span className="badge-secondary text-2xs uppercase">{report.module}</span>
                <h2 className="text-base font-semibold text-gray-800 mt-1">{report.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{report.description}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                {report.dateField ? (
                  <>
                    <label className="text-[11px] text-gray-500">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="form-input !py-1.5 text-xs mt-0.5 !w-36" /></label>
                    <label className="text-[11px] text-gray-500">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="form-input !py-1.5 text-xs mt-0.5 !w-36" /></label>
                    {(from || to) && <button type="button" className="btn-secondary btn-sm" onClick={() => { setFrom(''); setTo(''); }}>Clear</button>}
                  </>
                ) : (
                  <span className="text-[11px] text-gray-400">No date field — covers all records</span>
                )}
                <button type="button" className="btn-outline btn-sm" onClick={() => setExportOpen(true)} disabled={!result.rows.length}>
                  <Download size={14} aria-hidden="true" /> Export
                </button>
              </div>
            </div>
            <div className="px-5 py-3 flex items-start gap-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
              <Calculator size={13} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              <span><strong className="font-semibold text-gray-600">How it’s calculated:</strong> {report.formula} Based on {recordCount} record{recordCount === 1 ? '' : 's'}{report.dateField && (from || to) ? ` with ${report.dateField.field} in the selected range` : ''}.</span>
            </div>

            {recordCount === 0 ? (
              <EmptyState icon={FileBarChart} title="No records in this range" description="Widen the date range or add records in the module." />
            ) : (
              <>
                {result.summary?.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 pb-0">
                    {result.summary.map(s => (
                      <div key={s.label} className="rounded-lg border border-gray-100 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">{s.label}</p>
                        <p className="text-lg font-bold text-gray-800 mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={result.rows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                      <XAxis dataKey={result.chart.xKey} tick={{ fontSize: 11 }} stroke={CHART.axis} interval={0} tickFormatter={(v) => (String(v).length > 14 ? `${String(v).slice(0, 13)}…` : v)} />
                      <YAxis tick={{ fontSize: 11 }} stroke={CHART.axis} tickFormatter={formatNumber} width={52} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => (result.chart.currency ? formatCurrency(v) : Number(v).toLocaleString())} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {result.chart.bars.map(b => (
                        <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} stackId={result.chart.stacked ? 'a' : undefined} radius={result.chart.stacked ? 0 : [4, 4, 0, 0]} isAnimationActive={false} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="table-container border-t border-gray-100">
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
              </>
            )}
          </section>
        </div>
      </div>

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
