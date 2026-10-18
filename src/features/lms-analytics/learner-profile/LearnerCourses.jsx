import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Award, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ProgressBar from '../../../components/ui/ProgressBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatDate } from '../../../utils/format';

export const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Per-course enrollments for a learner. Records created before enrollments
 * were tracked only have `currentCourse` / `currentCourseProgress`, so that
 * course is shown as the single known enrollment (source "Profile").
 */
export function enrollmentsFor(learner) {
  if (!learner) return [];
  if (Array.isArray(learner.enrollments)) return learner.enrollments;
  if (!learner.currentCourse) return [];
  const progress = Number(learner.currentCourseProgress) || 0;
  return [{
    id: `enr-${learner.id}-current`,
    course: learner.currentCourse,
    progress,
    status: progress >= 100 ? 'Completed' : 'In Progress',
    enrolledAt: '',
    targetDate: '',
    completedAt: null,
    source: 'Profile',
  }];
}

const SourceBadge = () => (
  <span className="badge-warning text-2xs" title="Taken from the learner's current-course fields (demo record); enrollment date not recorded">From profile</span>
);

export function EnrolledCourses({ learner, onProgress, onComplete }) {
  const enrollments = enrollmentsFor(learner);
  const active = enrollments.filter(e => e.status !== 'Completed');
  const [drafts, setDrafts] = useState({});

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <BookOpen size={15} className="text-primary" aria-hidden="true" /> Enrolled Courses
        </h3>
        <span className="text-2xs text-gray-500">{active.length} in progress · {enrollments.length - active.length} completed</span>
      </div>
      <div className="card-body">
        {active.length === 0 ? (
          <p className="text-xs text-gray-400">No courses in progress. Use “Assign Course” to enroll this learner.</p>
        ) : (
          <ul className="space-y-3">
            {active.map(e => {
              const inputId = `learner-progress-${e.id}`;
              const draft = drafts[e.id] ?? e.progress;
              const overdue = e.targetDate && e.targetDate < todayKey();
              return (
                <li key={e.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.course}</p>
                      <p className="text-2xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        {e.enrolledAt && <span>Enrolled {formatDate(e.enrolledAt)}</span>}
                        {e.targetDate && <span className={overdue ? 'text-danger font-semibold' : ''}>Target {formatDate(e.targetDate)}{overdue ? ' (overdue)' : ''}</span>}
                        {e.source === 'Profile' && <SourceBadge />}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary">{e.progress}%</span>
                  </div>
                  <ProgressBar value={e.progress} size="sm" showLabel={false} />
                  <form
                    id={`learner-progress-form-${e.id}`}
                    className="flex flex-wrap items-end gap-2 mt-3"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      const value = Math.max(0, Math.min(100, Math.round(Number(draft) || 0)));
                      onProgress(e, value);
                      setDrafts(d => { const n = { ...d }; delete n[e.id]; return n; });
                    }}
                  >
                    <div>
                      <label htmlFor={inputId} className="form-label">Progress (%)</label>
                      <input
                        id={inputId}
                        type="number"
                        min="0"
                        max="100"
                        className="form-input !w-24"
                        value={draft}
                        onChange={(ev) => setDrafts(d => ({ ...d, [e.id]: ev.target.value }))}
                      />
                    </div>
                    <button type="submit" form={`learner-progress-form-${e.id}`} className="btn-outline btn-sm">Update</button>
                    <button type="button" className="btn-primary btn-sm" onClick={() => onComplete(e)}>
                      <CheckCircle2 size={13} aria-hidden="true" /> Mark Complete
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CompletionHistory({ learner }) {
  const enrollments = enrollmentsFor(learner);
  const completed = enrollments
    .filter(e => e.status === 'Completed')
    .map(e => ({ id: e.id, title: e.course, when: e.completedAt ? formatDate(e.completedAt) : 'Date not recorded', sortKey: e.completedAt || '', kind: 'Course completed', icon: CheckCircle2 }));
  const logged = (learner.recentActivities || [])
    // Course completions already appear from enrollments; keep module completions and badges.
    .filter(a => /^(completed|earned)/i.test(a.action || '') && !/^completed course:/i.test(a.action))
    .map((a, i) => ({ id: `act-${i}`, title: a.action, when: a.date, sortKey: '', kind: 'Activity log', icon: /^earned/i.test(a.action) ? Award : CheckCircle2 }));
  const items = [...completed.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey))), ...logged];
  const untracked = Math.max(0, (Number(learner.completedCount) || 0) - completed.length);

  return (
    <div className="card p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Completion History</h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">No completions recorded yet.</p>
      ) : (
        <ol className="relative border-l border-gray-100 ml-1.5 space-y-4">
          {items.map(item => (
            <li key={item.id} className="pl-4 relative">
              <span className="absolute -left-[7px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary" aria-hidden="true" />
              <p className="text-xs font-medium text-gray-800 leading-snug">{item.title}</p>
              <p className="text-2xs text-gray-400 mt-0.5">{item.kind} · {item.when}</p>
            </li>
          ))}
        </ol>
      )}
      {untracked > 0 && (
        <p className="text-2xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
          {untracked} earlier course completion{untracked === 1 ? '' : 's'} recorded as a count only — this record has no course names or dates for them.
        </p>
      )}
    </div>
  );
}

export function QuizTimeline({ learner }) {
  const chronological = [...(learner.quizHistory || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const entries = chronological.map((q, i) => ({ ...q, delta: i > 0 ? Number(q.score) - Number(chronological[i - 1].score) : null })).reverse();
  const scores = chronological.map(q => Number(q.score) || 0);
  const best = scores.length ? Math.max(...scores) : null;
  const passed = chronological.filter(q => q.status === 'Passed').length;

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-800">Quiz Results Timeline</h3>
        {scores.length > 0 && (
          <span className="text-2xs text-gray-500">{passed}/{scores.length} passed · best {best}%</span>
        )}
      </div>
      <div className="card-body">
        {entries.length === 0 ? (
          <p className="text-xs text-gray-400">No quiz attempts recorded for this learner.</p>
        ) : (
          <ol className="relative border-l border-gray-100 ml-1.5 space-y-5">
            {entries.map((q, idx) => {
              const pass = q.status === 'Passed';
              const DeltaIcon = q.delta === null ? null : q.delta > 0 ? TrendingUp : q.delta < 0 ? TrendingDown : Minus;
              return (
                <li key={`${q.quizTitle}-${q.date}-${idx}`} className="pl-4 relative">
                  <span className={`absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${pass ? 'bg-success' : 'bg-danger'}`} aria-hidden="true" />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{formatDate(q.date)}</p>
                      <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                        <FileText size={13} className="text-primary shrink-0" aria-hidden="true" /> {q.quizTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${Number(q.score) >= 80 ? 'text-success' : 'text-warning'}`}>{q.score}%</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                  <div className="mt-1.5 max-w-xs"><ProgressBar value={Number(q.score) || 0} size="sm" showLabel={false} /></div>
                  {DeltaIcon && (
                    <p className={`text-2xs mt-1 flex items-center gap-1 ${q.delta > 0 ? 'text-success' : q.delta < 0 ? 'text-danger' : 'text-gray-400'}`}>
                      <DeltaIcon size={11} aria-hidden="true" />
                      {q.delta === 0 ? 'Same as previous quiz' : `${q.delta > 0 ? '+' : ''}${q.delta} pts vs previous quiz`}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
