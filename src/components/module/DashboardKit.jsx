/**
 * Building blocks for module dashboards, in the reference design language.
 * Every block uses theme tokens only, so light and dark mode both work.
 *
 *   <DashboardHero title subtitle eyebrow icon actions tone live />
 *   <KpiGrid items={[{ title, value, change, changeType, subtitle, icon, tone, spark, info, to }]} />
 *   <Panel title subtitle actions>…</Panel>
 *   <BarList items={[{ label, value, display?, tone? }]} />
 *   <TrendChart data xKey series={[{ key, label, color }]} type="area|bar|line" height />
 *   <DonutChart data={[{ name, value, color? }]} centerLabel />
 *   <MiniTable columns={[{ key, label, render?, align? }]} rows />
 *   <DemoNotice>…</DemoNotice>, <ToneBadge tone>…</ToneBadge>
 */
import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { Info } from 'lucide-react';
import StatCard from '../ui/StatCard';
import { Sparkline } from '../../features/traffic/TrafficWidgets';
import { formatNumber } from '../../utils/format';

export const TONES = {
  primary: { tile: 'bg-primary-50 text-primary-600', bar: 'from-primary-400 to-primary-600', hex: '#24997c' },
  info: { tile: 'bg-info-50 text-info-600', bar: 'from-info-400 to-info-600', hex: '#3e7ead' },
  success: { tile: 'bg-success-50 text-success-600', bar: 'from-success-400 to-success-600', hex: '#1e9e6b' },
  warning: { tile: 'bg-warning-50 text-warning-600', bar: 'from-warning-400 to-warning-600', hex: '#dc9a2c' },
  danger: { tile: 'bg-danger-50 text-danger-600', bar: 'from-danger-400 to-danger-600', hex: '#d0504c' },
  accent: { tile: 'bg-accent-50 text-accent-600', bar: 'from-accent-300 to-accent-500', hex: '#c4901d' },
  gray: { tile: 'bg-gray-100 text-gray-600', bar: 'from-gray-400 to-gray-500', hex: '#8f9893' },
};

/** Categorical palette for charts (theme-consistent, readable in both modes). */
export const CHART_COLORS = ['#24997c', '#5b7fe0', '#e8830f', '#d0504c', '#8b6fd6', '#3e9fb0', '#c4901d', '#8f9893'];

const HERO_TONES = { midnight: 'hero-midnight', spruce: 'hero-spruce' };

export function DashboardHero({ eyebrow, title, subtitle, icon: Icon, actions, tone = 'spruce', live, children }) {
  return (
    <section className={`relative overflow-hidden rounded-lg ${HERO_TONES[tone] || HERO_TONES.spruce} hero-grid text-white p-5 md:p-6 shadow-lg animate-rise-in`}>
      <span className="hero-orb w-72 h-72 -top-24 -right-16 bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_70%)]" aria-hidden="true" />
      <span className="hero-orb w-64 h-64 -bottom-32 left-[20%] bg-[radial-gradient(circle,rgba(255,214,130,0.14),transparent_70%)] animate-float" aria-hidden="true" />
      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="min-w-0 flex items-start gap-4">
          {Icon && <span className="hidden sm:grid icon-tile w-12 h-12 bg-white/10 text-accent-300 shrink-0"><Icon size={22} aria-hidden="true" /></span>}
          <div className="min-w-0">
            {(eyebrow || live) && (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10.5px] font-bold tracking-wide uppercase bg-white/[0.08] text-white/85">
                {live && <span className="live-dot text-success-400" aria-hidden="true" />}
                {eyebrow}
              </span>
            )}
            <h1 className="font-display text-[22px] lg:text-[25px] font-extrabold leading-tight mt-2.5 text-white">{title}</h1>
            {subtitle && <p className="text-[13.5px] text-white/65 mt-1 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="relative mt-5">{children}</div>}
    </section>
  );
}

/** KPI cards; `spark` (number[]) adds a colour-coded trend line. */
export function KpiGrid({ items, cols = 4 }) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 xl:grid-cols-3', 4: 'sm:grid-cols-2 xl:grid-cols-4', 5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5', 6: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' }[cols];
  return (
    <div className={`grid grid-cols-1 ${grid} gap-4`}>
      {items.map(k => {
        const tone = TONES[k.tone] || TONES.primary;
        return (
          <StatCard
            key={k.title}
            title={k.title}
            value={k.value}
            change={k.change}
            changeType={k.changeType}
            subtitle={k.subtitle}
            icon={k.icon}
            iconColor={tone.tile}
            info={k.info}
            to={k.to}
            positiveIsGood={k.positiveIsGood !== false}
            footer={k.spark?.length ? <div className="mt-3 -mx-1"><Sparkline values={k.spark} width={240} height={34} color={k.sparkColor || tone.hex} fill responsive strokeWidth={1.8} /></div> : null}
          />
        );
      })}
    </div>
  );
}

export function Panel({ title, subtitle, actions, children, className = '', bodyClassName = 'card-body', id }) {
  return (
    <section className={`card ${className}`} id={id} aria-label={typeof title === 'string' ? title : undefined}>
      {(title || actions) && (
        <div className="card-header flex-wrap gap-2">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function BarList({ items, max, valueFormatter = (v) => Number(v).toLocaleString() }) {
  const top = max ?? Math.max(1, ...items.map(i => Number(i.value) || 0));
  if (!items.length) return <p className="text-xs text-gray-400">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {items.map(i => {
        const tone = TONES[i.tone] || TONES.primary;
        return (
          <li key={i.label}>
            <div className="flex items-center justify-between gap-3 text-xs mb-1">
              <span className="text-gray-700 font-medium truncate" title={i.label}>{i.label}</span>
              <span className="font-bold text-gray-900 tabular-nums shrink-0">{i.display ?? valueFormatter(i.value)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-[width] duration-700 ease-spring`} style={{ width: `${Math.max(2, ((Number(i.value) || 0) / top) * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const tooltipStyle = { borderRadius: '5px', fontSize: '12px' };

export function TrendChart({ data, xKey, series, type = 'area', height = 280, valueFormatter, stacked = false, showLegend = true }) {
  const fmt = valueFormatter || ((v) => Number(v).toLocaleString());
  const common = { data, margin: { top: 5, right: 10, left: 0, bottom: 0 } };
  const axes = (
    <>
      <CartesianGrid strokeDasharray="4 4" vertical={false} />
      <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} tickFormatter={formatNumber} />
      <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmt(v), n]} />
      {showLegend && series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
    </>
  );
  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'bar' ? (
        <BarChart {...common}>
          {axes}
          {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color || CHART_COLORS[i]} stackId={stacked ? 'a' : undefined} radius={stacked ? 0 : [4, 4, 0, 0]} animationDuration={800} />)}
        </BarChart>
      ) : type === 'line' ? (
        <LineChart {...common}>
          {axes}
          {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color || CHART_COLORS[i]} strokeWidth={2.2} dot={false} activeDot={{ r: 5 }} animationDuration={800} />)}
        </LineChart>
      ) : (
        <AreaChart {...common}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`kit-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color || CHART_COLORS[i]} stopOpacity={0.22} />
                <stop offset="95%" stopColor={s.color || CHART_COLORS[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {axes}
          {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color || CHART_COLORS[i]} strokeWidth={2.2} fill={`url(#kit-grad-${s.key})`} stackId={stacked ? 'a' : undefined} animationDuration={800} />)}
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 240, centerLabel, centerValue, valueFormatter = (v) => Number(v).toLocaleString() }) {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="85%" paddingAngle={2} animationDuration={800}>
            {data.map((d, i) => <Cell key={d.name} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [valueFormatter(v), n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <p className="font-display text-xl font-extrabold text-gray-900 tabular-nums">{centerValue ?? valueFormatter(total)}</p>
          {centerLabel && <p className="text-[11px] text-gray-500">{centerLabel}</p>}
        </div>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color || CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
            <span className="truncate">{d.name}</span>
            <span className="ms-auto font-semibold text-gray-900 tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniTable({ columns, rows, empty = 'No records yet.' }) {
  if (!rows.length) return <p className="text-xs text-gray-400 p-4">{empty}</p>;
  return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr>{columns.map(c => <th key={c.key} className={c.align === 'right' ? 'text-right' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>
              {columns.map(c => <td key={c.key} className={c.align === 'right' ? 'text-right tabular-nums' : ''}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ToneBadge({ tone = 'gray', children, dot = false }) {
  const map = { primary: 'badge-primary', success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger', info: 'badge-info', accent: 'badge-accent', gray: 'badge-secondary' };
  return <span className={`${map[tone] || map.gray} ${dot ? 'badge-dot' : ''}`}>{children}</span>;
}

/** Labels illustrative data, as required for anything not computed from records. */
export function DemoNotice({ children }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-lg border border-accent-200/70 bg-accent-50 text-[13px] text-gray-700 animate-rise-in" role="note">
      <Info size={16} className="text-accent-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
