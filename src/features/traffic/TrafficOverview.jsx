import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, Users, MousePointerClick, Timer, Upload, Download, Info, RefreshCw, Trash2, Target, FileText, AlertTriangle, Share2, Layers,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ImportDialog from '../../components/data-transfer/ImportDialog';
import ExportDialog from '../../components/data-transfer/ExportDialog';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { logEvent } from '../../lib/auditLog';
import {
  getActiveTrafficProvider, getImportedTrafficRows, saveImportedTrafficRows, clearImportedTrafficRows, trafficImportEntity,
} from '../../services/traffic/trafficProvider';
import {
  METRIC_DEFINITIONS, sumRows, deriveMetrics, pctChange, resolvePeriod, dailySeries, groupBy, channelOf, formatDuration,
} from '../../services/traffic/trafficMetrics';
import TrafficTable from './TrafficTable';
import { Sparkline } from './TrafficWidgets';
import { formatNumber } from '../../utils/format';

const PERIODS = [
  { id: '7', label: '7D' },
  { id: '30', label: '30D' },
  { id: '90', label: '90D' },
  { id: 'custom', label: 'Custom' },
];

const CHANNELS = ['All', 'Search', 'Direct', 'Social', 'Referral', 'Email'];

const tooltipStyle = { borderRadius: '5px', fontSize: '12px' };

// Series colours follow the reference design: blue sessions, orange users.
const SERIES = { sessions: '#5b7fe0', users: '#e8830f', prior: '#9aa39e' };

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function changeProps(current, previous, compare) {
  if (!compare) return {};
  const pct = pctChange(current, previous);
  if (pct === null) return { change: 'n/a', changeType: 'neutral', subtitle: 'no prior data' };
  return {
    change: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    changeType: Math.abs(pct) < 0.05 ? 'neutral' : pct > 0 ? 'increase' : 'decrease',
    subtitle: 'vs prior period',
  };
}

export default function TrafficOverview() {
  const addToast = useToast();
  const [period, setPeriod] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [compare, setCompare] = useState(true);
  const [series, setSeries] = useState({ sessions: true, users: true });
  const [channel, setChannel] = useState('All');
  const [state, setState] = useState({ loading: true, error: null, rows: [], prevRows: [], realtime: null, realtimeCheckedAt: null });
  const [providerVersion, setProviderVersion] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pagesModal, setPagesModal] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importedRows, setImportedRows] = useState(() => getImportedTrafficRows());

  // Re-resolve the provider after an import or removal changes the data source.
  const provider = useMemo(() => getActiveTrafficProvider(), [providerVersion]);
  const range = useMemo(() => resolvePeriod(period, customFrom, customTo), [period, customFrom, customTo]);

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [rows, prevRows, realtime] = await Promise.all([
        provider.getDailyRows({ from: range.from, to: range.to }),
        provider.getDailyRows({ from: range.prevFrom, to: range.prevTo }),
        provider.getRealtime(),
      ]);
      setState({ loading: false, error: null, rows, prevRows, realtime, realtimeCheckedAt: new Date().toISOString() });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message || 'Traffic data could not be loaded.' }));
    }
  }, [provider, range]);

  useEffect(() => { load(); }, [load]);

  const current = useMemo(() => deriveMetrics(sumRows(state.rows)), [state.rows]);
  const previous = useMemo(() => deriveMetrics(sumRows(state.prevRows)), [state.prevRows]);

  const chartData = useMemo(() => {
    const cur = dailySeries(state.rows, range.from, range.days);
    const prev = dailySeries(state.prevRows, range.prevFrom, range.days);
    return cur.map((d, i) => ({
      ...d,
      label: format(new Date(`${d.date}T00:00:00`), 'MMM d'),
      prevSessions: prev[i]?.sessions ?? null,
      prevDate: prev[i]?.date,
    }));
  }, [state.rows, state.prevRows, range]);

  const landingPages = useMemo(() => groupBy(state.rows, state.prevRows, 'page', range.from, range.days), [state.rows, state.prevRows, range]);
  const referrersAll = useMemo(() => groupBy(state.rows, state.prevRows, 'source', range.from, range.days), [state.rows, state.prevRows, range]);
  const referrers = useMemo(() => (channel === 'All' ? referrersAll : referrersAll.filter(r => channelOf(r.name) === channel)), [referrersAll, channel]);

  const sparkSessions = chartData.map(d => d.sessions);
  const sparkUsers = chartData.map(d => d.users);
  const sparkBounce = chartData.map(d => (d.sessions ? (d.bounces || 0) / d.sessions : 0));
  const sparkDuration = chartData.map(d => (d.sessions ? (d.durationSec || 0) / d.sessions : 0));
  const isDemo = provider.kind === 'demo';
  const hasData = state.rows.length > 0;
  const periodLabel = `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')}`;
  const prevLabel = `${format(range.prevFrom, 'MMM d')} – ${format(range.prevTo, 'MMM d, yyyy')}`;

  const handleImportRows = (next) => {
    saveImportedTrafficRows(next);
    setImportedRows(next);
    logEvent({ action: 'imported', entityType: 'traffic', details: `${next.length} traffic rows stored`, path: '/traffic-overview' });
    setProviderVersion(v => v + 1);
  };

  const handleClearImported = () => {
    clearImportedTrafficRows();
    setImportedRows([]);
    setClearConfirm(false);
    setProviderVersion(v => v + 1);
    logEvent({ action: 'deleted', entityType: 'traffic', details: 'Imported traffic data removed', path: '/traffic-overview' });
    addToast('Imported traffic data removed. Showing the demo adapter.', 'info');
  };

  const kpis = [
    {
      title: 'Sessions', value: current.sessions, icon: Activity, color: 'bg-primary-50 text-primary-600', spark: sparkSessions, sparkColor: SERIES.sessions,
      info: METRIC_DEFINITIONS.sessions, ...changeProps(current.sessions, previous.sessions, compare),
    },
    {
      title: 'Users', value: current.users, icon: Users, color: 'bg-info-50 text-info-600', spark: sparkUsers, sparkColor: '#5aa9e6',
      info: METRIC_DEFINITIONS.users, ...changeProps(current.users, previous.users, compare),
    },
    {
      title: 'Bounce Rate', value: current.bounceRate === null ? '—' : `${current.bounceRate.toFixed(1)}%`, icon: MousePointerClick, color: 'bg-danger-50 text-danger-600', spark: sparkBounce, sparkColor: '#d0504c',
      info: METRIC_DEFINITIONS.bounceRate, positiveIsGood: false, ...changeProps(current.bounceRate, previous.bounceRate, compare),
    },
    {
      title: 'Avg. Session', value: formatDuration(current.avgSessionSec), icon: Timer, color: 'bg-accent-50 text-accent-600', spark: sparkDuration, sparkColor: SERIES.users,
      info: METRIC_DEFINITIONS.avgSession, ...changeProps(current.avgSessionSec, previous.avgSessionSec, compare),
    },
  ];

  const secondaryKpis = [
    { title: 'Pageviews', value: current.pageviews, icon: FileText, color: 'bg-secondary-100 text-secondary-600', info: METRIC_DEFINITIONS.pageviews, ...changeProps(current.pageviews, previous.pageviews, compare) },
    { title: 'Conversion Rate', value: current.conversionRate === null ? '—' : `${current.conversionRate.toFixed(2)}%`, icon: Target, color: 'bg-success/10 text-success', info: METRIC_DEFINITIONS.conversionRate, ...changeProps(current.conversionRate, previous.conversionRate, compare) },
  ];

  const rawExportFields = trafficImportEntity.fields;

  return (
    <div>
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-lg hero-midnight text-white p-5 md:p-6 mb-4 shadow-lg animate-rise-in">
        <span className="hero-orb w-72 h-72 -top-24 -right-16 bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_70%)]" aria-hidden="true" />
        <span className="hero-orb w-64 h-64 -bottom-32 left-[20%] bg-[radial-gradient(circle,rgba(255,214,130,0.14),transparent_70%)] animate-float" aria-hidden="true" />
        <div className="relative flex flex-col gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10.5px] font-bold tracking-wide bg-white/[0.08] text-white/85">
              <span className={`live-dot ${isDemo ? 'text-accent-300' : 'text-success-400'}`} aria-hidden="true" />
              {isDemo ? 'DEMO DATA · meridian website' : `IMPORTED · ${importedRows.length.toLocaleString()} rows`}
            </span>
            <h1 className="font-display text-[22px] lg:text-[25px] font-extrabold leading-tight mt-3">Traffic Overview</h1>
            <p className="text-[13.5px] text-white/65 mt-1 max-w-2xl">
              A full picture of how visitors find, use and convert on the Meridian website — {periodLabel}{compare ? ` vs. ${prevLabel}` : ''}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg p-1 bg-white/[0.06] border border-white/10" role="group" aria-label="Reporting period">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPeriod(p.id);
                    if (p.id === 'custom' && !customFrom) {
                      setCustomFrom(format(range.from, 'yyyy-MM-dd'));
                      setCustomTo(format(range.to, 'yyyy-MM-dd'));
                    }
                  }}
                  aria-pressed={period === p.id}
                  className={`px-2.5 py-1.5 rounded text-[11.5px] font-semibold transition-all ${period === p.id ? 'bg-white/[0.16] text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="btn-glass cursor-pointer !font-medium">
              <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="accent-[#7ed0b4]" />
              Compare
            </label>
            <button type="button" onClick={() => scrollToId('traffic-referrers')} className="btn-glass">
              <Share2 size={14} aria-hidden="true" /> Sources
            </button>
            <button type="button" onClick={() => scrollToId('traffic-landing_pages')} className="btn-glass">
              <Layers size={14} aria-hidden="true" /> Landing Pages
            </button>
            <button type="button" onClick={() => setImportOpen(true)} className="btn-glass">
              <Upload size={14} aria-hidden="true" /> Import
            </button>
            <button type="button" onClick={() => setExportOpen(true)} disabled={!hasData} className="btn-accent">
              <Download size={14} aria-hidden="true" /> Export
            </button>
          </div>
        </div>
        {period === 'custom' && (
          <div className="relative flex flex-wrap items-end gap-3 mt-4">
            <label className="text-xs text-white/70">
              From
              <input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="form-input !py-1.5 mt-1 !w-40 text-secondary-700" />
            </label>
            <label className="text-xs text-white/70">
              To
              <input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="form-input !py-1.5 mt-1 !w-40 text-secondary-700" />
            </label>
            <span className="text-xs text-white/60 pb-2">{range.days} days</span>
          </div>
        )}
      </section>

      {/* Data-source disclosure */}
      {isDemo ? (
        <div className="flex items-start gap-3 p-3.5 mb-4 rounded-lg border border-accent-200/70 bg-accent-50 text-[13px] text-gray-700 animate-rise-in" role="note">
          <Info size={16} className="text-accent-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Demo data.</strong> No website analytics source is connected, so these figures come from a deterministic demo adapter
            for layout and workflow testing — they are not real visitor numbers. Use <strong>Import</strong> to load your own daily
            traffic export (CSV, XLSX or JSON), or connect a provider in <code className="text-xs">src/services/traffic/trafficProvider.js</code>.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mb-4 rounded-lg border border-primary-100 bg-primary-50 text-[13px] text-gray-700 animate-rise-in" role="note">
          <span className="flex items-center gap-2"><Info size={16} className="text-primary" aria-hidden="true" /> Showing traffic data imported into this browser ({importedRows.length.toLocaleString()} rows).</span>
          <button type="button" className="btn-outline btn-sm" onClick={() => setClearConfirm(true)}><Trash2 size={13} aria-hidden="true" /> Remove imported data</button>
        </div>
      )}

      {state.error && (
        <div role="alert" className="flex items-center justify-between gap-3 p-3.5 mb-5 rounded-xl border border-danger-100 bg-danger-50 text-sm text-danger-600">
          <span className="flex items-center gap-2"><AlertTriangle size={16} aria-hidden="true" /> {state.error}</span>
          <button type="button" className="btn-outline btn-sm" onClick={load}><RefreshCw size={13} aria-hidden="true" /> Retry</button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {kpis.map(k => (
          state.loading ? (
            <div key={k.title} className="card card-body space-y-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-28" /><Skeleton className="h-8 w-full" /></div>
          ) : (
            <StatCard
              key={k.title}
              title={k.title}
              value={k.value}
              change={k.change}
              changeType={k.changeType}
              subtitle={k.subtitle}
              icon={k.icon}
              iconColor={k.color}
              info={k.info}
              positiveIsGood={k.positiveIsGood !== false}
              footer={k.spark ? <div className="mt-3 -mx-1"><Sparkline values={k.spark} width={240} height={34} color={k.sparkColor} fill responsive strokeWidth={1.8} /></div> : null}
            />
          )
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {!state.loading && secondaryKpis.map(k => (
          <StatCard key={k.title} title={k.title} value={k.value} change={k.change} changeType={k.changeType} subtitle={k.subtitle} icon={k.icon} iconColor={k.color} info={k.info} />
        ))}
      </div>

      {/* Sessions over time + Live visitors */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <section className="card xl:col-span-2" aria-labelledby="sessions-chart-title">
          <div className="card-header flex-wrap gap-2">
            <div>
              <h3 id="sessions-chart-title" className="text-[15px] font-bold text-gray-900">Sessions Over Time</h3>
              <p className="text-xs text-gray-500 mt-0.5">{periodLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-xs" role="group" aria-label="Chart series">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={series.sessions} onChange={(e) => setSeries(s => ({ ...s, sessions: e.target.checked }))} className="accent-[#187f65]" />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: SERIES.sessions }} aria-hidden="true" /> Sessions
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={series.users} onChange={(e) => setSeries(s => ({ ...s, users: e.target.checked }))} className="accent-[#e8830f]" />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: SERIES.users }} aria-hidden="true" /> Users
              </label>
              {compare && (
                <span className="inline-flex items-center gap-1.5 text-gray-500">
                  <span className="w-4 border-t-2 border-dashed border-gray-400" aria-hidden="true" /> Prior sessions
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            {state.loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : !hasData ? (
              <div className="h-[300px] grid place-items-center text-sm text-gray-500">No traffic recorded in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trafficSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SERIES.sessions} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={SERIES.sessions} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trafficUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SERIES.users} stopOpacity={0.14} />
                      <stop offset="95%" stopColor={SERIES.users} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} width={48} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, name) => [Number(v).toLocaleString(), name]}
                    labelFormatter={(label, payload) => {
                      const p = payload?.[0]?.payload;
                      return compare && p?.prevDate ? `${label} (prior: ${format(new Date(`${p.prevDate}T00:00:00`), 'MMM d')})` : label;
                    }}
                  />
                  {series.sessions && <Area type="monotone" dataKey="sessions" name="Sessions" stroke={SERIES.sessions} strokeWidth={2.4} fill="url(#trafficSessions)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} animationDuration={900} />}
                  {series.users && <Area type="monotone" dataKey="users" name="Users" stroke={SERIES.users} strokeWidth={2.4} fill="url(#trafficUsers)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} animationDuration={900} />}
                  {compare && <Line type="monotone" dataKey="prevSessions" name="Prior sessions" stroke={SERIES.prior} strokeDasharray="5 5" strokeWidth={1.5} dot={false} animationDuration={900} />}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card flex flex-col" aria-labelledby="live-visitors-title">
          <div className="card-header">
            <h3 id="live-visitors-title" className="text-[15px] font-bold text-gray-900">Live Visitors</h3>
            <span className={state.realtime ? 'badge-success' : 'badge-secondary'}>
              <span className={`live-dot !w-1.5 !h-1.5 ${state.realtime ? '' : 'after:hidden'}`} aria-hidden="true" /> Realtime
            </span>
          </div>
          <div className="card-body flex-1 flex flex-col">
            {state.loading ? (
              <Skeleton lines={4} />
            ) : state.realtime ? (
              <>
                <p className="font-display text-[34px] leading-none font-extrabold text-gray-900 tabular-nums">{state.realtime.activeVisitors.toLocaleString()}</p>
                <p className="text-xs text-gray-500">active on site right now</p>
                <ul className="mt-4 space-y-2">
                  {state.realtime.pages.map(p => (
                    <li key={p.path} className="flex items-center justify-between text-sm"><span className="truncate">{p.path}</span><span className="font-semibold">{p.visitors}</span></li>
                  ))}
                </ul>
                <p className="text-[11px] text-gray-400 mt-auto pt-3">Updated {format(new Date(state.realtime.updatedAt), 'HH:mm:ss')}</p>
              </>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="-mx-1 mb-3"><Sparkline values={sparkSessions.slice(-14)} width={240} height={46} color="#1e9e6b" fill responsive strokeWidth={2} /></div>
                  <p className="text-sm font-semibold text-gray-700">Realtime feed not connected</p>
                  <p className="text-xs text-gray-500 mt-1">
                    The current source ({provider.label.toLowerCase()}) has no realtime visitor stream. This panel never shows simulated live visitors.
                  </p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-4 mb-2">Most active pages · selected period</p>
                <ul className="space-y-2.5">
                  {[...landingPages].sort((a, b) => b.sessions - a.sessions).slice(0, 4).map(p => {
                    const max = Math.max(...landingPages.map(l => l.sessions), 1);
                    return (
                      <li key={p.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="truncate text-gray-700" title={p.name}>{p.name}</span>
                          <span className="font-semibold text-gray-800 tabular-nums">{p.sessions.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-[width] duration-700 ease-spring" style={{ width: `${(p.sessions / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                  {landingPages.length === 0 && <li className="text-xs text-gray-500">No page activity in this period.</li>}
                </ul>
                <p className="text-[11px] text-gray-400 mt-auto pt-3">
                  Last checked {state.realtimeCheckedAt ? format(new Date(state.realtimeCheckedAt), 'HH:mm:ss') : '—'}
                  <button type="button" onClick={load} className="ml-2 text-primary hover:underline">Refresh</button>
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        <TrafficTable
          title="Top Landing Pages"
          subtitle="Highest-traffic entry points this period"
          nameLabel="Page"
          rows={landingPages}
          loading={state.loading}
          exportName="landing_pages"
          onViewDetails={() => setPagesModal(true)}
        />
        <TrafficTable
          title="Top Referrers"
          subtitle="Sources sending traffic, with tracked conversions"
          nameLabel="Source"
          rows={referrers}
          loading={state.loading}
          showConversions
          exportName="referrers"
          filters={(
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="form-select !py-1.5 text-xs !w-auto" aria-label="Filter by channel">
              {CHANNELS.map(c => <option key={c} value={c}>{c === 'All' ? 'All sources' : c}</option>)}
            </select>
          )}
        />
      </div>

      {/* Landing pages detail */}
      <Modal isOpen={pagesModal} onClose={() => setPagesModal(false)} title="Landing Pages — full breakdown" size="xl">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Page</th><th className="text-right">Sessions</th><th className="text-right">Users</th><th className="text-right">Bounce</th><th className="text-right">Avg. Session</th><th className="text-right">Conv. Rate</th><th className="text-right">Prior Sessions</th></tr>
            </thead>
            <tbody>
              {[...landingPages].sort((a, b) => b.sessions - a.sessions).map(p => (
                <tr key={p.name}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-right tabular-nums">{p.sessions.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{p.users.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{p.bounceRate === null ? '—' : `${p.bounceRate.toFixed(1)}%`}</td>
                  <td className="text-right tabular-nums">{formatDuration(p.avgSessionSec)}</td>
                  <td className="text-right tabular-nums">{p.conversionRate === null ? '—' : `${p.conversionRate.toFixed(2)}%`}</td>
                  <td className="text-right tabular-nums">{p.prevSessions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <ImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        entity={trafficImportEntity}
        records={importedRows}
        setRecords={handleImportRows}
      />

      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Traffic (daily rows)"
        filename="meridian_traffic"
        fields={rawExportFields}
        allRecords={state.rows}
        entityType="traffic"
      />

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={handleClearImported}
        title="Remove imported traffic data"
        message={`This deletes ${importedRows.length.toLocaleString()} imported traffic rows from this browser. Export them first if you need a copy.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
