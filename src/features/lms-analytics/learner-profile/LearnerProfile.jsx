import React, { useState, useMemo } from 'react';
import {
  UserCheck, Award, BookOpen, Clock, CheckCircle2,
  Mail, Building2, Calendar, FileText, Download, ChevronDown,
  Layers, Star, ShieldCheck, ArrowRight, User
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import ProgressBar from '../../../components/ui/ProgressBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import ExportButton from '../../../components/ui/ExportButton';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { initialLearners } from '../../../data/lmsData';
import { formatDate, generateId } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';
import useCollection from '../../../hooks/useCollection';
import { EnrolledCourses, CompletionHistory, QuizTimeline, enrollmentsFor, todayKey } from './LearnerCourses';

const activityDate = () => new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export default function LearnerProfile() {
  const [learners, setLearners] = useLocalStorage('meridian-learners', initialLearners);
  const [selectedLearnerId, setSelectedLearnerId] = useState(learners[0]?.id || 'lrn-001');
  const [assignModal, setAssignModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [assignTarget, setAssignTarget] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignError, setAssignError] = useState('');
  const [courses] = useCollection('courses');
  const addToast = useToast();

  const currentLearner = learners.find(l => l.id === selectedLearnerId) || learners[0];
  const enrolledNames = useMemo(
    () => new Set(enrollmentsFor(currentLearner).map(e => e.course.toLowerCase())),
    [currentLearner]
  );
  const assignableCourses = courses.filter(c => c.name && !enrolledNames.has(c.name.toLowerCase()));

  // Applies a change to the selected learner, materialising enrollments so profile-derived ones are kept.
  const updateLearner = (fn) => {
    setLearners(prev => prev.map(l => (l.id === currentLearner.id ? fn({ ...l, enrollments: enrollmentsFor(l) }) : l)));
  };

  const openAssign = () => {
    setNewCourseName(assignableCourses[0]?.name || '');
    setAssignTarget('');
    setAssignNotes('');
    setAssignError('');
    setAssignModal(true);
  };

  const handleAssignCourse = (e) => {
    e.preventDefault();
    if (!newCourseName) { setAssignError('Select a course.'); return; }
    if (enrolledNames.has(newCourseName.toLowerCase())) { setAssignError(`${currentLearner.name} is already enrolled in ${newCourseName}.`); return; }
    if (assignTarget && assignTarget < todayKey()) { setAssignError('Target completion date cannot be in the past.'); return; }
    updateLearner(l => ({
      ...l,
      enrollments: [
        ...l.enrollments,
        { id: `enr-${generateId()}`, course: newCourseName, progress: 0, status: 'In Progress', enrolledAt: todayKey(), targetDate: assignTarget, completedAt: null, notes: assignNotes.trim() },
      ],
      currentCourse: l.currentCourse || newCourseName,
      currentCourseProgress: l.currentCourse ? l.currentCourseProgress : 0,
      enrolledCount: (l.enrolledCount || 0) + 1,
      recentActivities: [
        { action: `Enrolled in ${newCourseName}`, date: activityDate() },
        ...(l.recentActivities || [])
      ]
    }));
    addToast(`Assigned ${newCourseName} to ${currentLearner.name}!`, 'success');
    setAssignModal(false);
  };

  const handleComplete = (enrollment) => {
    updateLearner(l => {
      const enrollments = l.enrollments.map(en => (en.id === enrollment.id
        ? { ...en, progress: 100, status: 'Completed', completedAt: todayKey() }
        : en));
      const next = enrollments.find(en => en.status !== 'Completed');
      const wasCurrent = l.currentCourse === enrollment.course;
      return {
        ...l,
        enrollments,
        completedCount: (l.completedCount || 0) + 1,
        currentCourse: wasCurrent ? (next?.course || '') : l.currentCourse,
        currentCourseProgress: wasCurrent ? (next?.progress || 0) : l.currentCourseProgress,
        recentActivities: [
          { action: `Completed course: ${enrollment.course}`, date: activityDate() },
          ...(l.recentActivities || [])
        ],
      };
    });
    addToast(`${enrollment.course} marked complete.`, 'success');
  };

  const handleProgress = (enrollment, value) => {
    if (value >= 100) { handleComplete(enrollment); return; }
    updateLearner(l => ({
      ...l,
      enrollments: l.enrollments.map(en => (en.id === enrollment.id ? { ...en, progress: value } : en)),
      currentCourseProgress: l.currentCourse === enrollment.course ? value : l.currentCourseProgress,
    }));
    addToast(`${enrollment.course} progress set to ${value}%.`, 'success');
  };

  const handleExportTranscript = () => {
    exportToCSV(
      currentLearner.quizHistory,
      `${currentLearner.name.replace(/\s+/g, '_')}_transcript`,
      [
        { key: 'quizTitle', label: 'Assessment' },
        { key: 'score', label: 'Score (%)' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date Completed' },
      ]
    );
    addToast('Learner transcript exported to CSV!', 'info');
  };

  return (
    <div>
      <PageHeader
        title="Learner Profile"
        subtitle="Individual competency assessment, accreditation milestones, and training transcripts."
        breadcrumbs={[
          { label: 'LMS Analytics', href: '/lms-analytics' },
          { label: 'Learner Profile' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Learner Selector */}
            <div className="relative">
              <label htmlFor="learnerProfile-select-learner" className="sr-only">Select learner</label>
              <select
                id="learnerProfile-select-learner"
                value={selectedLearnerId}
                onChange={(e) => setSelectedLearnerId(e.target.value)}
                className="form-select text-sm font-medium pr-8"
              >
                {learners.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.role})
                  </option>
                ))}
              </select>
            </div>
            <ExportButton onClick={handleExportTranscript} label="Export Transcript" />
            <button type="button" onClick={openAssign} className="btn-primary">
              <BookOpen size={16} /> Assign Course
            </button>
          </div>
        }
      />

      {/* Profile Header Banner */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md ${currentLearner.avatarColor || 'bg-primary text-white'}`}>
              {currentLearner.avatar || 'AV'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{currentLearner.name}</h2>
                <StatusBadge status={currentLearner.status} />
              </div>
              <p className="text-sm font-medium text-gray-600 mt-0.5">{currentLearner.role}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-gray-400" />
                  {currentLearner.department}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-gray-400" />
                  {currentLearner.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-gray-400" />
                  Joined {formatDate(currentLearner.joinedDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-xs flex items-center gap-1.5">
              <ShieldCheck size={14} /> Certified Quality Auditor
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Enrolled Tracks"
          value={currentLearner.enrolledCount}
          subtitle="Accredited courses"
          icon={BookOpen}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Completed"
          value={currentLearner.completedCount}
          subtitle="Passed final audits"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Training Time"
          value={`${currentLearner.hoursLearned} hrs`}
          subtitle="Hours completed"
          icon={Clock}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Digital Badges"
          value={currentLearner.badgesEarned}
          subtitle="Accreditations"
          icon={Award}
          iconColor="bg-accent/10 text-accent"
        />
        <StatCard
          title="Avg Quiz Score"
          value={`${currentLearner.avgQuizScore}%`}
          subtitle="Competency metric"
          icon={Star}
          iconColor="bg-warning/10 text-warning"
        />
      </div>

      {/* Enrolled courses & completion history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <EnrolledCourses learner={currentLearner} onProgress={handleProgress} onComplete={handleComplete} />
        </div>
        <CompletionHistory learner={currentLearner} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Active Track Progress & Accomplishments */}
        <div className="space-y-6">
          {/* Active Course Card */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Currently In Progress
            </h3>
            {!currentLearner.currentCourse ? (
              <p className="text-xs text-gray-400">No course in progress.</p>
            ) : (
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="badge-primary text-2xs uppercase">Quality Standards</span>
                <span className="text-xs font-bold text-primary">{currentLearner.currentCourseProgress}%</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                {currentLearner.currentCourse}
              </h4>
              <ProgressBar value={currentLearner.currentCourseProgress} size="sm" showLabel={false} />
              <p className="text-2xs text-gray-500 mt-2">Next milestone: Final clause review & mock audit exam</p>
            </div>
            )}

            {/* Active Tracks */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-gray-700 block mb-2">Active Specialization Tracks:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentLearner.activeTracks?.map((track, i) => (
                  <span key={i} className="badge-secondary text-2xs">
                    {track}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recent LMS Activities */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Recent Learning Milestones
            </h3>
            <div className="space-y-4">
              {currentLearner.recentActivities?.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 bg-primary shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-800 leading-snug">{act.action}</p>
                    <p className="text-2xs text-gray-400 mt-0.5">{act.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quiz & Assessment History */}
        <div className="lg:col-span-2 space-y-6">
          <QuizTimeline learner={currentLearner} />
          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-gray-800">
                Examination & Competency History
              </h3>
              <span className="badge-primary text-2xs">Verified Records</span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assessment Title</th>
                    <th>Score</th>
                    <th>Date Completed</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLearner.quizHistory?.map((quiz, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-primary shrink-0" />
                          <span className="font-semibold text-xs text-gray-900">{quiz.quizTitle}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-bold ${quiz.score >= 80 ? 'text-success' : 'text-warning'}`}>
                          {quiz.score}%
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500">{formatDate(quiz.date)}</span>
                      </td>
                      <td>
                        <StatusBadge status={quiz.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Course Modal */}
      <Modal
        isOpen={assignModal}
        onClose={() => setAssignModal(false)}
        title={`Assign Course to ${currentLearner.name}`}
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setAssignModal(false)}>Cancel</button>
            <button type="submit" form="learnerProfile-assignCourse-form" className="btn-primary" disabled={!assignableCourses.length}>Confirm Assignment</button>
          </>
        }
      >
        <form id="learnerProfile-assignCourse-form" onSubmit={handleAssignCourse} className="space-y-4">
          {assignError && <p role="alert" className="form-error">{assignError}</p>}
          <div>
            <label htmlFor="learnerProfile-field-1" className="form-label">Select Course *</label>
            {assignableCourses.length ? (
              <select id="learnerProfile-field-1"
                className="form-select"
                required
                value={newCourseName}
                onChange={(e) => { setNewCourseName(e.target.value); setAssignError(''); }}
              >
                {assignableCourses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}{c.status === 'Draft' ? ' (Draft)' : ''}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-500">This learner is already enrolled in every course in the catalog.</p>
            )}
          </div>
          <div>
            <label htmlFor="learnerProfile-field-2" className="form-label">Target Completion Date</label>
            <input id="learnerProfile-field-2" type="date" className="form-input" min={todayKey()} value={assignTarget} onChange={(e) => { setAssignTarget(e.target.value); setAssignError(''); }} />
          </div>
          <div>
            <label htmlFor="learnerProfile-field-3" className="form-label">Manager Notes</label>
            <textarea id="learnerProfile-field-3" rows={2} className="form-input" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="Mandatory for upcoming ISO recertification..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
