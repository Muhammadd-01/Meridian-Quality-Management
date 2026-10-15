import React, { useState, useMemo } from 'react';
import {
  Activity, Award, CheckCircle2, UserPlus, MessageSquare,
  Clock, BookOpen, AlertTriangle, Plus, Download, Search,
  Filter, Calendar, User, Check
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import ExportButton from '../../../components/ui/ExportButton';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import { initialLmsActivityFeed } from '../../../data/lmsData';
import { initialCourses } from '../../../data/courses';
import { generateId } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';

const eventIcons = {
  Certificate: { icon: Award, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  'Quiz Submission': { icon: CheckCircle2, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  Enrollment: { icon: UserPlus, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  'Instructor Feedback': { icon: MessageSquare, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  'Module Progress': { icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  'Course Published': { icon: BookOpen, color: 'bg-purple-50 text-purple-600 border-purple-200' },
};

export default function ActivityFeed() {
  const [feed, setFeed] = useLocalStorage('meridian-lms-activity-feed', initialLmsActivityFeed);
  const [typeFilter, setTypeFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(feed, ['user', 'course', 'event', 'type']);

  // Filter
  const filteredFeed = useMemo(() => {
    if (typeFilter === 'All') return searchFiltered;
    return searchFiltered.filter(item => item.type === typeFilter);
  }, [searchFiltered, typeFilter]);

  // Pagination
  const pagination = usePagination(filteredFeed, 8);

  // Form State
  const [formData, setFormData] = useState({
    user: 'Alexandra Vance',
    course: initialCourses[0]?.name || 'ISO 9001:2015 Fundamentals',
    type: 'Certificate',
    event: 'Achieved Certificate of Completion (Score: 94%)',
  });

  const handleCreateEvent = (e) => {
    e.preventDefault();
    const initials = formData.user.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const newEvent = {
      id: `lms-act-${generateId()}`,
      ...formData,
      userAvatar: initials,
      time: 'Just now',
      typeColor: 'bg-primary-50 text-primary',
    };
    setFeed(prev => [newEvent, ...prev]);
    addToast('Learning milestone event broadcasted!', 'success');
    setModalOpen(false);
  };

  const handleExport = () => {
    exportToCSV(
      feed,
      'meridian_lms_activity_feed',
      [
        { key: 'user', label: 'Learner' },
        { key: 'course', label: 'Course' },
        { key: 'type', label: 'Event Type' },
        { key: 'event', label: 'Description' },
        { key: 'time', label: 'Timestamp' },
      ]
    );
    addToast('LMS feed exported to CSV!', 'info');
  };

  // KPIs
  const certCount = feed.filter(f => f.type === 'Certificate').length;
  const quizCount = feed.filter(f => f.type === 'Quiz Submission').length;
  const enrollCount = feed.filter(f => f.type === 'Enrollment').length;

  return (
    <div>
      <PageHeader
        title="Activity Feed"
        subtitle="Real-time broadcast of learner milestones, certification awards, and course progress."
        breadcrumbs={[
          { label: 'LMS Analytics', href: '/lms-analytics' },
          { label: 'Activity Feed' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExport} />
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Broadcast Milestone
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Milestone Events"
          value={feed.length}
          subtitle="Total recorded activities"
          icon={Activity}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Certificates Granted"
          value={certCount}
          subtitle="Distinctions issued"
          icon={Award}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Quiz Submissions"
          value={quizCount}
          subtitle="Exams completed"
          icon={CheckCircle2}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="New Enrollments"
          value={enrollCount}
          subtitle="Cohort additions"
          icon={UserPlus}
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
              placeholder="Search learner, course, milestone..."
            />
          </div>
          <div className="flex items-center gap-3">
            <FilterDropdown
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'All', label: 'All Event Types' },
                { value: 'Certificate', label: 'Certificates' },
                { value: 'Quiz Submission', label: 'Quiz Submissions' },
                { value: 'Enrollment', label: 'Enrollments' },
                { value: 'Instructor Feedback', label: 'Instructor Feedback' },
                { value: 'Module Progress', label: 'Module Progress' },
                { value: 'Course Published', label: 'Course Updates' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="card divide-y divide-gray-100 mb-6">
        {pagination.paginatedData.map(item => {
          const meta = eventIcons[item.type] || eventIcons.Enrollment;
          const IconComp = meta.icon;

          return (
            <div key={item.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition-colors flex items-start gap-4">
              {/* Event Type Icon badge */}
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${meta.color}`}>
                <IconComp size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center">
                      {item.userAvatar || 'U'}
                    </div>
                    <span className="font-bold text-xs text-gray-900">{item.user}</span>
                    <span className="text-2xs text-gray-400">•</span>
                    <span className="text-2xs text-gray-500 font-medium">{item.course}</span>
                  </div>
                  <span className="text-2xs text-gray-400 font-medium">{item.time}</span>
                </div>

                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {item.event}
                </p>

                <div className="mt-2">
                  <span className="badge-secondary text-[11px] uppercase tracking-wider font-semibold">
                    {item.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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

      {/* Broadcast Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Broadcast Learning Milestone"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreateEvent}>Broadcast</button>
          </>
        }
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="form-label">Learner Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Course Subject *</label>
            <select
              className="form-select"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            >
              {initialCourses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Event Type</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Certificate">Certificate</option>
              <option value="Quiz Submission">Quiz Submission</option>
              <option value="Enrollment">Enrollment</option>
              <option value="Instructor Feedback">Instructor Feedback</option>
              <option value="Module Progress">Module Progress</option>
            </select>
          </div>

          <div>
            <label className="form-label">Milestone Description *</label>
            <textarea
              rows={3}
              required
              className="form-input"
              value={formData.event}
              onChange={(e) => setFormData({ ...formData, event: e.target.value })}
              placeholder="e.g. Achieved 100% on Root Cause Analysis Practical Exercise"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
