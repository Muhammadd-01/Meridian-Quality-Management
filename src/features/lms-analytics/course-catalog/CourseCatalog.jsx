import React, { useState, useMemo } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, Eye, Download, Award,
  Users, Clock, CheckCircle2, Search, Filter, BookMarked,
  GraduationCap, Star, BarChart3
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import ProgressBar from '../../../components/ui/ProgressBar';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import { initialCourses } from '../../../data/courses';
import { formatDate, generateId, formatNumber } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';

export default function CourseCatalog() {
  const [courses, setCourses] = useLocalStorage('meridian-courses', initialCourses);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(courses, ['name', 'instructor', 'category']);

  // Filters
  const filteredCourses = useMemo(() => {
    return searchFiltered.filter(c => {
      const matchCat = categoryFilter === 'All' || c.category === categoryFilter;
      const matchStat = statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase();
      return matchCat && matchStat;
    });
  }, [searchFiltered, categoryFilter, statusFilter]);

  // Pagination
  const pagination = usePagination(filteredCourses, 6);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    instructor: 'Dr. Kamran Hussain',
    category: 'Quality Standards',
    duration: '30 hours',
    status: 'Active',
    enrolledLearners: 50,
    activeLearners: 42,
    completionRate: 70,
    avgScore: 82,
    startDate: '2026-10-01',
  });

  const handleOpenAdd = () => {
    setEditCourse(null);
    setFormData({
      name: '',
      instructor: 'Dr. Kamran Hussain',
      category: 'Quality Standards',
      duration: '40 hours',
      status: 'Active',
      enrolledLearners: 25,
      activeLearners: 20,
      completionRate: 60,
      avgScore: 80,
      startDate: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditCourse(course);
    setFormData({ ...course });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editCourse) {
      setCourses(prev =>
        prev.map(c =>
          c.id === editCourse.id
            ? {
                ...formData,
                enrolledLearners: Number(formData.enrolledLearners),
                activeLearners: Number(formData.activeLearners),
                completionRate: Number(formData.completionRate),
                avgScore: Number(formData.avgScore),
              }
            : c
        )
      );
      addToast('Course syllabus updated!', 'success');
    } else {
      const newCourse = {
        id: `course-${generateId()}`,
        ...formData,
        enrolledLearners: Number(formData.enrolledLearners),
        activeLearners: Number(formData.activeLearners),
        completionRate: Number(formData.completionRate),
        avgScore: Number(formData.avgScore),
      };
      setCourses(prev => [newCourse, ...prev]);
      addToast('New course added to catalog!', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setCourses(prev => prev.filter(c => c.id !== deleteConfirm.id));
    addToast(`Course "${deleteConfirm.name}" deleted.`, 'success');
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    exportToCSV(
      courses,
      'meridian_course_catalog',
      [
        { key: 'name', label: 'Course Name' },
        { key: 'category', label: 'Category' },
        { key: 'instructor', label: 'Instructor' },
        { key: 'duration', label: 'Duration' },
        { key: 'enrolledLearners', label: 'Enrolled' },
        { key: 'completionRate', label: 'Completion (%)' },
        { key: 'avgScore', label: 'Avg Score' },
        { key: 'status', label: 'Status' },
      ]
    );
    addToast('Course catalog exported to CSV!', 'info');
  };

  // KPIs
  const totalLearners = courses.reduce((sum, c) => sum + (c.enrolledLearners || 0), 0);
  const avgCompletion = courses.length ? Math.round(courses.reduce((sum, c) => sum + (c.completionRate || 0), 0) / courses.length) : 0;
  const activeCoursesCount = courses.filter(c => c.status === 'Active').length;

  return (
    <div>
      <PageHeader
        title="Course Catalog"
        subtitle="Professional quality management credentials, ISO auditing certifications, and technical workshops."
        breadcrumbs={[
          { label: 'LMS Analytics', href: '/lms-analytics' },
          { label: 'Course Catalog' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExport} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Course
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Catalog Courses"
          value={courses.length}
          subtitle={`${activeCoursesCount} actively enrolling`}
          icon={BookOpen}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Enrolled"
          value={formatNumber(totalLearners)}
          subtitle="Enterprise students"
          icon={Users}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Avg Completion Rate"
          value={`${avgCompletion}%`}
          subtitle="Benchmark completion"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Accredited Tracks"
          value="8 Specialties"
          subtitle="ISO, Six Sigma, GMP"
          icon={Award}
          iconColor="bg-accent/10 text-accent"
        />
      </div>

      {/* Filters and Search */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search courses, instructors, tracks..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'All', label: 'All Categories' },
                { value: 'Quality Standards', label: 'Quality Standards' },
                { value: 'Auditing', label: 'Auditing' },
                { value: 'Process Improvement', label: 'Process Improvement' },
                { value: 'Quality Tools', label: 'Quality Tools' },
                { value: 'Industry Standards', label: 'Industry Standards' },
                { value: 'Risk Management', label: 'Risk Management' },
              ]}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Draft', label: 'Draft' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {pagination.paginatedData.map(course => (
          <div
            key={course.id}
            className="card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="badge-primary text-2xs uppercase tracking-wider font-semibold">
                  {course.category}
                </span>
                <StatusBadge status={course.status} />
              </div>

              <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                {course.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <span>Instructor:</span>
                <strong className="text-gray-700">{course.instructor}</strong>
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs">
                <div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide block">Duration</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-gray-400" />
                    {course.duration}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide block">Enrolled</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                    <Users size={12} className="text-gray-400" />
                    {course.enrolledLearners} Learners
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-500 font-medium">Cohort Completion Rate</span>
                  <span className="font-bold text-primary">{course.completionRate}%</span>
                </div>
                <ProgressBar value={course.completionRate} size="sm" showLabel={false} />
              </div>

              {/* Avg Score */}
              <div className="flex items-center justify-between text-xs mt-3 text-gray-500">
                <span>Avg Assessment Score</span>
                <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-2xs">
                  {course.avgScore > 0 ? `${course.avgScore}%` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <span className="text-2xs text-gray-400">
                Starts {formatDate(course.startDate)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewCourse(course)}
                  className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                  title="View Course Syllabus"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => handleOpenEdit(course)}
                  className="p-1.5 text-gray-500 hover:text-info hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Course"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(course)}
                  className="p-1.5 text-gray-500 hover:text-danger hover:bg-gray-100 rounded-lg transition-colors"
                  title="Delete Course"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.goToPage}
        totalItems={pagination.totalItems}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
      />

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCourse ? 'Edit Course Details' : 'Add Course to Catalog'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editCourse ? 'Save Changes' : 'Publish Course'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Course Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. ISO 9001:2015 Lead Auditor Masterclass"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Instructor *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Quality Standards">Quality Standards</option>
                <option value="Auditing">Auditing</option>
                <option value="Process Improvement">Process Improvement</option>
                <option value="Quality Tools">Quality Tools</option>
                <option value="Industry Standards">Industry Standards</option>
                <option value="Risk Management">Risk Management</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-input"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 40 hours"
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Enrolled</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.enrolledLearners}
                onChange={(e) => setFormData({ ...formData, enrolledLearners: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Completion %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.completionRate}
                onChange={(e) => setFormData({ ...formData, completionRate: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Avg Score</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.avgScore}
                onChange={(e) => setFormData({ ...formData, avgScore: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Course Modal */}
      {viewCourse && (
        <Modal
          isOpen={!!viewCourse}
          onClose={() => setViewCourse(null)}
          title={viewCourse.name}
          size="md"
          footer={
            <button className="btn-secondary" onClick={() => setViewCourse(null)}>Close</button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="badge-primary text-2xs uppercase tracking-wide font-semibold">{viewCourse.category}</span>
                <p className="text-sm font-semibold text-gray-800 mt-1">Instructor: {viewCourse.instructor}</p>
              </div>
              <StatusBadge status={viewCourse.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block">Total Enrolled</span>
                <span className="font-bold text-gray-800 text-sm">{viewCourse.enrolledLearners} students</span>
              </div>
              <div>
                <span className="text-gray-400 block">Course Duration</span>
                <span className="font-bold text-gray-800 text-sm">{viewCourse.duration}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Average Quiz Score</span>
                <span className="font-bold text-primary text-sm">{viewCourse.avgScore}%</span>
              </div>
              <div>
                <span className="text-gray-400 block">Completion Rate</span>
                <span className="font-bold text-success text-sm">{viewCourse.completionRate}%</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Curriculum Modules</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 size={14} className="text-primary" /> Module 1: Foundations, Scope, and Standard References
                </li>
                <li className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 size={14} className="text-primary" /> Module 2: Leadership, Planning, and Support Infrastructure
                </li>
                <li className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 size={14} className="text-primary" /> Module 3: Operational Control and Non-Conformance Management
                </li>
                <li className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 size={14} className="text-primary" /> Module 4: Performance Evaluation and Management Review
                </li>
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to remove "${deleteConfirm?.name}" from catalog?`}
      />
    </div>
  );
}
