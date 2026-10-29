import React, { useState } from 'react';
import { Flag, CheckCircle2, Circle, Trash2, Plus, AlertTriangle } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import { formatDate, generateId } from '../../utils/format';

/** Completed milestones as a 0–100 integer, or null when none are defined. */
export function milestonePercent(project) {
  const list = project?.milestones || [];
  if (!list.length) return null;
  return Math.round((list.filter(m => m.completed).length / list.length) * 100);
}

/**
 * Milestone list for one project. Milestones are stored on the project record
 * (`milestones: [{ id, title, dueDate, completed, completedAt }]`); every
 * change is passed to `onChange` and saved immediately.
 */
export default function ProjectMilestones({ project, onChange }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const milestones = [...(project.milestones || [])].sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
  const pct = milestonePercent(project);
  const today = new Date().toISOString().slice(0, 10);

  const handleAdd = (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) { setError('Enter a milestone title.'); return; }
    if (project.dueDate && dueDate && dueDate > project.dueDate) {
      setError(`Due date is after the project due date (${formatDate(project.dueDate)}).`);
      return;
    }
    onChange([...(project.milestones || []), { id: `ms-${generateId()}`, title: t, dueDate, completed: false, completedAt: null }]);
    setTitle('');
    setDueDate('');
    setError('');
  };

  const toggle = (id) => onChange((project.milestones || []).map(m => (m.id === id
    ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null }
    : m)));

  const remove = (id) => onChange((project.milestones || []).filter(m => m.id !== id));

  return (
    <section className="p-3.5 rounded-xl border border-gray-200 bg-white" aria-labelledby="project-milestones-heading">
      <div className="flex items-center justify-between mb-2">
        <h4 id="project-milestones-heading" className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
          <Flag size={13} className="text-brand" aria-hidden="true" /> Milestones
        </h4>
        <span className="text-2xs font-semibold text-secondary-600">
          {pct === null ? 'None yet' : `${milestones.filter(m => m.completed).length} / ${milestones.length} complete · ${pct}%`}
        </span>
      </div>
      {pct !== null && <div className="mb-3"><ProgressBar value={pct} size="sm" /></div>}

      {milestones.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {milestones.map(m => {
            const overdue = !m.completed && m.dueDate && m.dueDate < today;
            return (
              <li key={m.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={m.completed ? 'text-success' : 'text-gray-300 hover:text-brand'}
                  aria-pressed={m.completed}
                  aria-label={m.completed ? `Reopen milestone "${m.title}"` : `Complete milestone "${m.title}"`}
                >
                  {m.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <span className={`flex-1 min-w-0 truncate ${m.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>{m.title}</span>
                <span className={`text-2xs shrink-0 ${overdue ? 'text-danger font-semibold' : 'text-secondary-500'}`}>
                  {overdue && <AlertTriangle size={10} className="inline mr-0.5" aria-hidden="true" />}
                  {m.completed && m.completedAt ? `Done ${formatDate(m.completedAt)}` : m.dueDate ? formatDate(m.dueDate) : 'No date'}
                </span>
                <button type="button" onClick={() => remove(m.id)} className="p-1 text-gray-400 hover:text-danger rounded" aria-label={`Remove milestone "${m.title}"`}>
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form id="project-milestone-form" onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-2 items-end">
        <div>
          <label htmlFor="project-milestone-title" className="form-label">New milestone</label>
          <input
            id="project-milestone-title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            placeholder="e.g. Stage 1 audit complete"
            aria-invalid={!!error}
            aria-describedby={error ? 'project-milestone-error' : undefined}
          />
        </div>
        <div>
          <label htmlFor="project-milestone-due" className="form-label">Due date</label>
          <input id="project-milestone-due" type="date" className="form-input" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setError(''); }} />
        </div>
        <button type="submit" form="project-milestone-form" className="btn btn-primary text-xs"><Plus size={13} /> Add</button>
      </form>
      {error && <p id="project-milestone-error" className="form-error mt-1">{error}</p>}
    </section>
  );
}
