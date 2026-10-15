import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Briefcase, Users, BookOpen, DollarSign,
  CheckCircle, TrendingUp, Award, Target,
  ArrowRight, Clock, AlertCircle, RefreshCw,
  Calendar, Activity
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import { revenueData, leadSourceData, enrollmentTrends, projectStatusDistribution, recentActivities, upcomingDeadlines } from '../../data/dashboard';
import { initialProjects } from '../../data/projects';
import { initialLeads } from '../../data/leads';
import { initialCourses } from '../../data/courses';
import { initialSales } from '../../data/sales';
import { formatCurrency, formatNumber, formatPercent, formatDate } from '../../utils/format';

const COLORS = ['#40BFA6', '#7c5cfc', '#17a2b8', '#ffc107', '#dc3545'];

export default function Dashboard() {
  const [period, setPeriod] = useState('month');

  // Calculate KPI values
  const totalProjects = initialProjects.length;
  const completedProjects = initialProjects.filter(p => p.status === 'Completed').length;
  const activeProjects = initialProjects.filter(p => ['Active', 'In Progress'].includes(p.status)).length;
  
  const totalLeads = initialLeads.length;
  const wonLeads = initialLeads.filter(l => l.status === 'Won').length;
  const conversionRate = (wonLeads / totalLeads * 100);
  
  const totalLearners = initialCourses.reduce((sum, c) => sum + c.enrolledLearners, 0);
  const activeLearners = initialCourses.reduce((sum, c) => sum + c.activeLearners, 0);
  const avgScore = initialCourses.filter(c => c.avgScore > 0).reduce((sum, c, _, arr) => sum + c.avgScore / arr.length, 0);
  
  const closedSales = initialSales.filter(s => s.status === 'Closed');
  const totalRevenue = closedSales.reduce((sum, s) => sum + s.value, 0);
  const totalDeals = initialSales.length;

  const activityColors = {
    success: 'bg-success',
    info: 'bg-info',
    primary: 'bg-primary',
    danger: 'bg-danger',
    warning: 'bg-warning',
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview of Meridian Quality Management."
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-select text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="btn-outline btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          change="+3"
          changeType="increase"
          subtitle="this quarter"
          icon={Briefcase}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active Leads"
          value={totalLeads}
          change="+5"
          changeType="increase"
          subtitle="this month"
          icon={Users}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Total Learners"
          value={formatNumber(totalLearners)}
          change="+28"
          changeType="increase"
          subtitle="new enrollments"
          icon={BookOpen}
          iconColor="bg-accent/10 text-accent"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change="+18.5%"
          changeType="increase"
          subtitle="vs last month"
          icon={DollarSign}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Completed Projects"
          value={completedProjects}
          subtitle={`${activeProjects} active`}
          icon={CheckCircle}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Conversion Rate"
          value={formatPercent(conversionRate)}
          change="+2.3%"
          changeType="increase"
          subtitle="vs last quarter"
          icon={Target}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Avg Course Score"
          value={avgScore.toFixed(1)}
          change="+3.2"
          changeType="increase"
          subtitle="points"
          icon={Award}
          iconColor="bg-accent/10 text-accent"
        />
        <StatCard
          title="Sales Growth"
          value="+18.5%"
          change="+4.2%"
          changeType="increase"
          subtitle="vs prev period"
          icon={TrendingUp}
          iconColor="bg-primary/10 text-primary"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Revenue vs Target" subtitle="Monthly comparison" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40BFA6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#40BFA6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#40BFA6" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
              <Area type="monotone" dataKey="target" stroke="#7c5cfc" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Sources" subtitle="Distribution by source">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadSourceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {leadSourceData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Project Status" subtitle="Distribution overview">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={projectStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Projects">
                {projectStatusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Enrollment Trends" subtitle="Monthly enrollments vs completions">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={enrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="enrollments" stroke="#7c5cfc" strokeWidth={2} dot={{ r: 4 }} name="Enrollments" />
              <Line type="monotone" dataKey="completions" stroke="#40BFA6" strokeWidth={2} dot={{ r: 4 }} name="Completions" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
            <Link to="/dashboard" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentActivities.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activityColors[a.type] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{a.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge-secondary text-2xs">{a.module}</span>
                    <span className="text-xs text-gray-400">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Upcoming Deadlines</h3>
            <Link to="/projects" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {upcomingDeadlines.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10">
                  <Clock size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{d.task}</p>
                  <p className="text-xs text-gray-400">{d.project}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-600">{formatDate(d.dueDate)}</p>
                  <StatusBadge status={d.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects & Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Recent Projects</h3>
            <Link to="/projects" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {initialProjects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.manager}</p>
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
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {initialSales.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{s.customer}</p>
                  <p className="text-xs text-gray-400">{s.product}</p>
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
