import React, { useState, useMemo } from 'react';
import PageHeroIcon from '../../components/ui/PageHeroIcon';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, ShoppingCart, Target,
  Award, BarChart3, Eye, Download, CheckCircle2,
  AlertTriangle, ShieldAlert, ArrowUpRight, ArrowDownRight,
  Clock, Flame, Users, Calendar, Filter, Plus, ChevronRight,
  Sparkles, Check, FileText, RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import AvatarGroup from '../../components/ui/AvatarGroup';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import ExportButton from '../../components/ui/ExportButton';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import DataTable from '../../components/tables/DataTable';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialSales, salesReps, dealStatuses } from '../../data/sales';
import { revenueData } from '../../data/dashboard';
import { formatCurrency, formatDate, formatPercent } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';

const COLORS = ['#357A8E', '#7A5CC8', '#2F95C8', '#D97706', '#DC2626', '#16A34A'];

// Customer segments
const segmentData = [
  { name: 'Enterprise', value: 38, fill: '#357A8E' },
  { name: 'Mid-Market', value: 25, fill: '#7A5CC8' },
  { name: 'SMB', value: 18, fill: '#2F95C8' },
  { name: 'Startup', value: 19, fill: '#D97706' },
];

// Sales funnel data
const funnelStages = [
  { name: 'Leads Captured', count: '6,840', pct: '100%', drop: '32.1% drop', color: 'bg-primary' },
  { name: 'Qualified (SQL)', count: '4,644', pct: '67.9%', drop: '39.5% drop', color: 'bg-primary-600' },
  { name: 'Demo Scheduled', count: '2,811', pct: '41.1%', drop: '28.6% drop', color: 'bg-amber-500' },
  { name: 'Proposal Sent', count: '2,007', pct: '29.3%', drop: '41.2% drop', color: 'bg-accent' },
  { name: 'Closed Won', count: '1,180', pct: '17.2%', drop: null, color: 'bg-success' },
];

// Conversion journey steps
const journeySteps = [
  { label: 'First Touch', value: '5,597', rate: '100%' },
  { label: 'Contacted', value: '3,800', rate: '68% move' },
  { label: 'Demoed', value: '2,303', rate: '61% move' },
  { label: 'Negotiated', value: '1,155', rate: '50% move' },
  { label: 'Closed Won', value: '986', rate: '85% move' },
  { label: 'Expanded', value: '332', rate: '34% move' },
];

// At-risk deals
const atRiskDeals = [
  { company: 'Motor Logistics', amount: '$284K', reason: 'No activity in 14 days · Negotiation', risk: 'High', color: 'badge-danger' },
  { company: 'Pinecrest Retail', amount: '$195K', reason: 'Champion left company · Proposal', risk: 'Medium', color: 'badge-warning' },
  { company: 'Orbit Manufacturing', amount: '$155K', reason: 'Budget frozen this quarter', risk: 'Medium', color: 'badge-warning' },
  { company: 'Harbor Point Bank', amount: '$120K', reason: 'Competitor evaluation in progress', risk: 'High', color: 'badge-danger' },
  { company: 'Silverline Media', amount: '$123K', reason: 'Contract redlines stuck in legal', risk: 'Medium', color: 'badge-warning' },
];

// Hot opportunities
const hotOpportunities = [
  { name: 'Meridian Health Systems', stage: 'Negotiation', value: '$152K', color: 'text-primary' },
  { name: 'Falcon Aerospace', stage: 'Commissioning', value: '$254K', color: 'text-success' },
  { name: 'Coastal Grid Energy', stage: 'Technical Review', value: '$189K', color: 'text-info' },
  { name: 'Ridgeline Logistics', stage: 'Legal Review', value: '$142K', color: 'text-accent' },
  { name: 'Brightwave Analytics', stage: 'Early Discovery', value: '$97K', color: 'text-amber-500' },
];

// Upcoming renewals
const upcomingRenewals = [
  { client: 'Harbor Point Bank', renewal: 'Renewed in 8d · $120K ARR', status: 'At Risk', color: 'bg-danger-50 text-danger' },
  { client: 'Meridian Health Systems', renewal: 'Renewed in 14d · $284K ARR', status: 'On Track', color: 'bg-success-50 text-success' },
  { client: 'Falcon Aerospace', renewal: 'Renewed in 21d · $195K ARR', status: 'On Track', color: 'bg-success-50 text-success' },
  { client: 'Coastal Grid Energy', renewal: 'Renewed in 27d · $155K ARR', status: 'At Risk', color: 'bg-danger-50 text-danger' },
];

export default function SalesAnalytics() {
  const [sales] = useLocalStorage('meridian-sales', initialSales);
  const [statusFilter, setStatusFilter] = useState('All');
  const [repFilter, setRepFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const addToast = useToast();

  // KPI Calculations
  const closedDeals = sales.filter(s => s.status === 'Closed');
  const totalRevenue = closedDeals.reduce((s, d) => s + d.value, 0);
  const totalDeals = sales.length;
  const avgDealValue = totalDeals > 0 ? sales.reduce((s, d) => s + d.value, 0) / totalDeals : 0;
  const conversionRate = totalDeals > 0 ? (closedDeals.length / totalDeals * 100) : 0;

  // Filter
  const filteredSales = useMemo(() => {
    let data = sales;
    if (statusFilter !== 'All') data = data.filter(s => s.status === statusFilter);
    if (repFilter !== 'All') data = data.filter(s => s.representative === repFilter);
    if (startDate) data = data.filter(s => s.date >= startDate);
    if (endDate) data = data.filter(s => s.date <= endDate);
    return data;
  }, [sales, statusFilter, repFilter, startDate, endDate]);

  const { query, setQuery, filtered } = useSearch(filteredSales, ['customer', 'product', 'representative', 'id']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'date');
  const pagination = usePagination(sorted, 6);

  const handleExport = () => {
    exportToCSV(sorted, 'sales-analytics-records', [
      { key: 'id', label: 'Order / Deal ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'product', label: 'Service / Package' },
      { key: 'representative', label: 'Representative' },
      { key: 'value', label: 'Value (PKR)' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ]);
    addToast('Sales records exported successfully', 'info');
  };

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      render: (row) => <span className="text-xs font-mono font-medium text-gray-500">#{row.id.replace('deal-', 'SO-48')}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-gray-800">{row.customer}</p>
          <p className="text-[10px] text-gray-400">{row.product}</p>
        </div>
      ),
    },
    {
      key: 'representative',
      label: 'Representative',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-600">{row.representative}</span>,
    },
    {
      key: 'value',
      label: 'Amount',
      sortable: true,
      render: (row) => <span className="text-xs font-bold text-gray-800">{formatCurrency(row.value)}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-500">{formatDate(row.date)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status === 'Closed' ? 'Paid' : row.status === 'In Progress' ? 'Invoiced' : 'Pending'} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* ============ Top Header & Action Buttons ============ */}
      <div className="page-hero mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-no-reveal>
        <PageHeroIcon icon={TrendingUp} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[24px] leading-tight font-extrabold tracking-tight text-gray-900">Revenue Intelligence</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-50 text-success text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live — Q3 Pipeline
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Sales flow overview — revenue vs pipeline & rep performance across all territories</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={handleExport} label="Report" />
          <button className="btn-primary btn-sm"><Plus size={14} /> New Deal</button>
        </div>
      </div>

      {/* ============ Top 4 Mini Metric Cards ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3">
          <p className="text-[10px] uppercase font-semibold text-gray-400">Closed-Won Revenue</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5">
            <AnimatedCounter value={totalRevenue} formatter={(v) => formatCurrency(v)} />
          </p>
          <p className="text-[10px] text-success font-medium mt-0.5">+25.4% MoM</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] uppercase font-semibold text-gray-400">Quota Attained</p>
          <p className="text-lg font-bold text-primary mt-0.5">
            <AnimatedCounter value={84} suffix="%" />
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Target: PKR 60M</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] uppercase font-semibold text-gray-400">Win Rate</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5">
            <AnimatedCounter value={68} suffix="%" />
          </p>
          <p className="text-[10px] text-success font-medium mt-0.5">+4.2% vs Q2</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] uppercase font-semibold text-gray-400">Open Pipeline</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5">
            <AnimatedCounter value={9140000} formatter={(v) => formatCurrency(v)} />
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">312 active ops</p>
        </div>
      </div>

      {/* ============ Executive KPI Strip ============ */}
      <div className="card p-4 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 gap-y-3 md:gap-y-0">
          <div className="px-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-gray-400">Closed-Won (YTD)</span>
              <span className="badge-success text-[9px]">+25.4% MoM</span>
            </div>
            <p className="text-xl font-bold text-gray-800 mt-1">
              <AnimatedCounter value={totalRevenue} formatter={(v) => formatCurrency(v)} />
            </p>
            <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '84%' }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">84% of quota attained</p>
          </div>
          <div className="px-3">
            <span className="text-[10px] uppercase font-semibold text-gray-400">Sales Velocity</span>
            <p className="text-xl font-bold text-gray-800 mt-1">
              <AnimatedCounter value={18400} formatter={(v) => formatCurrency(v)} /><span className="text-xs font-normal text-gray-400">/day</span>
            </p>
            <p className="text-[10px] text-success font-medium mt-2">+12.8% vs plan</p>
          </div>
          <div className="px-3">
            <span className="text-[10px] uppercase font-semibold text-gray-400">Avg Deal Cycle</span>
            <p className="text-xl font-bold text-gray-800 mt-1">
              <AnimatedCounter value={23.6} decimals={1} suffix=" days" />
            </p>
            <p className="text-[10px] text-success font-medium mt-2">-3.1 days faster</p>
          </div>
          <div className="px-3">
            <span className="text-[10px] uppercase font-semibold text-gray-400">Open Pipeline</span>
            <p className="text-xl font-bold text-gray-800 mt-1">
              <AnimatedCounter value={9140000} formatter={(v) => formatCurrency(v)} />
            </p>
            <p className="text-[10px] text-gray-400 mt-2">312 active opportunities</p>
          </div>
        </div>
      </div>

      {/* ============ Sales Funnel & Q3 Forecast ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Funnel - Lead to Close */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">Sales Funnel — Lead to Close</h2>
              <p className="text-[11px] text-gray-400">Rolling 90-day cohort, all territories</p>
            </div>
            <span className="badge-primary text-[10px]">6,840 leads in</span>
          </div>
          <div className="space-y-3">
            {funnelStages.map((stage, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{stage.count}</span>
                    <span className="text-[11px] text-gray-400">({stage.pct})</span>
                  </div>
                </div>
                <div className="h-7 rounded-lg bg-gray-100 overflow-hidden relative">
                  <div
                    className={`h-full ${stage.color} rounded-lg flex items-center justify-end pr-3 text-white text-xs font-bold transition-all`}
                    style={{ width: `${100 - i * 18}%` }}
                  >
                    {stage.count}
                  </div>
                </div>
                {stage.drop && (
                  <p className="text-[9px] text-danger font-medium mt-0.5 text-right">↓ {stage.drop}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Q3 Revenue Forecast */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Q3 Revenue Forecast</h3>
              <span className="badge-info text-[9px]">AI Projected</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gray-50">
                <p className="text-[10px] text-gray-400">Projected Close</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">{formatCurrency(14900000)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50">
                <p className="text-[10px] text-gray-400">Confidence</p>
                <p className="text-base font-bold text-success mt-0.5">66.2%</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">July (actual)</span>
                <span className="font-bold text-gray-800">{formatCurrency(4620000)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">August (projected)</span>
                <span className="font-bold text-gray-800">{formatCurrency(5100000)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">September (expected)</span>
                <span className="font-bold text-gray-800">{formatCurrency(5180000)}</span>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-primary-50/60 border border-primary/20 text-xs text-primary-900">
              💡 <strong>At current velocity:</strong> Q3 lands at 94.1% of quota. Closing 3 stalled enterprise deals (PKR 1.1M) pushes target past 100%.
            </div>
          </div>
          <button className="w-full mt-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            View Full Forecast Model
          </button>
        </div>
      </div>

      {/* ============ Sales Activity Heatmap & Customer Segments ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heatmap (2 cols) */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Sales Activity Heatmap</h3>
              <p className="text-[10px] text-gray-400">Deal touches by day & hour, last 4 weeks</p>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-400">
              <span>Low</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-primary-100" />
              <span className="w-2.5 h-2.5 rounded-xs bg-primary-300" />
              <span className="w-2.5 h-2.5 rounded-xs bg-primary-500" />
              <span className="w-2.5 h-2.5 rounded-xs bg-primary-800" />
              <span>High</span>
            </div>
          </div>
          {/* Simulated weekly heatmap grid */}
          <div className="space-y-1.5 py-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, di) => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-8 text-[10px] text-gray-400">{day}</span>
                <div className="flex-1 grid grid-cols-12 gap-1">
                  {[20, 40, 60, 90, 80, 50, 70, 85, 95, 40, 30, 10].map((val, hi) => {
                    const opacity = ((val + di * 10) % 100) / 100;
                    return (
                      <div
                        key={hi}
                        className="h-4 rounded-xs bg-primary"
                        style={{ opacity: Math.max(0.12, opacity) }}
                        title={`${day} ${8 + hi}:00 - activity ${Math.round(val)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-100 text-center">
            <div><p className="text-[9px] text-gray-400">Peak Window</p><p className="text-xs font-bold text-gray-800 mt-0.5">Tue–Wed, 10a–12p</p></div>
            <div><p className="text-[9px] text-gray-400">Rep of Week</p><p className="text-xs font-bold text-primary mt-0.5">Sarah Ahmed</p></div>
            <div><p className="text-[9px] text-gray-400">Touches / Week</p><p className="text-xs font-bold text-gray-800 mt-0.5">1,340 avg</p></div>
          </div>
        </div>

        {/* Customer Segments Donut */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer Segments</h3>
            <span className="badge-secondary text-[9px]">2,198 Accounts</span>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={segmentData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" isAnimationActive={true} animationDuration={1400}>
                  {segmentData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-gray-400">Total Book</span>
              <span className="text-base font-bold text-gray-800">2,198</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {segmentData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                  {s.name}
                </span>
                <span className="font-bold text-gray-800">{s.value}%</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 mt-3 text-center">
            Enterprise accounts carry 62% of total ARR
          </p>
        </div>
      </div>

      {/* ============ Sales Leaderboard & At-Risk Deals ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Leaderboard */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Sales Leaderboard</h3>
            <span className="badge-primary text-[9px]">Q3 Rankings</span>
          </div>
          <div className="flex justify-around items-end py-3 border-b border-gray-100">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-white shadow mx-auto flex items-center justify-center font-bold text-xs text-amber-700">AK</div>
              <p className="text-[10px] font-bold text-gray-700 mt-1">Ali Khan</p>
              <p className="text-[10px] font-semibold text-primary">{formatCurrency(1280000)}</p>
            </div>
            {/* 1st Place */}
            <div className="text-center -mt-2">
              <span className="text-base">👑</span>
              <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary shadow mx-auto flex items-center justify-center font-bold text-sm text-primary">SA</div>
              <p className="text-xs font-bold text-gray-800 mt-1">Sarah Ahmed</p>
              <p className="text-xs font-bold text-success">{formatCurrency(1420000)}</p>
            </div>
            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-11 h-11 rounded-full bg-blue-100 border-2 border-white shadow mx-auto flex items-center justify-center font-bold text-xs text-blue-700">OF</div>
              <p className="text-[10px] font-bold text-gray-700 mt-1">Omar Farooq</p>
              <p className="text-[10px] font-semibold text-primary">{formatCurrency(1060000)}</p>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            {[
              { rank: 4, name: 'Fatima Zahra', rev: 892000, region: 'Operations QA' },
              { rank: 5, name: 'Dr. Kamran Hussain', rev: 714000, region: 'Lab Testing' },
            ].map(r => (
              <div key={r.rank} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs">
                <span className="flex items-center gap-2">
                  <span className="font-bold text-gray-400">{r.rank}</span>
                  <span className="font-medium text-gray-700">{r.name}</span>
                </span>
                <span className="font-bold text-gray-800">{formatCurrency(r.rev)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Deals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">At-Risk Deals</h3>
            <span className="badge-danger text-[9px]">5 Flagged</span>
          </div>
          <div className="space-y-2.5">
            {atRiskDeals.map((deal, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-800 truncate">{deal.company}</p>
                    <span className="text-xs font-bold text-gray-900">{deal.amount}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{deal.reason}</p>
                </div>
                <span className={`${deal.color} text-[9px] shrink-0 ml-2`}>{deal.risk}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-1.5 rounded-lg border border-danger/30 text-danger text-xs font-semibold hover:bg-danger-50 transition-colors flex items-center justify-center gap-1.5">
            <ShieldAlert size={13} /> Open Save-the-Deal Playbook
          </button>
        </div>
      </div>

      {/* ============ Conversion Journey (Chevron Steps) ============ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Conversion Journey</h3>
            <p className="text-[10px] text-gray-400">Average partition from first touch to expansion revenue</p>
          </div>
          <span className="badge-success text-[10px]">17.2% overall conversion</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {journeySteps.map((step, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center relative">
              <p className="text-[10px] text-gray-400">{step.label}</p>
              <p className="text-base font-bold text-gray-800 mt-1">{step.value}</p>
              <p className="text-[9px] text-primary font-semibold mt-1">{step.rate}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ============ Recent Orders Table ============ */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-gray-800">Recent Orders</h2>
            <p className="text-[11px] text-gray-400">Real-time closed deals & invoices</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search deals..." className="w-full sm:w-56" />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'All', label: 'All Statuses' }, ...dealStatuses.map(s => ({ value: s, label: s }))]}
            />
            <FilterDropdown
              value={repFilter}
              onChange={setRepFilter}
              options={[{ value: 'All', label: 'All Reps' }, ...salesReps.map(r => ({ value: r, label: r }))]}
            />
            <ExportButton onClick={handleExport} />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={pagination.paginatedData}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          pagination={pagination}
          emptyTitle="No orders found"
          emptyDescription="Try adjusting your filters."
          actions={(row) => (
            <button onClick={() => setViewModal(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-info hover:bg-info/10">
              <Eye size={14} />
            </button>
          )}
        />
      </div>

      {/* ============ Revenue Streams, Hot Opportunities, Smart Recommendations ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Streams */}
        <div className="card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Revenue Streams</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">New Business</span>
                <span className="font-bold text-gray-800">{formatCurrency(2490000)} (54%)</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '54%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Expansion</span>
                <span className="font-bold text-gray-800">{formatCurrency(1294000)} (36%)</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '36%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Renewals</span>
                <span className="font-bold text-gray-800">{formatCurrency(836000)} (10%)</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-info rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-4 bg-gray-50 p-2.5 rounded-lg">
            ⚡ New business captures 54% share of Q3 revenue. Renewals expected to grow to 24% next quarter.
          </p>
        </div>

        {/* Hot Opportunities */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Hot Opportunities</h3>
            <span className="badge-warning text-[9px]">High Priority</span>
          </div>
          <div className="space-y-2">
            {hotOpportunities.map((op, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{op.name}</p>
                  <p className="text-[10px] text-gray-400">{op.stage}</p>
                </div>
                <span className={`text-xs font-bold ${op.color}`}>{op.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Smart Recommendations</h3>
            <span className="badge-primary text-[9px]">AI Triggered</span>
          </div>
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-success-50/60 border border-success/20 text-xs">
              <span className="badge-success text-[9px] mb-1 inline-block">High Impact</span>
              <p className="font-medium text-gray-800">Reps who follow up within 1 hour of demo close <strong>2.4x more often</strong>.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber/20 text-xs">
              <span className="badge-warning text-[9px] mb-1 inline-block">Action Needed</span>
              <p className="font-medium text-gray-800">3 deals have sat in Negotiation for 14+ days — flag for manager review.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary-50/60 border border-primary/20 text-xs">
              <span className="badge-primary text-[9px] mb-1 inline-block">Opportunity</span>
              <p className="font-medium text-gray-800">Enterprise accounts with 2+ product lines renew at 94% — bundle ISO + SPC packages.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Win/Loss Report & Upcoming Renewals ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Win/Loss Report */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Competitive Win/Loss Report</h3>
            <span className="badge-info text-[9px]">120 Closed Deals</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center py-2 mb-3 bg-gray-50 rounded-xl">
            <div><p className="text-[10px] text-gray-400">Win Rate</p><p className="text-base font-bold text-success">25%</p></div>
            <div><p className="text-[10px] text-gray-400">vs Top Rival</p><p className="text-base font-bold text-gray-800">20%</p></div>
            <div><p className="text-[10px] text-gray-400">Avg Win Size</p><p className="text-base font-bold text-primary">$25.6K</p></div>
            <div><p className="text-[10px] text-gray-400">Avg Loss Size</p><p className="text-base font-bold text-danger">$15.4K</p></div>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-600">Product breadth & QMS integration</span>
                <span className="font-semibold text-success">31% (Top Win)</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-success rounded-full" style={{ width: '31%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-600">Missing enterprise SSO/SAML</span>
                <span className="font-semibold text-danger">29% (Top Loss)</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-danger rounded-full" style={{ width: '29%' }} /></div>
            </div>
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Upcoming Renewals</h3>
            <span className="badge-danger text-[9px]">2 at risk</span>
          </div>
          <div className="space-y-2.5">
            {upcomingRenewals.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{r.client}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{r.renewal}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.color}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ View Modal ============ */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Order / Deal Details" size="md">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{viewModal.customer}</h3>
                <p className="text-sm text-gray-500">{viewModal.product}</p>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400">Order ID</p><p className="text-sm font-mono text-gray-700">#{viewModal.id}</p></div>
              <div><p className="text-xs text-gray-400">Representative</p><p className="text-sm font-medium text-gray-700">{viewModal.representative}</p></div>
              <div><p className="text-xs text-gray-400">Value</p><p className="text-sm font-semibold text-gray-800">{formatCurrency(viewModal.value)}</p></div>
              <div><p className="text-xs text-gray-400">Date</p><p className="text-sm font-medium text-gray-700">{formatDate(viewModal.date)}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
