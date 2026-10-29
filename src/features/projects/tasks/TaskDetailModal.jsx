import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, MessageSquare, ListChecks, Pencil, Calendar, User, Briefcase } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import ProgressBar from '../../../components/ui/ProgressBar';
import { useSettings } from '../../../lib/settings';
import { formatDate, formatRelative, generateId } from '../../../utils/format';

/** Subtask completion as a 0–100 integer, or null when the task has no subtasks. */
export function subtaskPercent(task) {
  const list = task?.subtasks || [];
  if (!list.length) return null;
  return Math.round((list.filter(s => s.done).length / list.length) * 100);
}

/**
 * Task detail view with a subtask checklist and comment thread. Both are
 * stored on the task record itself (`subtasks`, `comments`) and saved as soon
 * as they change, so the audit log records each edit.
 */
export default function TaskDetailModal({ task, onClose, onUpdate, onEdit }) {
  const [settings] = useSettings();
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!task) return null;
  const subtasks = task.subtasks || [];
  const comments = task.comments || [];
  const pct = subtaskPercent(task);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    const title = subtaskTitle.trim();
    if (!title) { setError('Enter a subtask title.'); return; }
    if (subtasks.some(s => s.title.toLowerCase() === title.toLowerCase())) { setError('That subtask already exists.'); return; }
    onUpdate({ subtasks: [...subtasks, { id: `sub-${generateId()}`, title, done: false, createdAt: new Date().toISOString() }] });
    setSubtaskTitle('');
    setError('');
  };

  const toggleSubtask = (id) => {
    onUpdate({
      subtasks: subtasks.map(s => (s.id === id
        ? { ...s, done: !s.done, completedAt: !s.done ? new Date().toISOString() : null }
        : s)),
    });
  };

  const removeSubtask = (id) => onUpdate({ subtasks: subtasks.filter(s => s.id !== id) });

  const handleAddComment = (e) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    onUpdate({
      comments: [...comments, { id: `cmt-${generateId()}`, author: settings.profile.name, body, createdAt: new Date().toISOString() }],
    });
    setComment('');
  };

  const removeComment = (id) => onUpdate({ comments: comments.filter(c => c.id !== id) });

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title={task.title}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onEdit}><Pencil size={14} /> Edit Task</button>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <StatusBadge status={task.priority} />
        </div>
        {task.description && <p className="text-sm text-gray-600">{task.description}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400" aria-hidden="true" /><span className="font-semibold text-gray-800">{task.project}</span></div>
          <div className="flex items-center gap-2"><User size={14} className="text-gray-400" aria-hidden="true" /><span className="font-semibold text-gray-800">{task.assignedTo}</span></div>
          <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" aria-hidden="true" /><span className="font-semibold text-gray-800">Due {formatDate(task.dueDate)}</span></div>
        </div>

        {/* Subtasks */}
        <section aria-labelledby="task-subtasks-heading">
          <div className="flex items-center justify-between mb-2">
            <h4 id="task-subtasks-heading" className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <ListChecks size={15} className="text-brand" aria-hidden="true" /> Subtasks
            </h4>
            <span className="text-xs text-gray-500">
              {subtasks.filter(s => s.done).length} / {subtasks.length} done
            </span>
          </div>
          {pct !== null && <div className="mb-3"><ProgressBar value={pct} size="sm" /></div>}
          {subtasks.length === 0 ? (
            <p className="text-xs text-gray-400 mb-3">No subtasks yet. Break this task into smaller steps below.</p>
          ) : (
            <ul className="space-y-1.5 mb-3">
              {subtasks.map(s => (
                <li key={s.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSubtask(s.id)}
                    className={s.done ? 'text-success' : 'text-gray-300 hover:text-brand'}
                    aria-pressed={s.done}
                    aria-label={s.done ? `Mark "${s.title}" not done` : `Mark "${s.title}" done`}
                  >
                    {s.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <span className={`flex-1 text-xs ${s.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{s.title}</span>
                  <button type="button" onClick={() => removeSubtask(s.id)} className="p-1 text-gray-400 hover:text-danger rounded" aria-label={`Remove subtask "${s.title}"`}>
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form id="task-subtask-form" onSubmit={handleAddSubtask} className="flex items-start gap-2">
            <div className="flex-1">
              <label htmlFor="task-subtask-title" className="sr-only">New subtask</label>
              <input
                id="task-subtask-title"
                type="text"
                className="form-input"
                value={subtaskTitle}
                onChange={(e) => { setSubtaskTitle(e.target.value); setError(''); }}
                placeholder="Add a subtask…"
                aria-invalid={!!error}
                aria-describedby={error ? 'task-subtask-error' : undefined}
              />
              {error && <p id="task-subtask-error" className="text-2xs text-danger mt-1">{error}</p>}
            </div>
            <button type="submit" form="task-subtask-form" className="btn-primary btn-sm shrink-0 mt-0.5"><Plus size={14} /> Add</button>
          </form>
        </section>

        {/* Comments */}
        <section aria-labelledby="task-comments-heading">
          <h4 id="task-comments-heading" className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
            <MessageSquare size={15} className="text-brand" aria-hidden="true" /> Comments ({comments.length})
          </h4>
          {comments.length === 0 ? (
            <p className="text-xs text-gray-400 mb-3">No comments yet.</p>
          ) : (
            <ol className="space-y-2 mb-3">
              {comments.map(c => (
                <li key={c.id} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">{c.author}</span>
                    <span className="flex items-center gap-1.5">
                      <time dateTime={c.createdAt} className="text-2xs text-gray-400" title={new Date(c.createdAt).toLocaleString()}>{formatRelative(c.createdAt)}</time>
                      <button type="button" onClick={() => removeComment(c.id)} className="p-0.5 text-gray-400 hover:text-danger rounded" aria-label={`Delete comment by ${c.author}`}>
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{c.body}</p>
                </li>
              ))}
            </ol>
          )}
          <form id="task-comment-form" onSubmit={handleAddComment} className="space-y-2">
            <label htmlFor="task-comment-body" className="form-label">Add a comment</label>
            <textarea
              id="task-comment-body"
              rows={2}
              className="form-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Commenting as ${settings.profile.name}`}
            />
            <div className="flex justify-end">
              <button type="submit" form="task-comment-form" className="btn-primary btn-sm" disabled={!comment.trim()}>Post Comment</button>
            </div>
          </form>
        </section>
      </div>
    </Modal>
  );
}
