import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { differenceInCalendarDays, format, parseISO, isValid, subDays } from 'date-fns';
import {
  Briefcase, Users, BookOpen, DollarSign,
  CheckCircle, Award, Target,
  ArrowRight, Clock, RefreshCw, History,
  AlertTriangle, Building2, GitBranch, GraduationCap, FileCheck2,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { revenueData, enrollmentTrends } from '../../data/dashboard';
import { initialSales } from '../../data/sales';
import { ENTITY_LIST } from '../../data/entities';
import useCollection from '../../hooks/useCollection';
import useLocalStorage from '../../hooks/useLocalStorage';
import { AUDIT_LOG_KEY, ACTION_LABELS } from '../../lib/auditLog';
import { notifyStorageChange } from '../../lib/storage';
import { useSettings } from '../../lib/settings';
import { formatCurrency, formatNumber, formatPercent, formatDate, formatRelative } from '../../utils/format';

// Original dashboard chart palette (kept unchanged).
const COLORS = ['#24997c', '#6174bc', '#3e7ead', '#dc9a2c', '#d0504c'];
const SOURCE_COLORS = { Website: '#24997c', Referral: '#6174bc', LinkedIn: '#3e7ead', Conference: '#dc9a2c', 'Cold Call': '#d0504c' };
const STATUS_COLORS = { Active: '#3e7ead', 'In Progress': '#24997c', 'On Track': '#3e7ead', Completed: '#1e9e6b', Pending: '#dc9a2c', Delayed: '#d0504c', Overdue: '#d0504c' };
const tooltipStyle = { borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' };

const toDay = (v) => {
  if (!v) return null;
  const d = parseISO(String(v).slice(0, 10));
  return isValid(d) ? d : null;
};

function inRange(value, from, to) {
  const d = toDay(value);
  return !!d && d >= from && d <= to;
}

/** Change vs previous period as StatCard props; omitted when there is no baseline. */
function comparison(current, previous, label = 'vs prior period') {
  if (!previous) return { subtitle: previous === 0 && current > 0 ? 'no activity in prior period' : undefined };
  const pct = ((current - previous) / previous) * 100;
  return {
    change: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    changeType: Math.abs(pct) < 0.05 ? 'neutral' : pct > 0 ? 'increase' : 'decrease',
    subtitle: label,
  };
}

const DemoBadge = () => (
  <span className="badge-warning text-2xs uppercase ml-1.5 align-middle" title="Illustrative series — not calculated from your records">Demo series</span>
);

export default function Dashboard() {
  const addToast = useToast();
  const [settings] = useSettings();
  const [period, setPeriod] = useState(settings.preferences.dashboardPeriod || '30');

  // Live records — the same collections the module pages edit.
  const [projects] = useCollection('projects');
  const [leads] = useCollection('leads');
  const [courses] = useCollection('courses');
  const [deals] = useCollection('deals');
  const [tasks] = useCollection('tasks');
  const [team] = useCollection('team');
  const [companies] = useCollection('companies');
  const [quotations] = useCollection('quotations');
  const [sales] = useLocalStorage('meridian-sales', initialSales);
  const [auditLog] = useLocalStorage(AUDIT_LOG_KEY, []);

  const range = useMemo(() => {
    const days = Number(period) || 30;
    const to = new Date(new Date().toDateString());
    const from = subDays(to, days - 1);
    const prevTo = subDays(from, 1);
    const prevFrom = subDays(prevTo, days - 1);
    return { days, from, to, prevFrom, prevTo };
  }, [period]);

  const periodLabel = `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;

  // ---- KPI calculations (all from records) ---------------------------------
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const activeProjects = projects.filter(p => p.status !== 'Completed').length;

  const leadsInPeriod = leads.filter(l => inRange(l.lastContact, range.from, range.to)).length;
  const leadsPrev = leads.filter(l => inRange(l.lastContact, range.prevFrom, range.prevTo)).length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const lostLeads = leads.filter(l => l.status === 'Lost').length;
  const winRate = wonLeads + lostLeads ? (wonLeads / (wonLeads + lostLeads)) * 100 : 0;

  const totalLearners = courses.reduce((sum, c) => sum + (c.enrolledLearners || 0), 0);
  const scored = courses.filter(c => c.avgScore > 0);
  const avgScore = scored.length ? scored.reduce((sum, c) => sum + c.avgScore, 0) / scored.length : 0;
  const completionRate = totalLearners
    ? courses.reduce((sum, c) => sum + (c.completionRate || 0) * (c.enrolledLearners || 0), 0) / totalLearners
    : 0;

  const closedIn = (from, to) => sales.filter(s => s.status === 'Closed' && inRange(s.date, from, to));
  const revenue = closedIn(range.from, range.to).reduce((sum, s) => sum + s.value, 0);
  const revenuePrev = closedIn(range.prevFrom, range.prevTo).reduce((sum, s) => sum + s.value, 0);

  const openDeals = deals.filter(d => !String(d.stage).startsWith('Closed'));
  const openPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0) * (d.probability || 0) / 100, 0);

  const today = range.to;
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && toDay(t.dueDate) && toDay(t.dueDate) < today);
  const activeCompanies = companies.filter(c => c.relationship === 'Customer').length;
  const decidedQuotes = quotations.filter(q => ['Accepted', 'Declined'].includes(q.status));
  const quoteAcceptance = decidedQuotes.length ? (quotations.filter(q => q.status === 'Accepted').length / decidedQuotes.length) * 100 : null;

  // ---- Chart data ----------------------------------------------------------
  const leadSourceData = useMemo(() => {
    const counts = leads.reduce((m, l) => m.set(l.source || 'Other', (m.get(l.source || 'Other') || 0) + 1), new Map());
    return [...counts].map(([name, value], i) => ({ name, value, fill: SOURCE_COLORS[name] || COLORS[i % COLORS.length] }));
  }, [leads]);

  const projectStatusDistribution = useMemo(() => {
    const counts = projects.reduce((m, p) => m.set(p.status, (m.get(p.status) || 0) + 1), new Map());
    return [...counts].map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#adb5bd' }));
  }, [projects]);

  const pipelineByStage = useMemo(() => ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'].map(stage => {
    const list = deals.filter(d => d.stage === stage);
    return { stage, value: list.reduce((s, d) => s + (d.value || 0), 0), deals: list.length };
  }), [deals]);

  const workload = useMemo(() => [...team].sort((a, b) => (b.workload || 0) - (a.workload || 0)).slice(0, 8)
    .map(m => ({ name: m.name.split(' ')[0], workload: m.workload || 0 })), [team]);

  // ---- Lists ---------------------------------------------------------------
  const upcoming = useMemo(() => tasks
    .filter(t => t.status !== 'Completed' && toDay(t.dueDate))
    .map(t => ({ ...t, daysLeft: differenceInCalendarDays(toDay(t.dueDate), today) }))
    .filter(t => t.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5), [tasks, today]);

  const recentProjects = useMemo(() => [...projects]
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, 5), [projects]);

  const recentSales = useMemo(() => [...sales]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 5), [sales]);

  const recentEvents = (Array.isArray(auditLog) ? auditLog : []).slice(0, 8);

  const handleRefresh = () => {
    // Re-read every collection from storage (picks up edits made in other tabs).
    ENTITY_LIST.forEach(e => notifyStorageChange(e.key));
    notifyStorageChange('meridian-sales');
    notifyStorageChange(AUDIT_LOG_KEY);
    addToast('Dashboard refreshed from saved records.', 'info');
  };

  const priorLabel = `vs ${format(range.prevFrom, 'MMM d')} – ${format(range.prevTo, 'MMM d')}`;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back! Here's an overview of Meridian Quality Management · ${periodLabel}`}
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-period" className="sr-only">Reporting period</label>
            <select
              id="dashboard-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-select text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
            </select>
            <button className="btn-outline btn-sm" onClick={handleRefresh}>
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          subtitle={`${activeProjects} active`}
          icon={Briefcase}
          iconColor="bg-primary/10 text-primary"
          info="All project records. Active = any status other than Completed."
          to="/projects"
        />
        <StatCard
          title="Leads Contacted"
          value={leadsInPeriod}
          {...comparison(leadsInPeriod, leadsPrev, priorLabel)}
          icon={Users}
          iconColor="bg-info/10 text-info"
          info="Leads whose last-contact date falls in the selected period. Leads do not store a creation date, so last contact is used."
          to="/sales-analytics/leads"
        />
        <StatCard
          title="Total Learners"
          value={formatNumber(totalLearners)}
          subtitle={`across ${courses.length} courses`}
          icon={BookOpen}
          iconColor="bg-accent/10 text-accent"
          info="Sum of enrolled learners on every course record (a learner on two courses counts twice)."
          to="/lms-analytics/course-catalog"
        />
        <StatCard
          title="Closed Revenue"
          value={formatCurrency(revenue)}
          {...comparison(revenue, revenuePrev, priorLabel)}
          icon={DollarSign}
          iconColor="bg-success/10 text-success"
          info="Σ value of sales records with status Closed and a sale date in the selected period."
          to="/sales-analytics"
        />
        <StatCard
          title="Completed Projects"
          value={completedProjects}
          subtitle={`${activeProjects} active`}
          icon={CheckCircle}
          iconColor="bg-success/10 text-success"
          to="/projects"
        />
        <StatCard
          title="Lead Win Rate"
          value={formatPercent(winRate)}
          subtitle={`${wonLeads} won · ${lostLeads} lost`}
          icon={Target}
          iconColor="bg-warning/10 text-warning"
          info="Won ÷ (Won + Lost) across all lead records. Open leads are excluded."
          to="/reports?report=sales-funnel"
        />
        <StatCard
          title="Avg Course Score"
          value={avgScore.toFixed(1)}
          subtitle={`${scored.length} scored courses`}
          icon={Award}
          iconColor="bg-accent/10 text-accent"
          info="Simple average of each course's average score (courses without scores are excluded)."
          to="/reports?report=lms-courses"
        />
        <StatCard
          title="Open Pipeline"
          value={formatCurrency(openPipeline)}
          subtitle={`${formatCurrency(Math.round(weightedPipeline))} weighted`}
          icon={GitBranch}
          iconColor="bg-primary/10 text-primary"
          info="Σ value of deals not yet Closed Won/Lost. Weighted = Σ value × probability."
          to="/sales-analytics/pipeline"
        />
        <StatCard
          title="Overdue Tasks"
          value={overdueTasks.length}
          subtitle={`of ${tasks.filter(t => t.status !== 'Completed').length} open tasks`}
          icon={AlertTriangle}
          iconColor="bg-danger/10 text-danger"
          info="Tasks not Completed whose due date is before today."
          to="/projects/tasks"
        />
        <StatCard
          title="Active Customers"
          value={activeCompanies}
          subtitle={`of ${companies.length} companies`}
          icon={Building2}
          iconColor="bg-info/10 text-info"
          info="Companies with relationship = Customer."
          to="/crm/companies"
        />
        <StatCard
          title="Course Completion"
          value={formatPercent(completionRate)}
          subtitle="enrolment-weighted"
          icon={GraduationCap}
          iconColor="bg-success/10 text-success"
          info="Σ(course completion rate × enrolled learners) ÷ Σ enrolled learners."
          to="/reports?report=lms-courses"
        />
        <StatCard
          title="Quote Acceptance"
          value={quoteAcceptance === null ? '—' : formatPercent(quoteAcceptance)}
          subtitle={`${decidedQuotes.length} decided quotations`}
          icon={FileCheck2}
          iconColor="bg-accent/10 text-accent"
          info="Accepted ÷ (Accepted + Declined) quotations. Drafts and sent quotes are excluded."
          to="/reports?report=sales-quotations"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 animate-slide-up">
        <ChartCard title={<>Revenue vs Target <DemoBadge /></>} subtitle="Monthly comparison · illustrative figures" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#24997c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#24997c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#24997c" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" animationDuration={900} />
              <Area type="monotone" dataKey="target" stroke="#6174bc" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Target" animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Sources" subtitle={`${leads.length} leads by acquisition channel`}>
          {leadSourceData.length === 0 ? (
            <EmptyState title="No leads yet" description="Add leads to see channel distribution." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" animationDuration={900}>
                  {leadSourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} lead${v === 1 ? '' : 's'}`, 'Leads']} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 animate-slide-up">
        <ChartCard title="Project Status" subtitle={`${projects.length} projects by current status`}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={projectStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Projects" animationDuration={900}>
                {projectStatusDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={<>Enrollment Trends <DemoBadge /></>} subtitle="Monthly enrollments vs completions · illustrative figures">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={enrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="enrollments" stroke="#6174bc" strokeWidth={2} dot={{ r: 4 }} name="Enrollments" animationDuration={900} />
              <Line type="monotone" dataKey="completions" stroke="#24997c" strokeWidth={2} dot={{ r: 4 }} name="Completions" animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard
          title="Sales Pipeline"
          subtitle="Deal value by stage"
          actions={<Link to="/sales-analytics/pipeline" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">Open pipeline <ArrowRight size={12} aria-hidden="true" /></Link>}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatNumber} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n, item) => [`${formatCurrency(v)} · ${item.payload.deals} deal(s)`, 'Value']} />
              <Bar dataKey="value" name="Value" fill="#24997c" radius={[6, 6, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Team Workload"
          subtitle="Capacity used per team member (from Team records)"
          actions={<Link to="/projects/team" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">Team <ArrowRight size={12} aria-hidden="true" /></Link>}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workload} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Workload']} />
              <Bar dataKey="workload" radius={[0, 6, 6, 0]} animationDuration={900}>
                {workload.map(w => <Cell key={w.name} fill={w.workload >= 90 ? '#d0504c' : w.workload >= 75 ? '#dc9a2c' : '#24997c'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent Activity (from the audit log — real changes only) */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
            <Link to="/audit-log" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentEvents.length === 0 ? (
              <EmptyState
                icon={History}
                title="No recorded activity yet"
                description="New leads, deal updates, completed tasks, enrolments and other changes appear here as they happen."
              />
            ) : recentEvents.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.action === 'deleted' ? 'bg-danger' : a.action === 'created' || a.action === 'imported' ? 'bg-success' : 'bg-info'}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    {ACTION_LABELS[a.action] || a.action} {a.entityLabel?.toLowerCase()}{a.recordName ? `: ${a.recordName}` : ''}
                    {a.details && <span className="text-gray-400"> — {a.details}</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge-secondary text-2xs">{a.entityLabel}</span>
                    <span className="text-xs text-gray-400">{formatRelative(a.at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines (from tasks) */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Upcoming Deadlines</h3>
            <Link to="/calendar" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Calendar <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {upcoming.length === 0 ? (
              <EmptyState icon={Clock} title="Nothing due in the next 30 days" description="Open tasks with due dates will appear here." />
            ) : upcoming.map((d) => (
              <Link key={d.id} to={`/projects/tasks?q=${encodeURIComponent(d.title)}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className={`grid place-items-center w-9 h-9 rounded-lg ${d.daysLeft < 0 ? 'bg-danger/10' : 'bg-primary/10'}`}>
                  <Clock size={16} className={d.daysLeft < 0 ? 'text-danger' : 'text-primary'} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{d.title}</p>
                  <p className="text-xs text-gray-400 truncate">{d.project} · {d.assignedTo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-medium ${d.daysLeft < 0 ? 'text-danger' : 'text-gray-600'}`}>
                    {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : d.daysLeft === 0 ? 'Due today' : formatDate(d.dueDate)}
                  </p>
                  <StatusBadge status={d.priority} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects & Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Recently Updated Projects</h3>
            <Link to="/projects" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.lead || p.manager}</p>
                </div>
                <div className="w-24">
                  <ProgressBar value={p.progress} size="sm" />
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Recent Sales</h3>
            <Link to="/sales-analytics" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentSales.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{s.customer}</p>
                  <p className="text-xs text-gray-400">{s.product} · {formatDate(s.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(s.value)}</p>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
