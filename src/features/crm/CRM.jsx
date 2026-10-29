import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Plus, Pencil, Trash2, Eye, Users, Target,
  TrendingUp, Award, Phone, Mail, Building2,
  DollarSign, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle2, AlertCircle, Filter, Download,
  Briefcase, ChevronRight, Sparkles, Flame, Check
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import AvatarGroup from '../../components/ui/AvatarGroup';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import ExportButton from '../../components/ui/ExportButton';
import DataTable from '../../components/tables/DataTable';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialLeads, leadSources, leadStatuses } from '../../data/leads';
import { formatCurrency, formatDate, generateId } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';
import { CHART as PALETTE_CHART, TOOLTIP_STYLE } from '../../lib/chartColors';

const leadSchema = z.object({
  contactName: z.string().min(2, 'Contact Name is required'),
  company: z.string().min(2, 'Company is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone is required'),
  source: z.string().min(1, 'Source is required'),
  status: z.string().min(1, 'Status is required'),
  assignedTo: z.string().min(2, 'Assigned representative is required'),
  dealValue: z.coerce.number().min(0, 'Deal value must be positive'),
  notes: z.string().optional(),
});

// Palette chart colours (theme-aware CSS variables)
const CHART = { ...PALETTE_CHART, sea: PALETTE_CHART.bright, burnt: PALETTE_CHART.rust };

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

// Probability chip: green when near-certain, teal when likely, orange when contested
const probBadge = (prob) => {
  const p = parseInt(prob, 10);
  if (p >= 90) return 'badge-success';
  if (p >= 75) return 'badge-primary';
  if (p >= 60) return 'badge-accent';
  return 'badge-warning';
};

// Stage colours used by the stage list and the pipeline board
const STAGE_DOT = {
  New: 'bg-teal-300',
  Qualified: 'bg-teal-700',
  Proposal: 'bg-accent',
  Negotiation: 'bg-primrose-500',
  Won: 'bg-success',
};

const PIPELINE_STAGES = [
  { name: 'New', count: 12, value: 184000 },
  { name: 'Qualified', count: 18, value: 412000 },
  { name: 'Proposal', count: 14, value: 528000 },
  { name: 'Negotiation', count: 9, value: 396000 },
  { name: 'Won', count: 9, value: 240000 },
];
const maxStageValue = Math.max(...PIPELINE_STAGES.map(st => st.value));

// Top Deals Cards data matching reference
const topDealsData = [
  { id: 'td-1', code: 'CR', color: 'bg-teal-800 text-primrose', company: 'Cascade Retail Grp', location: 'Chicago, IL · Renewal', value: 210000, rep: 'Renee Foster', prob: '92%' },
  { id: 'td-2', code: 'VR', color: 'bg-accent text-primary-ink', company: 'Vantage Retail', location: 'Austin, TX · Expansion', value: 142500, rep: 'Marco Diaz', prob: '68%' },
  { id: 'td-3', code: 'NW', color: 'bg-teal-500 text-white', company: 'Northwind Corp', location: 'Seattle, WA · New Business', value: 96000, rep: 'Renee Foster', prob: '81%' },
  { id: 'td-4', code: 'ML', color: 'bg-primrose on-primrose', company: 'Meridian Labs', location: 'Boston, MA · New Business', value: 54200, rep: 'Marco Diaz', prob: '54%' },
  { id: 'td-5', code: 'BP', color: 'bg-rust text-white', company: 'BrightPath Inc', location: 'Denver, CO · Closed Won', value: 27800, rep: 'Carlos Mendez', prob: '95%' },
];

// Revenue analytics MRR data
const mrrData = [
  { month: 'Feb', actual: 140, forecast: 142 },
  { month: 'Mar', actual: 148, forecast: 146 },
  { month: 'Apr', actual: 154, forecast: 152 },
  { month: 'May', actual: 161, forecast: 159 },
  { month: 'Jun', actual: 167, forecast: 165 },
  { month: 'Jul', actual: 176, forecast: 172 },
  { month: 'Aug', actual: 186, forecast: 180 },
];

// Deal sources breakdown
const dealSourcesData = [
  { name: 'Organic Search', value: 240, fill: CHART.teal },
  { name: 'Referral', value: 180, fill: CHART.orange },
  { name: 'Paid Ads', value: 110, fill: CHART.sea },
  { name: 'Email Campaign', value: 75, fill: CHART.primrose },
  { name: 'Events', value: 43, fill: CHART.burnt },
];

// Revenue by region
const regionalData = [
  { region: 'North America', revenue: 842 },
  { region: 'Europe', revenue: 614 },
  { region: 'APAC', revenue: 380 },
  { region: 'LATAM', revenue: 226 },
  { region: 'MEA', revenue: 110 },
];

// Pipeline board Kanban data
const initialBoard = {
  New: [
    { id: 'b-1', title: 'Halcyon Freight', value: 38000, tag: 'Logistics', prob: '28%', rep: 'AH' },
    { id: 'b-2', title: 'Aurora Biotech', value: 61500, tag: 'Biotech', subTag: 'Hot', prob: '22%', rep: 'SF' },
    { id: 'b-3', title: 'Prime Fixtures Co.', value: 19800, tag: 'Retail', prob: '18%', rep: 'RK' },
  ],
  Qualified: [
    { id: 'b-4', title: 'Meridian Labs', value: 54200, tag: 'Medtech', subTag: 'Watching', prob: '54%', rep: 'MD' },
    { id: 'b-5', title: 'Solace Health', value: 18400, tag: 'Healthcare', subTag: 'At Risk', prob: '54%', rep: 'RF' },
    { id: 'b-6', title: 'Silverline Media', value: 44700, tag: 'Media', prob: '47%', rep: 'CM' },
  ],
  Proposal: [
    { id: 'b-7', title: 'Vantage Retail', value: 142500, tag: 'Retail', subTag: 'Medium', prob: '68%', rep: 'MD' },
    { id: 'b-8', title: 'Cobalt Insurance', value: 88900, tag: 'Insurance', prob: '63%', rep: 'RF' },
  ],
  Negotiation: [
    { id: 'b-9', title: 'Cascade Retail Grp', value: 210000, tag: 'Retail', subTag: 'High Priority', prob: '92%', rep: 'RF' },
    { id: 'b-10', title: 'Orbit Logistics', value: 27800, tag: 'Transportation', subTag: 'At Risk', prob: '22%', rep: 'NW' },
  ],
  Won: [
    { id: 'b-11', title: 'Northwind Corp', value: 96000, tag: 'Closed Won', prob: '100%', rep: 'RF' },
    { id: 'b-12', title: 'BrightPath Inc', value: 27800, tag: 'Closed Won', prob: '100%', rep: 'CM' },
  ],
};

export default function CRM() {
  const [leads, setLeads] = useLocalStorage('meridian-leads', initialLeads);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [quickFilter, setQuickFilter] = useState('All');
  const addToast = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(leadSchema),
  });

  // KPI Calculations
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const totalPipeline = leads.reduce((s, l) => s + l.dealValue, 0);

  // Filter
  const filteredByFilters = useMemo(() => {
    let data = leads;
    if (statusFilter !== 'All') data = data.filter(l => l.status === statusFilter);
    if (sourceFilter !== 'All') data = data.filter(l => l.source === sourceFilter);
    if (quickFilter === 'At Risk') data = data.filter(l => l.status === 'Lost' || l.dealValue < 500000);
    if (quickFilter === 'Hot Lead') data = data.filter(l => l.dealValue > 2000000);
    return data;
  }, [leads, statusFilter, sourceFilter, quickFilter]);

  const { query, setQuery, filtered } = useSearch(filteredByFilters, ['contactName', 'company', 'email', 'assignedTo']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'contactName');
  const pagination = usePagination(sorted, 7);

  const openCreate = () => {
    setEditingLead(null);
    reset({ contactName: '', company: '', email: '', phone: '', source: 'Website', status: 'New', assignedTo: 'Sarah Ahmed', dealValue: 500000, notes: '' });
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    Object.keys(lead).forEach(k => {
      if (['contactName', 'company', 'email', 'phone', 'source', 'status', 'assignedTo', 'dealValue', 'notes'].includes(k)) {
        setValue(k, lead[k]);
      }
    });
    setModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingLead) {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...data, lastContact: new Date().toISOString().split('T')[0] } : l));
      addToast('Lead updated successfully', 'success');
    } else {
      const newLead = { ...data, id: generateId(), lastContact: new Date().toISOString().split('T')[0] };
      setLeads(prev => [newLead, ...prev]);
      addToast('Lead created successfully', 'success');
    }
    setModalOpen(false);
    reset();
  };

  const handleDelete = () => {
    setLeads(prev => prev.filter(l => l.id !== deleteDialog.id));
    addToast('Lead deleted successfully', 'success');
    setDeleteDialog(null);
  };

  const handleExport = () => {
    exportToCSV(sorted, 'meridian-deals', [
      { key: 'contactName', label: 'Contact Name' },
      { key: 'company', label: 'Company' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'assignedTo', label: 'Owner' },
      { key: 'dealValue', label: 'Value (PKR)' },
      { key: 'lastContact', label: 'Last Contact' },
    ]);
    addToast('CSV exported successfully', 'info');
  };

  const columns = [
    {
      key: 'company',
      label: 'Deal Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-gray-800">{row.company} · New Business</p>
          <p className="text-[11px] text-gray-400">{row.contactName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Stage',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'dealValue',
      label: 'Value',
      sortable: true,
      render: (row) => <span className="text-xs font-bold text-gray-800">{formatCurrency(row.dealValue)}</span>,
    },
    {
      key: 'source',
      label: 'Tags',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="badge-secondary text-[10px]">{row.source}</span>
          {row.dealValue > 2000000 && <span className="badge-success text-[10px]">High Value</span>}
        </div>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Owner',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-brand">
            {row.assignedTo.charAt(0)}
          </div>
          <span className="text-xs text-gray-600">{row.assignedTo}</span>
        </div>
      ),
    },
    {
      key: 'probability',
      label: 'Probability',
      render: (row) => {
        const prob = row.status === 'Won' ? 100 : row.status === 'Lost' ? 0 : row.status === 'Proposal' ? 70 : 45;
        return <span className="text-xs font-semibold text-gray-700">{prob}%</span>;
      },
    },
    {
      key: 'actionStatus',
      label: 'Status',
      render: (row) => {
        const isWatch = row.status === 'Proposal';
        const isAtRisk = row.status === 'Lost';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isAtRisk ? 'bg-danger-50 text-danger' : isWatch ? 'bg-warning-50 text-warning' : 'bg-success-50 text-success'
          }`}>
            {isAtRisk ? 'At Risk' : isWatch ? 'Watch' : 'Active'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* ============ Hero: Meridian field-notes banner ============ */}
      <section className="hero-meridian p-5 sm:p-7 xl:p-9 xl:min-h-[360px] animate-rise-in" data-no-reveal>
        <div className="orbit-art hidden xl:block" aria-hidden="true">
          <span className="halo" />
          <span className="ring" />
          <span className="ring two" />
          <div className="orbit-core">
            <span className="block text-[9px] font-bold tracking-[0.15em]">MEQMP / PIPELINE</span>
            <strong className="block text-[24px] leading-[0.95] font-extrabold tracking-[-0.05em] mt-6 tabular-nums">{formatCurrency(totalPipeline)}</strong>
            <small className="block text-[10px] leading-snug mt-3 opacity-80">Pipeline value across every stage.</small>
          </div>
          <span className="orbit-tag" style={{ top: '13%', left: '6%' }}>01 / QUALIFY</span>
          <span className="orbit-tag" style={{ right: '3%', top: '38%' }}>02 / PROPOSE</span>
          <span className="orbit-tag" style={{ bottom: '12%', left: '14%' }}>03 / CLOSE</span>
          <span className="orbit-cross" style={{ right: '16%', bottom: '20%' }} />
        </div>

        <div className="relative xl:max-w-[54%]">
          <p className="hero-label">MERIDIAN / CRM · DEALS WORKSPACE</p>
          <p className="hero-eyebrow mt-5 flex items-center gap-2">
            <span className="live-dot text-accent" aria-hidden="true" /> Live · Enterprise + Mid-Market
          </p>
          <h1 className="font-display text-[34px] sm:text-[44px] xl:text-[52px] leading-[0.95] font-extrabold tracking-[-0.05em] mt-3">
            Deals <em>Workspace</em>
          </h1>
          <p className="text-[14px] leading-relaxed text-white/75 mt-4 max-w-md">
            312 open deals · {formatCurrency(totalPipeline)} pipeline · Enterprise + Mid-Market
          </p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <button type="button" className="btn-primrose" onClick={openCreate}>
              <Plus size={15} aria-hidden="true" /> New Deal <span className="arrow" aria-hidden="true">↗</span>
            </button>
            <button type="button" className="btn-line-light" onClick={() => scrollToId('crm-pipeline-board')}>
              Pipeline board <span className="arrow" aria-hidden="true">↘</span>
            </button>
            <button type="button" className="btn-line-light" onClick={handleExport}>
              <Download size={14} aria-hidden="true" /> Export CSV
            </button>
          </div>
          <div className="hero-meta mt-7">
            <span>312 open deals</span>
            <span>· 62 on the board</span>
            <span>· 31% lead → close</span>
            <span>· 14 closing this week</span>
          </div>
        </div>
      </section>

      {/* ============ Primrose ticker: top deals ============ */}
      <div className="ticker" role="region" aria-label="Top deals">
        <div className="ticker-track">
          {[0, 1].map(copy => (
            <React.Fragment key={copy}>
              {topDealsData.map(td => (
                <span key={`${copy}-${td.id}`} className="inline-flex items-center gap-2.5" aria-hidden={copy === 1 ? 'true' : undefined}>
                  {td.company}<b>{formatCurrency(td.value)}</b><span className="sep">· {td.prob} ✦</span>
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ============ 01 / Executive Metric Strip (6 Metrics) ============ */}
      <section className="card p-4 animate-slide-up data-wall" aria-labelledby="crm-metrics-title">
        <div className="flex items-end justify-between gap-3 px-3 pb-3 mb-1 border-b border-gray-100">
          <div>
            <p className="kicker">01 / Executive metrics</p>
            <h2 id="crm-metrics-title" className="text-[17px] font-extrabold tracking-tight text-gray-900 mt-1">Pipeline at a <span className="serif-em text-kicker">glance.</span></h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-gray-100 gap-y-3 md:gap-y-0 pt-2">
          <div className="px-3 py-2">
            <p className="metric-no">01</p>
            <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-gray-500 mt-1.5">Pipeline Value</p>
            <p className="text-[19px] font-extrabold tracking-tight text-gray-900 mt-1 tabular-nums">
              <AnimatedCounter value={totalPipeline} formatter={(v) => formatCurrency(v)} />
            </p>
            <p className="text-[10px] text-success font-semibold mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +9.4%
            </p>
          </div>
          <div className="px-3 py-2">
            <p className="metric-no">02</p>
            <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-gray-500 mt-1.5">Active Deals</p>
            <p className="text-[19px] font-extrabold tracking-tight text-gray-900 mt-1 tabular-nums">
              <AnimatedCounter value={totalLeads} />
            </p>
            <div className="flex items-end gap-0.5 h-3 mt-1">
              {[30, 45, 60, 40, 75, 90, 80].map((h, i) => (
                <div key={i} className={`flex-1 rounded-xs ${i === 5 ? 'bg-accent' : 'bg-primary-400'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="text-[10px] text-success font-semibold mt-0.5">+8.6%</p>
          </div>
          <div className="px-3 py-2">
            <p className="metric-no">03</p>
            <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-gray-500 mt-1.5">Win Rate</p>
            <p className="text-[19px] font-extrabold tracking-tight text-gray-900 mt-1 tabular-nums">
              <AnimatedCounter value={59} suffix="%" />
            </p>
            <p className="text-[10px] text-success font-semibold mt-0.5">+3 pts</p>
          </div>
          <div className="px-3 py-2">
            <p className="metric-no">04</p>
            <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-gray-500 mt-1.5">Avg Deal Size</p>
            <p className="text-[19px] font-extrabold tracking-tight text-gray-900 mt-1 tabular-nums">
              <AnimatedCounter value={842000} formatter={(v) => formatCurrency(v)} />
            </p>
            <p className="text-[10px] text-success font-semibold mt-0.5">+6.1%</p>
          </div>
          <div className="px-3 py-2">
            <p className="metric-no">05</p>
            <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-gray-500 mt-1.5">Avg Sales Cycle</p>
            <p className="text-[19px] font-extrabold tracking-tight text-gray-900 mt-1 tabular-nums">
              <AnimatedCounter value={38} suffix=" days" />
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">-2 days vs plan</p>
          </div>
          <div className="px-3 py-2">
            <p className="metric-no">06</p>
            <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-gray-500 mt-1.5">Closing This Week</p>
            <p className="text-[19px] font-extrabold tracking-tight text-gray-900 mt-1 tabular-nums">
              <AnimatedCounter value={14} /> · {formatCurrency(268000)}
            </p>
            <p className="text-[10px] text-accent-700 font-semibold mt-0.5">3 need action</p>
          </div>
        </div>
      </section>

      {/* ============ 02 / Top Deals ============ */}
      <section aria-labelledby="crm-top-deals-title">
        <div className="flex items-end justify-between gap-3 mb-3 px-1">
          <div>
            <p className="kicker">02 / Opportunities</p>
            <h2 id="crm-top-deals-title" className="text-[17px] font-extrabold tracking-tight text-gray-900 mt-1">Top Deals <span className="serif-em text-kicker">in play.</span></h2>
          </div>
          <button type="button" onClick={() => scrollToId('crm-recent-deals')} className="text-xs text-brand font-bold hover:underline underline-offset-4 shrink-0">View All Deals ↗</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topDealsData.map((td, i) => (
            <div key={td.id} className="card card-lift deal-card p-4 flex flex-col">
              <div className="flex items-center justify-between">
                <span className={`w-8 h-8 rounded-lg ${td.color} flex items-center justify-center text-[10px] font-extrabold tracking-wide`}>
                  {td.code}
                </span>
                <span className={`${probBadge(td.prob)} text-[10px] px-2`}>
                  {td.prob}
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-kicker mt-3">{String(i + 1).padStart(2, '0')} / DEAL</p>
              <p className="text-[13px] font-extrabold text-gray-900 mt-1 truncate">{td.company}</p>
              <p className="text-[10.5px] text-gray-500 truncate">{td.location}</p>
              <p className="text-[18px] font-extrabold tracking-tight text-gray-900 mt-3 tabular-nums">{formatCurrency(td.value)}</p>
              <span className="deal-rule mt-2" aria-hidden="true" />
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[9px] font-bold text-brand-strong shrink-0">
                    {td.rep.charAt(0)}
                  </div>
                  <span className="text-[10.5px] text-gray-600 truncate">{td.rep}</span>
                </div>
                <span className="deal-arrow w-7 h-7 rounded-full border border-gray-200 grid place-items-center text-xs text-gray-500 shrink-0" aria-hidden="true">↗</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 03 / Pipeline & Kanban Section ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Quick Stats & Filters */}
        <div className="space-y-4">
          {/* Pipeline Stages Summary */}
          <div className="card p-4">
            <p className="kicker mb-1">03 / Stages</p>
            <h3 className="text-[15px] font-extrabold text-gray-900 mb-3">Pipeline Stages</h3>
            <div className="space-y-1.5">
              {PIPELINE_STAGES.map((st) => (
                <div key={st.name} className="ledger-row p-2 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_DOT[st.name]}`} />
                      <span className="text-xs font-semibold text-gray-800">{st.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums">{st.count} · {formatCurrency(st.value)} <span className="ledger-arrow inline-block" aria-hidden="true">↗</span></span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden mt-1.5">
                    <div className={`h-full rounded-full ${STAGE_DOT[st.name]}`} style={{ width: `${(st.value / maxStageValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="card p-4">
            <p className="kicker mb-1">Filter</p>
            <h3 className="text-[15px] font-extrabold text-gray-900 mb-2.5">Quick Filters</h3>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Enterprise', 'Mid-Market', 'SMB', 'At Risk', 'Renewal', 'Hot Lead'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setQuickFilter(f)}
                  aria-pressed={quickFilter === f}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    quickFilter === f
                      ? 'chip-active'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:-translate-y-px'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Top Reps */}
          <div className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="kicker mb-1">Leaderboard</p>
                <h3 className="text-[15px] font-extrabold text-gray-900">Top Reps</h3>
              </div>
              <span className="badge-secondary text-[9px]">Quarter</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Renee Foster', percent: 142, color: 'bg-teal-700' },
                { name: 'Marco Diaz', percent: 128, color: 'bg-accent' },
                { name: 'Carlos Mendez', percent: 104, color: 'bg-primrose-500' },
              ].map((rep, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-kicker tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-[9px] font-bold text-brand">
                        {rep.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-700">{rep.name}</span>
                    </div>
                    <span className="font-bold text-brand tabular-nums">{rep.percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full progress-fill ${rep.color}`} style={{ width: `${Math.min(100, rep.percent / 1.5)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 3-Columns: Deal Pipeline Board (Kanban) */}
        <div id="crm-pipeline-board" className="lg:col-span-3 card p-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
            <div>
              <p className="kicker">04 / Pipeline board</p>
              <h2 className="text-[17px] font-extrabold tracking-tight text-gray-900 mt-1">Deal Pipeline <span className="serif-em text-kicker">Board</span></h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Drag deals across stages · 62 active opportunities</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primrose on-primrose text-[10px] font-extrabold tracking-wide self-start sm:self-auto">
              ⚡ 31% lead → close
            </span>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-2">
            {Object.entries(initialBoard).map(([stage, items]) => (
              <div key={stage} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col min-w-[170px] relative overflow-hidden">
                <span className={`absolute inset-x-0 top-0 h-[3px] ${STAGE_DOT[stage]}`} aria-hidden="true" />
                <div className="flex items-center justify-between mb-2 px-1 pt-1">
                  <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${STAGE_DOT[stage]}`} />
                    {stage}
                  </span>
                  <span className="text-[10px] font-extrabold text-gray-500 tabular-nums">{String(items.length).padStart(2, '0')}</span>
                </div>
                <div className="space-y-2 flex-1">
                  {items.map(deal => (
                    <div key={deal.id} className="bg-white p-2.5 rounded-lg border border-gray-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-primary-400 transition-all">
                      <p className="text-xs font-bold text-gray-900 truncate">{deal.title}</p>
                      <p className="text-xs font-extrabold text-gray-900 mt-0.5 tabular-nums">{formatCurrency(deal.value)}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="badge-secondary text-[9px] px-1.5 py-0">{deal.tag}</span>
                        {deal.subTag && (
                          <span className={`${deal.subTag === 'At Risk' ? 'badge-danger' : deal.subTag === 'Hot' ? 'badge-accent' : 'badge-info'} text-[9px] px-1.5 py-0`}>
                            {deal.subTag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center text-[9px] font-bold text-brand-strong">
                          {deal.rep}
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 tabular-nums">{deal.prob}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Analytics Charts Row ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Analytics (Actual vs Forecast) */}
        <div className="card p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="kicker">05 / Revenue</p>
              <h3 className="text-[15px] font-extrabold text-gray-900 mt-1">Revenue Analytics</h3>
              <p className="text-[10.5px] text-gray-500">MRR trending +11% above plan</p>
            </div>
            <span className="badge-secondary text-[10px]">Actual vs Forecast</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="crmActualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.wash} stopOpacity={0.75} />
                  <stop offset="95%" stopColor={CHART.wash} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[130, 200]} />
              <Tooltip formatter={(v) => `$${v}K`} contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="actual" stroke={CHART.main} strokeWidth={2.4} fill="url(#crmActualGrad)" name="Actual MRR" activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface-raised)' }} isAnimationActive={true} animationDuration={1400} />
              <Area type="monotone" dataKey="forecast" stroke={CHART.orange} strokeWidth={2} strokeDasharray="4 4" fill="none" name="Forecast" isAnimationActive={true} animationDuration={1400} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Deal Sources Donut */}
        <div className="card p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="kicker">06 / Sources</p>
              <h3 className="text-[15px] font-extrabold text-gray-900 mt-1">Deal Sources</h3>
              <p className="text-[10.5px] text-gray-500">Where opportunities originate</p>
            </div>
            <span className="badge-primary text-[10px]">648 leads</span>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={dealSourcesData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" isAnimationActive={true} animationDuration={1400}>
                  {dealSourcesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-gray-500">Leads</span>
              <span className="text-lg font-extrabold text-gray-900">648</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-[10px] text-gray-600">
            {dealSourcesData.map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Revenue by Region */}
        <div className="card p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="kicker">07 / Regions</p>
              <h3 className="text-[15px] font-extrabold text-gray-900 mt-1">Revenue by Region</h3>
              <p className="text-[10.5px] text-gray-500">North America leads; APAC fastest growing</p>
            </div>
            <span className="badge-secondary text-[10px]">This quarter</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionalData} layout="vertical">
              <defs>
                <linearGradient id="crmRegionGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={CHART.primrose} />
                  <stop offset="100%" stopColor={CHART.orange} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}K`} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={85} />
              <Tooltip formatter={(v) => `$${v}K`} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="revenue" fill="url(#crmRegionGrad)" radius={[0, 4, 4, 0]} name="Revenue ($K)" isAnimationActive={true} animationDuration={1400} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============ 08 / Recent Deals Table & CRUD ============ */}
      <div id="crm-recent-deals" className="card p-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <p className="kicker">08 / Ledger</p>
            <h2 className="text-[17px] font-extrabold tracking-tight text-gray-900 mt-1">Recent <span className="serif-em text-kicker">Deals</span></h2>
            <p className="text-[11px] text-gray-500">312 opportunities · saved view: "Enterprise Pipeline"</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search deals..." className="w-full sm:w-56" />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'All', label: 'All Statuses' }, ...leadStatuses.map(s => ({ value: s, label: s }))]}
            />
            <FilterDropdown
              value={sourceFilter}
              onChange={setSourceFilter}
              options={[{ value: 'All', label: 'All Sources' }, ...leadSources.map(s => ({ value: s, label: s }))]}
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
          emptyTitle="No deals found"
          emptyDescription="Try adjusting your search or filters, or create a new deal."
          actions={(row) => (
            <div className="flex items-center gap-1">
              <button onClick={() => setViewModal(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-info hover:bg-info/10" title="View">
                <Eye size={14} />
              </button>
              <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-primary-100" title="Edit">
                <Pencil size={14} />
              </button>
              <button onClick={() => setDeleteDialog(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
      </div>

      {/* ============ Create/Edit Modal ============ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title={editingLead ? 'Edit Deal / Lead' : 'Create New Deal'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)}>
              {editingLead ? 'Update Deal' : 'Create Deal'}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="crm-field-1" className="form-label">Contact Name</label>
              <input id="crm-field-1" {...register('contactName')} className="form-input" placeholder="Full name" />
              {errors.contactName && <p className="form-error">{errors.contactName.message}</p>}
            </div>
            <div>
              <label htmlFor="crm-field-2" className="form-label">Company</label>
              <input id="crm-field-2" {...register('company')} className="form-input" placeholder="Company name" />
              {errors.company && <p className="form-error">{errors.company.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="crm-field-3" className="form-label">Email</label>
              <input id="crm-field-3" {...register('email')} type="email" className="form-input" placeholder="email@company.pk" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="crm-field-4" className="form-label">Phone</label>
              <input id="crm-field-4" {...register('phone')} className="form-input" placeholder="+92-XXX-XXXXXXX" />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="crm-field-5" className="form-label">Source</label>
              <select id="crm-field-5" {...register('source')} className="form-select">
                {leadSources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="crm-field-6" className="form-label">Status</label>
              <select id="crm-field-6" {...register('status')} className="form-select">
                {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="crm-field-7" className="form-label">Assigned Representative</label>
              <input id="crm-field-7" {...register('assignedTo')} className="form-input" placeholder="Rep name" />
              {errors.assignedTo && <p className="form-error">{errors.assignedTo.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="crm-field-8" className="form-label">Deal Value (PKR)</label>
            <input id="crm-field-8" {...register('dealValue')} type="number" className="form-input" placeholder="0" />
            {errors.dealValue && <p className="form-error">{errors.dealValue.message}</p>}
          </div>
          <div>
            <label htmlFor="crm-field-9" className="form-label">Notes</label>
            <textarea id="crm-field-9" {...register('notes')} className="form-input" rows={3} placeholder="Additional notes..." />
          </div>
        </form>
      </Modal>

      {/* ============ View Modal ============ */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Deal Details" size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-brand">
                {viewModal.contactName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{viewModal.contactName}</h3>
                <p className="text-sm text-gray-500">{viewModal.company}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={viewModal.status} /></div>
            </div>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={12} /> Email</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> Phone</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Source</p>
                <span className="badge-secondary">{viewModal.source}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Assigned To</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.assignedTo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Deal Value</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(viewModal.dealValue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Last Contact</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(viewModal.lastContact)}</p>
              </div>
            </div>
            {viewModal.notes && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{viewModal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete deal "${deleteDialog?.contactName}"? This action cannot be undone.`}
      />
    </div>
  );
}
