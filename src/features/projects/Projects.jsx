import React, { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Plus, Rocket, UserPlus, Download, FolderKanban, CheckCircle2,
  ListTodo, TrendingUp, ArrowUpRight, ArrowDownRight, Flag,
  AlertTriangle, Activity, Clock, Calendar, MoreHorizontal,
  ChevronRight, Users, FileText, Star, MessageSquare, Eye,
  Pencil, Trash2, Target, Zap, Timer, Check, Circle
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
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialProjects } from '../../data/projects';
import { formatCurrency, formatDate, generateId } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  manager: z.string().min(2, 'Manager name is required'),
  category: z.string().min(2, 'Category is required'),
  startDate: z.string().min(1, 'Start date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.coerce.number().min(0, 'Budget must be positive'),
  progress: z.coerce.number().min(0).max(100, 'Progress must be 0-100'),
});

const statuses = ['All', 'Active', 'In Progress', 'Completed', 'Pending', 'Overdue'];
const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

// Quarterly progress data
const quarterlyData = [
  { quarter: 'Q1', rate: 61, completed: 27, inProgress: 19, delayed: 9, cancelled: 3, trend: '+4%', trendType: 'up', color: 'bg-success' },
  { quarter: 'Q2', rate: 70, completed: 34, inProgress: 21, delayed: 7, cancelled: 4, trend: '+9%', trendType: 'up', color: 'bg-success' },
  { quarter: 'Q3', rate: 68, completed: 31, inProgress: 24, delayed: 11, cancelled: 5, trend: '-2%', trendType: 'down', color: 'bg-warning' },
  { quarter: 'Q4', rate: 74, completed: 40, inProgress: 22, delayed: 8, cancelled: 3, trend: '+6%', trendType: 'up', color: 'bg-primary' },
];

// Project health status breakdown
const statusBreakdown = [
  { name: 'On Track', value: 58, color: '#28a745' },
  { name: 'Completed', value: 42, color: '#40BFA6' },
  { name: 'At Risk', value: 24, color: '#ffc107' },
  { name: 'Delayed', value: 12, color: '#dc3545' },
  { name: 'Cancelled', value: 12, color: '#9ca3af' },
];

// Task pipeline data
const taskPipelines = [
  { name: 'Backlog', count: 24, color: 'bg-gray-200 text-gray-700' },
  { name: 'To Do', count: 18, color: 'bg-info/10 text-info' },
  { name: 'In Progress', count: 32, color: 'bg-primary/10 text-primary' },
  { name: 'Review', count: 12, color: 'bg-warning/10 text-warning' },
  { name: 'Done', count: 46, color: 'bg-success/10 text-success' },
  { name: 'Blocked', count: 5, color: 'bg-danger/10 text-danger' },
];

// Today's tasks
const todaysTasks = [
  { id: 1, task: 'Review quality audit report for Section A', done: true, priority: 'High' },
  { id: 2, task: 'Update ISO 9001 documentation templates', done: true, priority: 'Medium' },
  { id: 3, task: 'Schedule calibration for testing equipment', done: false, priority: 'High' },
  { id: 4, task: 'Finalize supplier scorecard criteria', done: false, priority: 'Medium' },
  { id: 5, task: 'Conduct root cause analysis meeting', done: false, priority: 'Critical' },
  { id: 6, task: 'Prepare SPC training materials', done: false, priority: 'Low' },
];

// Recent activity
const recentActivity = [
  { id: 1, user: 'Sarah Ahmed', action: 'completed milestone', target: 'Phase 2 Audit Review', time: '12 min ago', type: 'success' },
  { id: 2, user: 'Ali Khan', action: 'added comment on', target: 'Supplier Quality Report', time: '35 min ago', type: 'info' },
  { id: 3, user: 'Fatima Zahra', action: 'uploaded document', target: 'ISO Compliance Checklist', time: '1 hour ago', type: 'primary' },
  { id: 4, user: 'Omar Farooq', action: 'moved task to Done', target: 'DCS Phase 1 Deployment', time: '2 hours ago', type: 'success' },
  { id: 5, user: 'Dr. Kamran', action: 'flagged issue', target: 'Lab Equipment Delay', time: '3 hours ago', type: 'danger' },
  { id: 6, user: 'Ayesha Malik', action: 'started sprint', target: 'SPC Monitoring Sprint 3', time: '4 hours ago', type: 'primary' },
];

// Client feedback data
const clientFeedback = [
  { id: 1, client: 'Textile Corp', rating: 5, comment: 'Outstanding audit process and thorough documentation', date: '2 days ago' },
  { id: 2, client: 'PharmaCare', rating: 4, comment: 'GMP implementation was smooth and professional', date: '5 days ago' },
  { id: 3, client: 'Steel Works', rating: 5, comment: 'NDT services exceeded our expectations', date: '1 week ago' },
];

// Document types
const documentStats = [
  { name: 'Reports', value: 34, fill: '#40BFA6' },
  { name: 'Checklists', value: 28, fill: '#7c5cfc' },
  { name: 'Procedures', value: 22, fill: '#17a2b8' },
  { name: 'Templates', value: 16, fill: '#ffc107' },
];

export default function Projects() {
  const [projects, setProjects] = useLocalStorage('meridian-projects', initialProjects);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const addToast = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
  });

  // Derived data
  const totalProjects = projects.length;
  const activeCount = projects.filter(p => ['Active', 'In Progress'].includes(p.status)).length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const pendingTasks = projects.filter(p => p.status === 'Pending').length;
  const overdueProjects = projects.filter(p => p.status === 'Overdue');
  const avgProgress = Math.round(projects.reduce((s, p) => s + p.progress, 0) / totalProjects);

  // Filter
  const filteredByStatus = (() => {
    let data = projects;
    if (statusFilter !== 'All') data = data.filter(p => p.status === statusFilter);
    if (priorityFilter !== 'All') data = data.filter(p => p.priority === priorityFilter);
    return data;
  })();

  const { query, setQuery, filtered } = useSearch(filteredByStatus, ['name', 'manager', 'category']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'name');
  const pagination = usePagination(sorted, 6);

  // CRUD handlers
  const openCreate = () => {
    setEditingProject(null);
    reset({ name: '', description: '', status: 'Pending', priority: 'Medium', manager: '', category: '', startDate: '', dueDate: '', budget: 0, progress: 0 });
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    Object.keys(project).forEach(k => {
      if (['name', 'description', 'status', 'priority', 'manager', 'category', 'startDate', 'dueDate', 'budget', 'progress'].includes(k)) {
        setValue(k, project[k]);
      }
    });
    setModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...data, spent: p.spent } : p));
      addToast('Project updated successfully', 'success');
    } else {
      setProjects(prev => [{ ...data, id: generateId(), team: [], spent: 0 }, ...prev]);
      addToast('Project created successfully', 'success');
    }
    setModalOpen(false);
    reset();
  };

  const handleDelete = () => {
    setProjects(prev => prev.filter(p => p.id !== deleteDialog.id));
    addToast('Project deleted successfully', 'success');
    setDeleteDialog(null);
  };

  const handleExport = () => {
    exportToCSV(sorted, 'projects', [
      { key: 'name', label: 'Project Name' }, { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' }, { key: 'manager', label: 'Manager' },
      { key: 'progress', label: 'Progress (%)' }, { key: 'budget', label: 'Budget (PKR)' },
      { key: 'startDate', label: 'Start Date' }, { key: 'dueDate', label: 'Due Date' },
    ]);
    addToast('CSV exported successfully', 'info');
  };

  const columns = [
    { key: 'name', label: 'Project', sortable: true, render: (row) => (
      <div><p className="text-sm font-medium text-gray-800">{row.name}</p><p className="text-xs text-gray-400">{row.category}</p></div>
    )},
    { key: 'manager', label: 'Owner', sortable: true, render: (row) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{row.manager.charAt(0)}</div>
        <span className="text-sm text-gray-600">{row.manager}</span>
      </div>
    )},
    { key: 'progress', label: 'Progress', sortable: true, render: (row) => <ProgressBar value={row.progress} size="sm" className="w-28" /> },
    { key: 'startDate', label: 'Start', sortable: true, render: (row) => <span className="text-xs text-gray-500">{formatDate(row.startDate)}</span> },
    { key: 'dueDate', label: 'Deadline', sortable: true, render: (row) => <span className="text-xs text-gray-500">{formatDate(row.dueDate)}</span> },
    { key: 'priority', label: 'Priority', sortable: true, render: (row) => <StatusBadge status={row.priority} /> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'budget', label: 'Budget', sortable: true, render: (row) => <span className="text-sm font-medium text-gray-700">{formatCurrency(row.budget)}</span> },
  ];

  const activityColors = { success: 'bg-success', info: 'bg-info', primary: 'bg-primary', danger: 'bg-danger' };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Project Management Dashboard"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Project Management' }]}
      />

      {/* ============ 1. Welcome Widget (Hero Card) ============ */}
      <div className="card p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shrink-0">
                M
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Welcome back, Admin 👋</h2>
                <p className="text-xs text-gray-400 mt-0.5">Quality Manager · Meridian Quality Management Professionals</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-4 text-xs text-gray-600">
              <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-success" />18 tasks completed yesterday</li>
              <li className="flex items-center gap-2"><Flag size={13} className="text-primary" />6 milestones achieved</li>
              <li className="flex items-center gap-2"><AlertTriangle size={13} className="text-danger" />2 high-priority issues need attention</li>
              <li className="flex items-center gap-2"><Activity size={13} className="text-info" />Sprint velocity at 92%</li>
            </ul>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button className="btn-primary btn-sm" onClick={openCreate}><Plus size={13} /> New Project</button>
              <button className="btn-outline btn-sm"><Rocket size={13} /> Create Sprint</button>
              <button className="btn-outline btn-sm"><UserPlus size={13} /> Invite Team</button>
              <ExportButton onClick={handleExport} label="Export Report" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="rounded-lg p-2.5 bg-gray-50"><p className="text-[10px] text-gray-400">Active Projects</p><p className="text-base font-bold text-gray-800 mt-0.5">{totalProjects}</p></div>
              <div className="rounded-lg p-2.5 bg-gray-50"><p className="text-[10px] text-gray-400">Team Members</p><p className="text-base font-bold text-gray-800 mt-0.5">84</p></div>
              <div className="rounded-lg p-2.5 bg-gray-50"><p className="text-[10px] text-gray-400">Sprint Velocity</p><p className="text-base font-bold text-success mt-0.5">92%</p></div>
              <div className="rounded-lg p-2.5 bg-gray-50"><p className="text-[10px] text-gray-400">Productivity</p><p className="text-base font-bold text-success mt-0.5">96%</p></div>
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-primary/5 hidden lg:flex flex-col justify-center gap-3">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 w-[88px] h-[88px]">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#28a745" strokeWidth="8" strokeDasharray={`${86 * 2.64} ${(100 - 86) * 2.64}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-800">86%</span>
                  <span className="text-[9px] text-gray-400">On Track</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Portfolio Health</p>
                <p className="text-xs text-gray-500 mt-1">{completedCount + activeCount} of {totalProjects} projects delivering on schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl p-3 bg-white">
              <AvatarGroup names={['Sarah Ahmed', 'Ali Khan', 'Fatima Zahra', 'Omar Farooq']} max={3} size="sm" />
              <p className="text-[11px] font-medium text-gray-600">84 team members across 12 active sprints</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-2.5 bg-white"><p className="text-[10px] text-gray-400">Client NPS</p><p className="text-base font-bold text-primary mt-0.5">+58</p></div>
              <div className="rounded-xl p-2.5 bg-white"><p className="text-[10px] text-gray-400">Revenue Impact</p><p className="text-base font-bold text-gray-800 mt-0.5">{formatCurrency(4800000)}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 2. Executive KPI Cards ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: FolderKanban, label: 'Active Projects', value: totalProjects, trend: '+4.2%', trendUp: true, color: 'bg-primary text-white', weekly: '+6', monthly: '+22' },
          { icon: CheckCircle2, label: 'Completed Projects', value: completedCount, trend: '+8.1%', trendUp: true, color: 'bg-success text-white', weekly: '+9', monthly: '+31' },
          { icon: ListTodo, label: 'Pending Tasks', value: pendingTasks, trend: '-2.4%', trendUp: false, color: 'bg-warning text-white', weekly: '-14', monthly: '-52' },
          { icon: TrendingUp, label: 'Team Productivity', value: '96%', trend: '+3.6%', trendUp: true, color: 'bg-info text-white', weekly: '+3.6%', monthly: '+11%' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card p-4 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <span className={`grid place-items-center w-9 h-9 rounded-lg ${kpi.color}`}><Icon size={15} /></span>
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium ${kpi.trendUp ? 'bg-success-50 text-success' : 'bg-danger-50 text-danger'}`}>
                  {kpi.trendUp ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}{kpi.trend}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-800 mt-2.5">{kpi.value}</p>
              <p className="text-[11px] text-gray-400">{kpi.label}</p>
              <div className="h-8 mt-1.5 flex items-end gap-0.5">
                {[40, 55, 35, 65, 45, 70, 50, 80].map((h, j) => (
                  <div key={j} className={`flex-1 rounded-sm ${kpi.trendUp ? 'bg-primary/20' : 'bg-danger/20'}`} style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                vs last week <span className={`font-semibold ${kpi.trendUp ? 'text-success' : 'text-danger'}`}>{kpi.weekly}</span> · month <span className="font-semibold text-success">{kpi.monthly}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* ============ 3. Project Health Overview + Progress Analytics ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Overview */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-1">Project Health Overview</h2>
          <p className="text-[11px] text-gray-400 mb-4">Status breakdown · {totalProjects} projects</p>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 w-[92px] h-[92px]">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#28a745" strokeWidth="8" strokeDasharray={`${84 * 2.64} ${(100 - 84) * 2.64}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-800">84</span>
                <span className="text-[9px] text-gray-400">Health Score</span>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-8"><span className="text-gray-400">Average Progress</span><span className="font-semibold">{avgProgress}%</span></div>
              <div className="flex items-center justify-between gap-8"><span className="text-gray-400">Budget Used</span><span className="font-semibold">78%</span></div>
              <div className="flex items-center justify-between gap-8"><span className="text-gray-400">Timeline Accuracy</span><span className="font-semibold text-warning">91%</span></div>
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-5 mb-2">Status Breakdown · {totalProjects} total</p>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
            {statusBreakdown.map((s, i) => (
              <span key={i} className="transition-all" style={{ width: `${(s.value / 148) * 100}%`, backgroundColor: s.color }} title={`${s.name}: ${s.value}`} />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-[11px]">
            {statusBreakdown.map((s, i) => (
              <li key={i} className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.name} <span className="ml-auto font-semibold">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress Analytics - Quarterly Cards */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">Project Progress Analytics</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Quarterly completion rate vs. prior period</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quarterlyData.map((q, i) => (
              <div key={i} className="rounded-xl p-3.5 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{q.quarter}</span>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${q.trendType === 'up' ? 'bg-success-50 text-success' : 'bg-warning-50 text-warning'}`}>
                    {q.trendType === 'up' ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}{q.trend}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-800 mt-2">{q.rate}%</p>
                <p className="text-[10px] text-gray-400">completion rate</p>
                <div className="h-1.5 rounded-full overflow-hidden mt-2.5 bg-gray-200">
                  <div className={`h-full rounded-full ${q.color}`} style={{ width: `${q.rate}%` }} />
                </div>
                <ul className="mt-3 space-y-1 text-[10px]">
                  <li className="flex items-center justify-between py-0.5"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success" />Completed</span><span className="font-semibold">{q.completed}</span></li>
                  <li className="flex items-center justify-between py-0.5"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-info" />In Progress</span><span className="font-semibold">{q.inProgress}</span></li>
                  <li className="flex items-center justify-between py-0.5"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-warning" />Delayed</span><span className="font-semibold">{q.delayed}</span></li>
                  <li className="flex items-center justify-between py-0.5"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-danger" />Cancelled</span><span className="font-semibold">{q.cancelled}</span></li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ 4. Project Timeline Table ============ */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-gray-800">Project Timeline</h2>
            <span className="badge-info">{sorted.length} tracked</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search projects..." className="w-full sm:w-56" />
            <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={statuses.map(s => ({ value: s, label: s }))} />
            <FilterDropdown value={priorityFilter} onChange={setPriorityFilter} options={priorities.map(p => ({ value: p, label: p }))} />
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
          emptyTitle="No projects found"
          emptyDescription="Try adjusting your search or filters, or create a new project."
          actions={(row) => (
            <div className="flex items-center gap-1">
              <button onClick={() => setViewModal(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-info hover:bg-info/10"><Eye size={14} /></button>
              <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10"><Pencil size={14} /></button>
              <button onClick={() => setDeleteDialog(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10"><Trash2 size={14} /></button>
            </div>
          )}
        />
      </div>

      {/* ============ 5. Active Projects + Project Gantt-lite ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Project Progress Rings */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Active Projects</h2>
          <div className="grid grid-cols-3 gap-4">
            {projects.filter(p => ['Active', 'In Progress'].includes(p.status)).slice(0, 6).map((p, i) => (
              <div key={p.id} className="text-center">
                <div className="relative w-16 h-16 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={p.progress > 70 ? '#28a745' : p.progress > 40 ? '#40BFA6' : '#ffc107'} strokeWidth="6" strokeDasharray={`${p.progress * 2.64} ${(100 - p.progress) * 2.64}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{p.progress}%</div>
                </div>
                <p className="text-[10px] font-medium text-gray-600 mt-1.5 truncate">{p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name}</p>
                {p.status === 'Overdue' && <p className="text-[9px] font-semibold text-danger mt-0.5">2 days overdue</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Project Timeline Gantt-lite */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-1">Project Timeline</h2>
          <p className="text-[11px] text-gray-400 mb-4">Visual schedule overview</p>
          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700 truncate max-w-[200px]">{p.name}</span>
                  <span className="text-gray-400">{p.progress}%</span>
                </div>
                <div className="h-5 rounded-md bg-gray-100 relative overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all"
                    style={{
                      width: `${p.progress}%`,
                      backgroundColor: p.progress > 80 ? '#28a745' : p.progress > 50 ? '#40BFA6' : p.progress > 30 ? '#17a2b8' : '#ffc107'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {overdueProjects.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={13} className="text-danger" />
                <span className="badge-danger">{overdueProjects.length} overdue</span>
              </div>
              {overdueProjects.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-gray-700 font-medium">{p.name}</span>
                  <span className="badge-danger text-[9px]">2d overdue</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ 6. Overdue Projects + Task Pipelines ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Projects */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-gray-800">Overdue Projects</h2>
            <span className="badge-danger">{overdueProjects.length} overdue</span>
          </div>
          {overdueProjects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No overdue projects 🎉</p>
          ) : (
            <div className="space-y-3">
              {overdueProjects.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-danger-50/50 border border-danger/10">
                  <div className="w-8 h-8 rounded-lg bg-danger/10 grid place-items-center"><AlertTriangle size={14} className="text-danger" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.manager} · Due: {formatDate(p.dueDate)}</p>
                  </div>
                  <ProgressBar value={p.progress} size="sm" color="bg-danger" className="w-20" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Pipelines */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Task Pipelines</h2>
          <div className="grid grid-cols-3 gap-3">
            {taskPipelines.map((tp, i) => (
              <div key={i} className={`rounded-xl p-3.5 text-center ${tp.color}`}>
                <p className="text-2xl font-bold">{tp.count}</p>
                <p className="text-[10px] font-medium mt-0.5">{tp.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ 7. Sprint Health Snapshot + Client Feedback ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sprint Health */}
        <div className="rounded-2xl p-5 lg:p-6 bg-gradient-to-r from-[#141414] to-[#1a3a30] text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Sprint Health Snapshot</p>
          <h2 className="text-lg font-bold mt-1">Sprint 24 is tracking 8% ahead of forecast</h2>
          <p className="text-xs text-white/60 mt-2">
            Velocity has held steady at <strong className="text-white">21 points/day</strong> across the last 5 sprints. 
            Current burndown shows projected completion <strong className="text-primary">2 days early</strong>.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl p-3 bg-white/10"><p className="text-[10px] text-white/50">Velocity</p><p className="text-lg font-bold mt-0.5">21<span className="text-xs font-normal text-white/40">/day</span></p></div>
            <div className="rounded-xl p-3 bg-white/10"><p className="text-[10px] text-white/50">Burn Rate</p><p className="text-lg font-bold mt-0.5 text-primary">92%</p></div>
            <div className="rounded-xl p-3 bg-white/10"><p className="text-[10px] text-white/50">Completion</p><p className="text-lg font-bold mt-0.5 text-success">+2d</p></div>
          </div>
          <div className="flex items-center gap-3 mt-4 rounded-xl p-3 bg-white/5">
            <AvatarGroup names={['Sarah', 'Ali', 'Omar']} max={3} size="xs" />
            <p className="text-[11px] text-white/70">8 contributors active in current sprint</p>
          </div>
        </div>

        {/* Client Feedback */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Client Feedback</h2>
          <div className="space-y-3">
            {clientFeedback.map(fb => (
              <div key={fb.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{fb.client.charAt(0)}</div>
                    <span className="text-sm font-medium text-gray-800">{fb.client}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} className={i < fb.rating ? 'text-warning fill-warning' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500">"{fb.comment}"</p>
                <p className="text-[10px] text-gray-400 mt-1">{fb.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ 8. Document Collection + Resource Allocation ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Document Collection */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Document Collection</h2>
          <div className="flex items-center gap-6">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={documentStats} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                    {documentStats.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {documentStats.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{d.value}</span>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 pt-1">Total: {documentStats.reduce((s, d) => s + d.value, 0)} documents</p>
            </div>
          </div>
        </div>

        {/* Resource Allocation */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Resource Allocation</h2>
          <div className="space-y-3">
            {[
              { name: 'Quality Assurance', allocated: 35, color: 'bg-primary' },
              { name: 'Process Improvement', allocated: 25, color: 'bg-accent' },
              { name: 'Audit & Compliance', allocated: 20, color: 'bg-info' },
              { name: 'Training & Development', allocated: 12, color: 'bg-warning' },
              { name: 'Infrastructure', allocated: 8, color: 'bg-success' },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{r.name}</span>
                  <span className="font-semibold text-gray-700">{r.allocated}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.allocated}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ 9. Priority Tasks + Recent Activity ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Today's Tasks</h2>
          <div className="space-y-2">
            {todaysTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                <button className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${t.done ? 'border-success bg-success' : 'border-gray-300'}`}>
                  {t.done && <Check size={11} className="text-white" />}
                </button>
                <span className={`flex-1 text-xs ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.task}</span>
                <StatusBadge status={t.priority} />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">{todaysTasks.filter(t => t.done).length} of {todaysTasks.length} completed</p>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="mt-0.5 relative">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {a.user.charAt(0)}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${activityColors[a.type] || 'bg-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px]">
                    <span className="font-semibold text-gray-800">{a.user}</span>{' '}
                    <span className="text-gray-500">{a.action}</span>{' '}
                    <span className="font-medium text-gray-700">{a.target}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}
      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)}>
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Project Name</label>
              <input {...register('name')} className="form-input" placeholder="Enter project name" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Category</label>
              <input {...register('category')} className="form-input" placeholder="e.g., Quality Assurance" />
              {errors.category && <p className="form-error">{errors.category.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...register('description')} className="form-input" rows={3} placeholder="Project description" />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-select">{statuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select {...register('priority')} className="form-select">{priorities.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div>
              <label className="form-label">Manager</label>
              <input {...register('manager')} className="form-input" placeholder="Project manager" />
              {errors.manager && <p className="form-error">{errors.manager.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Start Date</label><input {...register('startDate')} type="date" className="form-input" />{errors.startDate && <p className="form-error">{errors.startDate.message}</p>}</div>
            <div><label className="form-label">Due Date</label><input {...register('dueDate')} type="date" className="form-input" />{errors.dueDate && <p className="form-error">{errors.dueDate.message}</p>}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Budget (PKR)</label><input {...register('budget')} type="number" className="form-input" placeholder="0" />{errors.budget && <p className="form-error">{errors.budget.message}</p>}</div>
            <div><label className="form-label">Progress (%)</label><input {...register('progress')} type="number" min="0" max="100" className="form-input" placeholder="0" />{errors.progress && <p className="form-error">{errors.progress.message}</p>}</div>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Project Details" size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div><h3 className="text-lg font-semibold text-gray-800">{viewModal.name}</h3><p className="text-sm text-gray-500 mt-1">{viewModal.description}</p></div>
              <StatusBadge status={viewModal.status} />
            </div>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-400">Manager</p><p className="text-sm font-medium text-gray-700">{viewModal.manager}</p></div>
              <div><p className="text-xs text-gray-400">Priority</p><StatusBadge status={viewModal.priority} /></div>
              <div><p className="text-xs text-gray-400">Category</p><p className="text-sm font-medium text-gray-700">{viewModal.category}</p></div>
              <div><p className="text-xs text-gray-400">Start Date</p><p className="text-sm font-medium text-gray-700">{formatDate(viewModal.startDate)}</p></div>
              <div><p className="text-xs text-gray-400">Due Date</p><p className="text-sm font-medium text-gray-700">{formatDate(viewModal.dueDate)}</p></div>
              <div><p className="text-xs text-gray-400">Budget</p><p className="text-sm font-medium text-gray-700">{formatCurrency(viewModal.budget)}</p></div>
            </div>
            <div><p className="text-xs text-gray-400 mb-1">Progress</p><ProgressBar value={viewModal.progress} size="lg" /></div>
            <div><p className="text-xs text-gray-400 mb-1">Team Members</p><AvatarGroup names={viewModal.team || []} max={6} size="md" /></div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
