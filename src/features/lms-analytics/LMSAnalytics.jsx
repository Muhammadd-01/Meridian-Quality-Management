import React, { useState, useMemo } from 'react';
import PageHeroIcon from '../../components/ui/PageHeroIcon';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  BookOpen, Users, GraduationCap, Award, TrendingUp,
  BarChart3, Eye, Download, CheckCircle2, AlertTriangle,
  Flame, Zap, Clock, ShieldCheck, ChevronRight, Sparkles,
  ArrowUpRight, ArrowDownRight, Star, RefreshCw, Plus,
  BookOpenCheck,
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
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialCourses } from '../../data/courses';
import { enrollmentTrends } from '../../data/dashboard';
import { formatNumber, formatPercent, formatCurrency } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';

const COLORS = ['#24997c', '#6174bc', '#3e7ead', '#dc9a2c', '#d0504c', '#1e9e6b'];

// Gamification top performers
const topPerformers = [
  { rank: 1, name: 'Fatima Zahra', streak: '45-day streak', xp: '612K XP', medal: '🥇' },
  { rank: 2, name: 'Ali Khan', streak: '38-day streak', xp: '548K XP', medal: '🥈' },
  { rank: 3, name: 'Usman Sheikh', streak: '29-day streak', xp: '233K XP', medal: '🥉' },
];

// Instructor performance data
const instructorPerfData = [
  { name: 'Dr. Kamran', hours: 85, satisfaction: 94 },
  { name: 'Sarah Ahmed', hours: 78, satisfaction: 92 },
  { name: 'Ali Khan', hours: 72, satisfaction: 88 },
  { name: 'Omar Farooq', hours: 65, satisfaction: 86 },
];

// Assessment distribution
const assessmentDist = [
  { name: 'Passed', value: 67.2, fill: '#1e9e6b' },
  { name: 'Retaken', value: 21.6, fill: '#dc9a2c' },
  { name: 'Failed', value: 11.2, fill: '#d0504c' },
];

// Revenue intelligence data
const revenueStreamData = [
  { month: 'Feb', subscription: 65, corporate: 45, certification: 25, marketplace: 15, projected: 145 },
  { month: 'Mar', subscription: 72, corporate: 50, certification: 28, marketplace: 18, projected: 155 },
  { month: 'Apr', subscription: 80, corporate: 58, certification: 32, marketplace: 22, projected: 168 },
  { month: 'May', subscription: 88, corporate: 64, certification: 36, marketplace: 26, projected: 180 },
  { month: 'Jun', subscription: 95, corporate: 72, certification: 40, marketplace: 30, projected: 195 },
  { month: 'Jul', subscription: 104, corporate: 80, certification: 45, marketplace: 35, projected: 210 },
];

// Department performance
const deptPerformance = [
  { dept: 'Quality Assurance', learners: 4120, completion: 85, compliance: 'Compliant', roi: '4.2x' },
  { dept: 'Engineering & Testing', learners: 6940, completion: 81, compliance: 'Compliant', roi: '3.8x' },
  { dept: 'Operations & HR', learners: 1240, completion: 93, compliance: 'Compliant', roi: '3.4x' },
  { dept: 'Finance & Compliance', learners: 980, completion: 64, compliance: 'At Risk', roi: '1.9x' },
  { dept: 'IT & Digital Security', learners: 2360, completion: 76, compliance: 'Compliant', roi: '3.1x' },
];

// At-risk learners
const atRiskLearners = [
  { name: 'Kamal Mehmood', issue: '14 days inactive', risk: 'High Risk', riskColor: 'bg-danger-50 text-danger' },
  { name: 'Sana Qureshi', issue: 'Failed assessment 2x', risk: 'High Risk', riskColor: 'bg-danger-50 text-danger' },
  { name: 'Diego Paredes', issue: 'Stalled at Module 3', risk: 'Medium Risk', riskColor: 'bg-warning-50 text-warning' },
  { name: 'Emma Lindqvist', issue: 'Pace 48% below target', risk: 'Medium Risk', riskColor: 'bg-warning-50 text-warning' },
];

export default function LMSAnalytics() {
  const [courses] = useState(initialCourses);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewModal, setViewModal] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const addToast = useToast();

  // KPI Calculations
  const totalLearners = courses.reduce((s, c) => s + c.enrolledLearners, 0);
  const activeLearners = courses.reduce((s, c) => s + c.activeLearners, 0);
  const totalCourses = courses.length;
  const avgCompletion = Math.round(courses.filter(c => c.completionRate > 0).reduce((s, c, _, a) => s + c.completionRate / a.length, 0));
  const avgScore = courses.filter(c => c.avgScore > 0).reduce((s, c, _, a) => s + c.avgScore / a.length, 0).toFixed(1);

  // Categories
  const categories = useMemo(() => ['All', ...Array.from(new Set(courses.map(c => c.category)))], [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    let data = courses;
    if (statusFilter !== 'All') data = data.filter(c => c.status === statusFilter);
    if (categoryFilter !== 'All') data = data.filter(c => c.category === categoryFilter);
    return data;
  }, [courses, statusFilter, categoryFilter]);

  const { query, setQuery, filtered } = useSearch(filteredCourses, ['name', 'instructor', 'category']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'name');
  const pagination = usePagination(sorted, 6);

  const handleExport = () => {
    exportToCSV(sorted, 'lms-courses', [
      { key: 'name', label: 'Course Name' },
      { key: 'instructor', label: 'Instructor' },
      { key: 'enrolledLearners', label: 'Enrolled' },
      { key: 'activeLearners', label: 'Active' },
      { key: 'completionRate', label: 'Completion Rate (%)' },
      { key: 'avgScore', label: 'Avg Score' },
      { key: 'status', label: 'Status' },
      { key: 'category', label: 'Category' },
    ]);
    addToast('Course analytics CSV exported', 'info');
  };

  const columns = [
    {
      key: 'name',
      label: 'Course',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-gray-800">{row.name}</p>
          <p className="text-[10px] text-gray-400">{row.category} • {row.duration}</p>
        </div>
      ),
    },
    {
      key: 'instructor',
      label: 'Instructor',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-600">{row.instructor}</span>,
    },
    {
      key: 'enrolledLearners',
      label: 'Enrolled',
      sortable: true,
      render: (row) => <span className="text-xs font-bold text-gray-800">{row.enrolledLearners}</span>,
    },
    {
      key: 'activeLearners',
      label: 'Active',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-600">{row.activeLearners}</span>,
    },
    {
      key: 'completionRate',
      label: 'Completion',
      sortable: true,
      render: (row) => <ProgressBar value={row.completionRate} size="sm" className="w-24" />,
    },
    {
      key: 'avgScore',
      label: 'Score',
      sortable: true,
      render: (row) => (
        <span className={`text-xs font-bold ${row.avgScore >= 80 ? 'text-success' : row.avgScore >= 60 ? 'text-warning' : 'text-danger'}`}>
          {row.avgScore > 0 ? `${row.avgScore}%` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* ============ Top Header & Action Buttons ============ */}
      <div className="page-hero mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-no-reveal>
        <PageHeroIcon icon={BookOpenCheck} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[24px] leading-tight font-extrabold tracking-tight text-gray-900">LMS Analytics</h1>
            <span className="badge-primary text-[10px]">Enterprise Learning Intelligence</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Comprehensive learner progress, certifications & performance telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary btn-sm"><Plus size={14} /> New Course</button>
          <button className="btn-outline btn-sm">Create Path</button>
          <ExportButton onClick={handleExport} label="Generate Report" />
        </div>
      </div>

      {/* ============ Hero Welcome & Journey Banner ============ */}
      <div className="card p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-xl font-bold">
                M
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Good Morning</p>
                <h2 className="text-base font-bold text-gray-800">Welcome back, Quality Director 👋</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-50 text-success text-xs font-medium">
                ⚡ Engagement +91.2%
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                👥 104.4K learners
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-info-50 text-info text-xs font-medium">
                🎓 2.5K active
              </span>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-gray-50 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600">Quarterly Learning Journey</span>
              <span className="text-sm font-bold text-primary">78.6%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-primary" style={{ width: '78.6%' }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 font-medium">
              <span>Enrolled</span>
              <span>Learning</span>
              <span>Completed</span>
              <span>Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ AI Forecast & Recommendations Banner ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left AI Forecast card (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl p-5 bg-gradient-to-br from-[#103028] to-[#141414] text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">⚡ AI Forecast Report 2026</span>
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs">✨</span>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#24997c" strokeWidth="8" strokeDasharray={`${68 * 2.64} ${(100 - 68) * 2.64}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold">68%</span>
                  <span className="text-[8px] text-white/50">Score</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/60">Projected Completion Lift</p>
                <p className="text-xl font-bold text-primary">+9.4 <span className="text-xs font-normal text-white/60">pts/quarter</span></p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
              <div><p className="text-[9px] text-white/50">Avg Scored</p><p className="text-xs font-bold mt-0.5">104.4K</p></div>
              <div><p className="text-[9px] text-white/50">Quality Growth</p><p className="text-xs font-bold text-success mt-0.5">+38%</p></div>
              <div><p className="text-[9px] text-white/50">QA Inspected</p><p className="text-xs font-bold mt-0.5">412</p></div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-600 transition-colors">
              View Full Report
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
              Dismiss
            </button>
          </div>
        </div>

        {/* Right: Today's Recommendations (3 cols) */}
        <div className="lg:col-span-3 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Today's Recommendations</h3>
            <span className="badge-primary text-[10px]">✨ 5 Active Insights</span>
          </div>
          <div className="space-y-2">
            {[
              { priority: 'High', color: 'badge-danger', title: 'Dropout prediction: 214 learners at risk in "ISO 9001 Fundamentals"', detail: 'Automated nudge sequence sent · Est. recovery 52%' },
              { priority: 'Medium', color: 'badge-warning', title: 'Skill gap detected: Cloud & QA proficiency 38% below benchmark', detail: 'Triggered post-course assignment for 412 engineers' },
              { priority: 'Info', color: 'badge-info', title: 'Personalized recommendations generated for 1,042 new learners', detail: 'Based on role assessment & quality standards gap profile' },
              { priority: 'Low', color: 'badge-secondary', title: 'Weak topic detected: "Root Cause Analysis" — 41% avg quiz score', detail: 'Supplemental micro-learning module automatically created' },
              { priority: 'Medium', color: 'badge-warning', title: 'Engagement dip in Q3 cohort down 11% week-over-week', detail: 'Trigger re-engagement sequence with peer challenge' },
            ].map((rec, i) => (
              <div key={i} className="p-2 rounded-lg bg-gray-50/80 hover:bg-gray-100 transition-colors flex items-start gap-2.5">
                <span className={`${rec.color} text-[9px] shrink-0 mt-0.5`}>{rec.priority}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800">{rec.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{rec.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Gamification & Community ============ */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Gamification & Community</h3>
          <span className="text-xs text-gray-400">Season 4 · 12 days left</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Performers */}
          <div className="space-y-2">
            {topPerformers.map(p => (
              <div key={p.rank} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">{p.medal}</span>
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{p.name}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Flame size={10} className="text-amber-500" /> {p.streak}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary">{p.xp}</span>
              </div>
            ))}
          </div>

          {/* 4 Stat Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-primary-50/50 border border-primary/10 flex flex-col justify-center">
              <p className="text-xl font-bold text-primary-700">
                <AnimatedCounter value={2.4} decimals={1} suffix="M" />
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Minutes Learned</p>
            </div>
            <div className="p-3 rounded-xl bg-accent-50/50 border border-accent/10 flex flex-col justify-center">
              <p className="text-xl font-bold text-accent-700">
                <AnimatedCounter value={18240} />
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Badges Earned</p>
            </div>
            <div className="p-3 rounded-xl bg-info-50/50 border border-info/10 flex flex-col justify-center">
              <p className="text-xl font-bold text-info-700">
                <AnimatedCounter value={3860} />
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Active Quizzes</p>
            </div>
            <div className="p-3 rounded-xl bg-success-50/50 border border-success/10 flex flex-col justify-center">
              <p className="text-xl font-bold text-success-700">
                <AnimatedCounter value={42} />
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Challenges Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Instructor & Skill Intelligence ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Instructor Leaderboard */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Instructor Leaderboard</h3>
            <span className="badge-secondary text-[9px]">by rating</span>
          </div>
          <div className="flex justify-around items-end py-2 border-b border-gray-100">
            {/* Rank 2 */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-white shadow mx-auto flex items-center justify-center font-bold text-xs text-amber-700">SA</div>
              <p className="text-[10px] font-bold text-gray-700 mt-1">Sarah Ahmed</p>
              <p className="text-[9px] text-gray-400">⭐ 4.8 · 210 hrs</p>
            </div>
            {/* Rank 1 */}
            <div className="text-center -mt-2">
              <span className="text-sm">👑</span>
              <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary shadow mx-auto flex items-center justify-center font-bold text-sm text-primary">DK</div>
              <p className="text-xs font-bold text-gray-800 mt-1">Dr. Kamran</p>
              <p className="text-[10px] text-primary font-semibold">⭐ 4.9 · 282 hrs</p>
            </div>
            {/* Rank 3 */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow mx-auto flex items-center justify-center font-bold text-xs text-blue-700">AK</div>
              <p className="text-[10px] font-bold text-gray-700 mt-1">Ali Khan</p>
              <p className="text-[9px] text-gray-400">⭐ 4.7 · 195 hrs</p>
            </div>
          </div>
          <button className="w-full mt-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            View All Instructors
          </button>
        </div>

        {/* Instructor Performance Bar Chart */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Instructor Performance</h3>
            <span className="text-[10px] text-gray-400">Teaching hours vs Satisfaction</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={instructorPerfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="hours" fill="#24997c" name="Hours" radius={[4, 4, 0, 0]} />
              <Bar dataKey="satisfaction" fill="#6174bc" name="Satisfaction %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Intelligence (4 Circular gauges) */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Skill Intelligence</h3>
            <span className="badge-primary text-[9px]">Competency</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              { label: 'Quality Assurance', val: 82, level: 'Level 5', color: 'text-primary' },
              { label: 'Audit & Compliance', val: 65, level: 'Level 4', color: 'text-info' },
              { label: 'Process Imprv', val: 44, level: 'Level 3', color: 'text-amber-500' },
              { label: 'Lab Operations', val: 54, level: 'Level 3', color: 'text-accent' },
            ].map((sk, i) => (
              <div key={i} className="p-2 rounded-xl bg-gray-50">
                <div className="relative w-14 h-14 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className={sk.color} strokeWidth="8" strokeDasharray={`${sk.val * 2.51} ${(100 - sk.val) * 2.51}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                    {sk.val}%
                  </div>
                </div>
                <p className="text-[10px] font-semibold text-gray-700 mt-1 truncate">{sk.label}</p>
                <p className="text-[9px] text-gray-400">{sk.level}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Assessment Distribution & Certification Tracker ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assessment Distribution */}
        <div className="card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Assessment Distribution</h3>
          <p className="text-[10px] text-gray-400 mb-3">Pass / fail across all graded evaluations</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={assessmentDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                  {assessmentDist.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-gray-400">Pass Rate</span>
              <span className="text-base font-bold text-success">67.2%</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-gray-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />Passed 67%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />Retaken 22%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" />Failed 11%</span>
          </div>
        </div>

        {/* Certification Tracker (6 cards) */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Certification Tracker</h3>
            <span className="badge-primary text-[10px]">6 In-flight</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {[
              { name: 'ISO 9001 Lead Auditor', progress: 82, status: 'On Track', color: 'text-success' },
              { name: 'Six Sigma Green Belt', progress: 66, status: 'In progress', color: 'text-primary' },
              { name: 'GMP Compliance Pro', progress: 100, status: 'Completed', color: 'text-success' },
              { name: 'Lab Safety Certified', progress: 24, status: 'At risk', color: 'text-danger' },
              { name: 'Internal Auditor 2026', progress: 60, status: 'In progress', color: 'text-info' },
              { name: 'ISO 14001 Specialist', progress: 12, status: 'Overdue', color: 'text-danger' },
            ].map((c, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-bold ${c.color}`}>{c.progress}%</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                    c.status === 'Completed' || c.status === 'On Track' ? 'bg-success-50 text-success' : c.status === 'At risk' || c.status === 'Overdue' ? 'bg-danger-50 text-danger' : 'bg-info-50 text-info'
                  }`}>{c.status}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{c.name}</p>
                <div className="h-1 rounded-full bg-gray-200 mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${c.progress > 70 ? 'bg-success' : c.progress > 40 ? 'bg-primary' : 'bg-danger'}`} style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Revenue Intelligence & Global Footprint ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Intelligence */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Revenue Intelligence</h3>
              <p className="text-[10px] text-gray-400">Subscription, corporate & certification revenue</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="badge-success text-[10px]">+ PKR 28.5M</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueStreamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}K`} />
              <Tooltip formatter={(v) => `$${v}K`} contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="subscription" stackId="a" fill="#24997c" name="Subscription" />
              <Bar dataKey="corporate" stackId="a" fill="#6174bc" name="Corporate" />
              <Bar dataKey="certification" stackId="a" fill="#3e7ead" name="Certification" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Global Learning Footprint */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Global Learning Footprint</h3>
            <span className="badge-info text-[9px]">34 Countries</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-gray-400">Active Learners</p>
              <p className="text-base font-bold text-gray-800">100.9K</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Revenue Reach</p>
              <p className="text-base font-bold text-primary">PKR 3.66M</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { region: 'North America', pct: 41.2, color: 'bg-primary' },
              { region: 'EMEA', pct: 28.6, color: 'bg-accent' },
              { region: 'APAC', pct: 22.4, color: 'bg-info' },
              { region: 'LATAM', pct: 7.8, color: 'bg-warning' },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{r.region}</span>
                  <span className="font-semibold text-gray-800">{r.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Enterprise Training - Department Performance ============ */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">Enterprise Training — Department Performance</h3>
            <p className="text-[11px] text-gray-400">Completion, compliance & ROI across business units</p>
          </div>
          <span className="badge-secondary text-[10px]">312 corporate clients</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="font-semibold pb-2">Department</th>
                <th className="font-semibold pb-2">Learners</th>
                <th className="font-semibold pb-2">Completion</th>
                <th className="font-semibold pb-2">Compliance</th>
                <th className="font-semibold pb-2">Training ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deptPerformance.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-2.5 font-medium text-gray-800">{d.dept}</td>
                  <td className="py-2.5 text-gray-600">{d.learners.toLocaleString()}</td>
                  <td className="py-2.5">
                    <ProgressBar value={d.completion} size="sm" className="w-28" />
                  </td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      d.compliance === 'Compliant' ? 'bg-success-50 text-success' : 'bg-danger-50 text-danger'
                    }`}>
                      {d.compliance === 'Compliant' ? '✓ Compliant' : '⚠ At Risk'}
                    </span>
                  </td>
                  <td className="py-2.5 font-bold text-primary">{d.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ Bottom Row: At-Risk Learners & Popular Courses ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* At-Risk Learners */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">At-Risk Learners</h3>
            <span className="badge-danger text-[9px]">⚠ Flagged</span>
          </div>
          <div className="space-y-2.5">
            {atRiskLearners.map((l, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-danger-50 text-danger flex items-center justify-center text-xs font-bold shrink-0">
                    {l.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{l.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{l.issue}</p>
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${l.riskColor} shrink-0`}>
                  {l.risk}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            View All 457 Flagged Learners
          </button>
        </div>

        {/* Popular Courses Table with filters (2 cols) */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Popular Courses</h3>
            <div className="flex flex-wrap gap-2">
              <SearchInput value={query} onChange={setQuery} placeholder="Search courses..." className="w-40 sm:w-48" />
              <FilterDropdown
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categories.map(c => ({ value: c, label: c }))}
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={pagination.paginatedData}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            pagination={pagination}
            emptyTitle="No courses found"
            emptyDescription="Try adjusting your filters."
            actions={(row) => (
              <button onClick={() => setViewModal(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-info hover:bg-info/10">
                <Eye size={14} />
              </button>
            )}
          />
        </div>
      </div>

      {/* ============ View Modal ============ */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Course Details" size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{viewModal.name}</h3>
                <p className="text-sm text-gray-500">{viewModal.category} • {viewModal.duration}</p>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-400">Instructor</p><p className="text-sm font-medium text-gray-700">{viewModal.instructor}</p></div>
              <div><p className="text-xs text-gray-400">Enrolled</p><p className="text-sm font-medium text-gray-700">{viewModal.enrolledLearners}</p></div>
              <div><p className="text-xs text-gray-400">Active</p><p className="text-sm font-medium text-gray-700">{viewModal.activeLearners}</p></div>
              <div><p className="text-xs text-gray-400">Avg Score</p><p className="text-sm font-medium text-gray-700">{viewModal.avgScore}%</p></div>
              <div><p className="text-xs text-gray-400">Start Date</p><p className="text-sm font-medium text-gray-700">{viewModal.startDate}</p></div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Completion Rate</p>
              <ProgressBar value={viewModal.completionRate} size="lg" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
