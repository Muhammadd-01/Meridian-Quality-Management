import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  BookOpen, Users, GraduationCap, Award, TrendingUp,
  BarChart3, Eye
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import DataTable from '../../components/tables/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialCourses } from '../../data/courses';
import { enrollmentTrends } from '../../data/dashboard';
import { formatNumber, formatPercent } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';

const COLORS = ['#40BFA6', '#7c5cfc', '#17a2b8', '#ffc107', '#dc3545', '#28a745'];

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
  const activeCourses = courses.filter(c => c.status === 'Active').length;
  const avgCompletion = courses.filter(c => c.completionRate > 0).reduce((s, c, _, a) => s + c.completionRate / a.length, 0);
  const avgScore = courses.filter(c => c.avgScore > 0).reduce((s, c, _, a) => s + c.avgScore / a.length, 0);

  // Categories
  const categories = useMemo(() => [
    'All',
    ...Array.from(new Set(courses.map(c => c.category)))
  ], [courses]);

  // Course popularity chart data
  const coursePopularity = useMemo(() =>
    [...courses]
      .sort((a, b) => b.enrolledLearners - a.enrolledLearners)
      .slice(0, 6)
      .map(c => ({ name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name, learners: c.enrolledLearners, completion: c.completionRate }))
  , [courses]);

  // Assessment performance
  const assessmentData = useMemo(() =>
    courses.filter(c => c.avgScore > 0).map(c => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      score: c.avgScore
    }))
  , [courses]);

  // Completion distribution
  const completionDist = useMemo(() => {
    const ranges = [
      { name: '0-25%', min: 0, max: 25, fill: '#dc3545' },
      { name: '26-50%', min: 26, max: 50, fill: '#ffc107' },
      { name: '51-75%', min: 51, max: 75, fill: '#17a2b8' },
      { name: '76-100%', min: 76, max: 100, fill: '#40BFA6' },
    ];
    return ranges.map(r => ({
      ...r,
      value: courses.filter(c => c.completionRate >= r.min && c.completionRate <= r.max).length
    }));
  }, [courses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats = {};
    courses.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
    return Object.entries(cats).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    let data = courses;
    if (statusFilter !== 'All') data = data.filter(c => c.status === statusFilter);
    if (categoryFilter !== 'All') data = data.filter(c => c.category === categoryFilter);
    return data;
  }, [courses, statusFilter, categoryFilter]);

  const { query, setQuery, filtered } = useSearch(filteredCourses, ['name', 'instructor', 'category']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'name');
  const pagination = usePagination(sorted, 8);

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
    addToast('CSV exported successfully', 'info');
  };

  const columns = [
    {
      key: 'name',
      label: 'Course',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.name}</p>
          <p className="text-xs text-gray-400">{row.category} • {row.duration}</p>
        </div>
      ),
    },
    {
      key: 'instructor',
      label: 'Instructor',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-600">{row.instructor}</span>,
    },
    {
      key: 'enrolledLearners',
      label: 'Enrolled',
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-gray-700">{row.enrolledLearners}</span>,
    },
    {
      key: 'activeLearners',
      label: 'Active',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-600">{row.activeLearners}</span>,
    },
    {
      key: 'completionRate',
      label: 'Completion',
      sortable: true,
      render: (row) => <ProgressBar value={row.completionRate} size="sm" className="w-24" />,
    },
    {
      key: 'avgScore',
      label: 'Avg Score',
      sortable: true,
      render: (row) => (
        <span className={`text-sm font-medium ${row.avgScore >= 80 ? 'text-success' : row.avgScore >= 60 ? 'text-warning' : 'text-danger'}`}>
          {row.avgScore > 0 ? row.avgScore : 'N/A'}
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
    <div>
      <PageHeader
        title="LMS Analytics"
        subtitle="Learning management and training performance metrics"
        breadcrumbs={[{ label: 'LMS Analytics' }]}
        actions={
          <div className="flex items-center gap-2">
            <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total Learners" value={formatNumber(totalLearners)} icon={Users} iconColor="bg-primary/10 text-primary" change="+28" changeType="increase" subtitle="this month" />
        <StatCard title="Active Learners" value={formatNumber(activeLearners)} icon={GraduationCap} iconColor="bg-info/10 text-info" />
        <StatCard title="Total Courses" value={totalCourses} icon={BookOpen} iconColor="bg-accent/10 text-accent" />
        <StatCard title="Completion Rate" value={formatPercent(avgCompletion)} icon={Award} iconColor="bg-success/10 text-success" />
        <StatCard title="Avg Score" value={avgScore.toFixed(1)} icon={BarChart3} iconColor="bg-warning/10 text-warning" />
        <StatCard title="Active Courses" value={activeCourses} icon={TrendingUp} iconColor="bg-primary/10 text-primary" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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

        <ChartCard title="Course Popularity" subtitle="Top courses by enrollment">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={coursePopularity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={120} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="learners" fill="#40BFA6" radius={[0, 6, 6, 0]} name="Enrolled" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Assessment Performance" subtitle="Average scores by course">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={assessmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="score" name="Avg Score" radius={[6, 6, 0, 0]}>
                {assessmentData.map((entry, i) => (
                  <Cell key={i} fill={entry.score >= 80 ? '#28a745' : entry.score >= 60 ? '#ffc107' : '#dc3545'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completion Distribution" subtitle="Courses by completion range">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={completionDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                {completionDist.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Course Categories" subtitle="Distribution by category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
                {categoryBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Course Table */}
      <div className="card card-body mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search courses..." className="flex-1" />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'All', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Completed', label: 'Completed' }, { value: 'Draft', label: 'Draft' }]}
          />
          <FilterDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories.map(c => ({ value: c, label: c }))}
          />
          <ExportButton onClick={handleExport} />
        </div>
        <DataTable
          columns={columns}
          data={pagination.paginatedData}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          pagination={pagination}
          emptyTitle="No courses found"
          emptyDescription="Try adjusting your search or filters."
          actions={(row) => (
            <button onClick={() => setViewModal(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-info hover:bg-info/10" title="View Details">
              <Eye size={15} />
            </button>
          )}
        />
      </div>

      {/* View Modal */}
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
              <div><p className="text-xs text-gray-400">Avg Score</p><p className="text-sm font-medium text-gray-700">{viewModal.avgScore}</p></div>
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
