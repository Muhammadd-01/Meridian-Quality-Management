import React, { useState, useMemo } from 'react';
import {
  CheckSquare, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  Clock, AlertTriangle, Filter, Search, Calendar, User, Briefcase,
  Layers, ArrowRight, ListChecks, MessageSquare
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import ProgressBar from '../../../components/ui/ProgressBar';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useQuickAction from '../../../hooks/useQuickAction';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import { initialTasks } from '../../../data/projectManagementData';
import useCollection from '../../../hooks/useCollection';
import { formatDate, generateId } from '../../../utils/format';
import { ENTITIES } from '../../../data/entities';
import TaskDetailModal from './TaskDetailModal';

// Flat-file exports add subtask/comment summaries; full detail is kept on the record.
const taskExportFields = [
  ...ENTITIES.tasks.fields,
  { key: 'subtasks', label: 'Subtasks', accessor: r => (r.subtasks || []).map(st => `${st.done ? '[x]' : '[ ]'} ${st.title}`).join('; ') },
  { key: 'commentCount', label: 'Comments', accessor: r => (r.comments || []).length },
];

export default function Tasks() {
  const [tasks, setTasks] = useLocalStorage('meridian-tasks', initialTasks);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkStatus, setBulkStatus] = useState('Completed');
  const [bulkConfirm, setBulkConfirm] = useState(null); // 'status' | 'delete'
  const [projects] = useCollection('projects');
  const addToast = useToast();

  const todayKey = new Date().toISOString().slice(0, 10);
  const isOverdue = (t) => t.status !== 'Completed' && t.dueDate && t.dueDate < todayKey;

  // Project options: live project records plus any project names already used on tasks.
  const projectOptions = useMemo(
    () => Array.from(new Set([...projects.map(p => p.name), ...tasks.map(t => t.project)].filter(Boolean))).sort(),
    [projects, tasks]
  );

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(tasks, ['title', 'description', 'assignedTo', 'project']);

  // Filters
  const filteredTasks = useMemo(() => {
    return searchFiltered.filter(t => {
      const matchStatus = statusFilter === 'All'
        || (statusFilter === 'Overdue' ? isOverdue(t) : t.status.toLowerCase() === statusFilter.toLowerCase());
      const matchPriority = priorityFilter === 'All' || t.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchProject = projectFilter === 'All' || t.project === projectFilter;
      return matchStatus && matchPriority && matchProject;
    });
  }, [searchFiltered, statusFilter, priorityFilter, projectFilter]);

  // Pagination
  const pagination = usePagination(filteredTasks, 8);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: projectOptions[0] || 'ISO 9001 Implementation',
    assignedTo: 'Ali Khan',
    priority: 'High',
    status: 'In Progress',
    startDate: '2026-10-15',
    dueDate: '2026-10-31',
    progress: 25,
    estimatedHours: 20,
    loggedHours: 5,
  });

  const handleOpenAdd = () => {
    setEditTask(null);
    setFormData({
      title: '',
      description: '',
      project: projectOptions[0] || 'ISO 9001 Implementation',
      assignedTo: 'Ali Khan',
      priority: 'High',
      status: 'In Progress',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '2026-10-31',
      progress: 0,
      estimatedHours: 16,
      loggedHours: 0,
    });
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (task) => {
    setEditTask(task);
    setFormData({ ...task });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const initials = formData.assignedTo.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    if (editTask) {
      setTasks(prev =>
        prev.map(t =>
          t.id === editTask.id
            ? {
                ...formData,
                assigneeAvatar: initials,
                progress: Number(formData.progress),
                estimatedHours: Number(formData.estimatedHours),
                loggedHours: Number(formData.loggedHours),
              }
            : t
        )
      );
      addToast('Task updated successfully!', 'success');
    } else {
      const newTask = {
        id: `task-${generateId()}`,
        ...formData,
        assigneeAvatar: initials,
        progress: Number(formData.progress),
        estimatedHours: Number(formData.estimatedHours),
        loggedHours: Number(formData.loggedHours),
      };
      setTasks(prev => [newTask, ...prev]);
      addToast('Task created successfully!', 'success');
    }
    setModalOpen(false);
  };

  const handleToggleComplete = (task) => {
    const isCompleted = task.status === 'Completed';
    const nextStatus = isCompleted ? 'In Progress' : 'Completed';
    const nextProgress = isCompleted ? 50 : 100;

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, status: nextStatus, progress: nextProgress }
          : t
      )
    );
    addToast(isCompleted ? 'Task marked in progress.' : 'Task completed! 🎉', 'success');
  };

  // Subtask / comment edits from the detail view are saved straight onto the task record.
  const detailTask = tasks.find(t => t.id === detailTaskId) || null;
  const handleDetailUpdate = (patch) => {
    setTasks(prev => prev.map(t => (t.id === detailTaskId ? { ...t, ...patch } : t)));
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setTasks(prev => prev.filter(t => t.id !== deleteConfirm.id));
    addToast('Task removed.', 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const criticalCount = tasks.filter(t => t.priority === 'Critical' || t.priority === 'High').length;

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Track discrete quality management deliverables, audit requirements, and technical validations."
        breadcrumbs={[
          { label: 'Project Management', href: '/projects' },
          { label: 'Tasks' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="tasks" records={tasks} setRecords={setTasks} filtered={filteredTasks} exportFields={taskExportFields} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Create Task
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Tasks"
          value={tasks.length}
          subtitle="All deliverables"
          icon={CheckSquare}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Currently active"
          icon={Clock}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          subtitle="Quality verified"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="High / Critical"
          value={criticalCount}
          subtitle="Priority focus"
          icon={AlertTriangle}
          iconColor="bg-danger/10 text-danger"
        />
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search tasks, assignees, projects..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={projectFilter}
              onChange={setProjectFilter}
              options={[
                { value: 'All', label: 'All Projects' },
                ...projectOptions.map(name => ({ value: name, label: name }))
              ]}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Review', label: 'Review' },
                { value: 'To Do', label: 'To Do' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Backlog', label: 'Backlog' },
                { value: 'Overdue', label: 'Overdue (any open status)' },
              ]}
            />
            <FilterDropdown
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: 'All', label: 'All Priorities' },
                { value: 'Critical', label: 'Critical' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="card px-4 py-3 mb-3 flex flex-wrap items-center gap-3 bg-primary-50 border-primary-100" role="region" aria-label="Bulk actions">
          <span className="text-sm font-semibold text-primary">{selectedIds.size} selected</span>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            Set status
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="form-select !py-1.5 text-xs !w-auto">
              {['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'].map(st => <option key={st}>{st}</option>)}
            </select>
          </label>
          <button type="button" className="btn-primary btn-sm" onClick={() => setBulkConfirm('status')}>Apply</button>
          <button type="button" className="btn-outline btn-sm text-danger" onClick={() => setBulkConfirm('delete')}><Trash2 size={13} aria-hidden="true" /> Delete</button>
          <button type="button" className="text-xs text-gray-500 hover:underline ml-auto" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
        </div>
      )}

      {/* Tasks Table */}
      <div className="card mb-6 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all tasks on this page"
                    className="accent-[#187f65]"
                    checked={pagination.paginatedData.length > 0 && pagination.paginatedData.every(t => selectedIds.has(t.id))}
                    onChange={(e) => setSelectedIds(prev => {
                      const next = new Set(prev);
                      pagination.paginatedData.forEach(t => (e.target.checked ? next.add(t.id) : next.delete(t.id)));
                      return next;
                    })}
                  />
                </th>
                <th className="w-10">Done</th>
                <th>Task Title & Scope</th>
                <th>Parent Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Logged Hours</th>
                <th>Due Date</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedData.map(task => {
                const isDone = task.status === 'Completed';

                return (
                  <tr key={task.id} className={`${isDone ? 'bg-gray-50/50 opacity-80' : ''} ${selectedIds.has(task.id) ? 'is-selected' : ''}`}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${task.title}`}
                        className="accent-[#187f65]"
                        checked={selectedIds.has(task.id)}
                        onChange={() => setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
                          return next;
                        })}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-success border-success text-white'
                            : 'border-gray-300 hover:border-primary text-transparent'
                        }`}
                        title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                        aria-label={isDone ? `Mark ${task.title} incomplete` : `Mark ${task.title} completed`}
                        aria-pressed={isDone}
                      >
                        <CheckCircle2 size={14} className={isDone ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    </td>
                    <td className="max-w-xs">
                      <p className={`font-semibold text-xs ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-2xs text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
                      {((task.subtasks || []).length > 0 || (task.comments || []).length > 0) && (
                        <p className="flex items-center gap-2.5 mt-1 text-2xs text-gray-400">
                          {(task.subtasks || []).length > 0 && (
                            <span className="inline-flex items-center gap-0.5" title="Subtasks done">
                              <ListChecks size={11} aria-hidden="true" /> {task.subtasks.filter(st => st.done).length}/{task.subtasks.length}
                            </span>
                          )}
                          {(task.comments || []).length > 0 && (
                            <span className="inline-flex items-center gap-0.5" title="Comments">
                              <MessageSquare size={11} aria-hidden="true" /> {task.comments.length}
                            </span>
                          )}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="badge-secondary text-2xs truncate block max-w-[140px]">
                        {task.project}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-2xs flex items-center justify-center">
                          {task.assigneeAvatar || 'AK'}
                        </div>
                        <span className="text-xs text-gray-700 font-medium">{task.assignedTo}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={task.priority} /></td>
                    <td className="w-32">
                      <ProgressBar value={task.progress} size="sm" />
                    </td>
                    <td>
                      <span className="text-xs text-gray-700 font-medium">
                        {task.loggedHours || 0} / {task.estimatedHours || 0} hrs
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs font-medium ${isOverdue(task) ? 'text-danger' : 'text-gray-600'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                      {isOverdue(task) && (
                        <span className="badge-danger text-2xs ml-1.5 inline-flex items-center gap-0.5">
                          <AlertTriangle size={10} aria-hidden="true" /> Overdue
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailTaskId(task.id)}
                          className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                          title="View details, subtasks & comments"
                          aria-label={`View ${task.title}`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 text-gray-500 hover:text-info rounded-lg hover:bg-gray-100"
                          title="Edit Task"
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(task)}
                          className="p-1.5 text-gray-500 hover:text-danger rounded-lg hover:bg-gray-100"
                          title="Delete Task"
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.goToPage}
        totalItems={pagination.totalItems}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        pageSize={pagination.pageSize}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* Bulk action confirmation */}
      <ConfirmDialog
        isOpen={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => {
          const count = selectedIds.size;
          if (bulkConfirm === 'delete') {
            setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
            addToast(`${count} task(s) deleted.`, 'success');
          } else {
            setTasks(prev => prev.map(t => (selectedIds.has(t.id)
              ? { ...t, status: bulkStatus, progress: bulkStatus === 'Completed' ? 100 : t.progress }
              : t)));
            addToast(`${count} task(s) set to ${bulkStatus}.`, 'success');
          }
          setSelectedIds(new Set());
          setBulkConfirm(null);
        }}
        title={bulkConfirm === 'delete' ? 'Delete selected tasks' : 'Update task status'}
        message={bulkConfirm === 'delete'
          ? `Permanently delete ${selectedIds.size} selected task(s)? This cannot be undone.`
          : `Set ${selectedIds.size} selected task(s) to “${bulkStatus}”?`}
        confirmLabel={bulkConfirm === 'delete' ? 'Delete' : 'Update'}
        variant={bulkConfirm === 'delete' ? 'danger' : 'primary'}
      />

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTask ? 'Edit Task' : 'Create New Quality Task'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="tasks-submit-form" className="btn-primary">
              {editTask ? 'Update Task' : 'Save Task'}
            </button>
          </>
        }
      >
        <form id="tasks-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tasks-field-1" className="form-label">Task Title *</label>
            <input id="tasks-field-1"
              type="text"
              required
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Audit Clause 7.1.5 Measurement Traceability"
            />
          </div>

          <div>
            <label htmlFor="tasks-field-2" className="form-label">Task Description</label>
            <textarea id="tasks-field-2"
              rows={2}
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide actionable guidance and acceptance criteria..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tasks-field-3" className="form-label">Parent Project *</label>
              <select id="tasks-field-3"
                className="form-select"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              >
                {projectOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tasks-field-4" className="form-label">Assignee *</label>
              <input id="tasks-field-4"
                type="text"
                required
                className="form-input"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="e.g. Ali Khan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="tasks-field-5" className="form-label">Priority</label>
              <select id="tasks-field-5"
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="tasks-field-6" className="form-label">Status</label>
              <select id="tasks-field-6"
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="Backlog">Backlog</option>
              </select>
            </div>
            <div>
              <label htmlFor="tasks-field-7" className="form-label">Progress ({formData.progress}%)</label>
              <input id="tasks-field-7"
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="tasks-field-8" className="form-label">Estimated (hrs)</label>
              <input id="tasks-field-8"
                type="number"
                min="0"
                className="form-input"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="tasks-field-9" className="form-label">Logged (hrs)</label>
              <input id="tasks-field-9"
                type="number"
                min="0"
                className="form-input"
                value={formData.loggedHours}
                onChange={(e) => setFormData({ ...formData, loggedHours: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="tasks-field-10" className="form-label">Start Date</label>
              <input id="tasks-field-10"
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="tasks-field-11" className="form-label">Due Date</label>
              <input id="tasks-field-11"
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Task detail: subtasks & comments */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTaskId(null)}
          onUpdate={handleDetailUpdate}
          onEdit={() => { setDetailTaskId(null); handleOpenEdit(detailTask); }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to remove "${deleteConfirm?.title}"?`}
      />
    </div>
  );
}
