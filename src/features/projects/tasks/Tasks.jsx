import React, { useState, useMemo } from 'react';
import {
  CheckSquare, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  Clock, AlertTriangle, Filter, Search, Calendar, User, Briefcase,
  Layers, ArrowRight
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
import { initialTasks } from '../../../data/projectManagementData';
import { initialProjects } from '../../../data/projects';
import { formatDate, generateId } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';

export default function Tasks() {
  const [tasks, setTasks] = useLocalStorage('meridian-tasks', initialTasks);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(tasks, ['title', 'description', 'assignedTo', 'project']);

  // Filters
  const filteredTasks = useMemo(() => {
    return searchFiltered.filter(t => {
      const matchStatus = statusFilter === 'All' || t.status.toLowerCase() === statusFilter.toLowerCase();
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
    project: initialProjects[0]?.name || 'ISO 9001 Implementation',
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
      project: initialProjects[0]?.name || 'ISO 9001 Implementation',
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

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setTasks(prev => prev.filter(t => t.id !== deleteConfirm.id));
    addToast('Task removed.', 'success');
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    exportToCSV(
      tasks,
      'meridian_project_tasks',
      [
        { key: 'title', label: 'Task Title' },
        { key: 'project', label: 'Project' },
        { key: 'assignedTo', label: 'Assignee' },
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' },
        { key: 'progress', label: 'Progress (%)' },
        { key: 'loggedHours', label: 'Logged (hrs)' },
        { key: 'estimatedHours', label: 'Estimated (hrs)' },
        { key: 'dueDate', label: 'Due Date' },
      ]
    );
    addToast('Tasks exported to CSV!', 'info');
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
            <ExportButton onClick={handleExport} />
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
                ...initialProjects.map(p => ({ value: p.name, label: p.name }))
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

      {/* Tasks Table */}
      <div className="card mb-6 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
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
                  <tr key={task.id} className={isDone ? 'bg-gray-50/50 opacity-80' : ''}>
                    <td>
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-success border-success text-white'
                            : 'border-gray-300 hover:border-primary text-transparent'
                        }`}
                        title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                      >
                        <CheckCircle2 size={14} className={isDone ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    </td>
                    <td className="max-w-xs">
                      <p className={`font-semibold text-xs ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-2xs text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
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
                      <span className="text-xs text-gray-600 font-medium">
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 text-gray-500 hover:text-info rounded-lg hover:bg-gray-100"
                          title="Edit Task"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(task)}
                          className="p-1.5 text-gray-500 hover:text-danger rounded-lg hover:bg-gray-100"
                          title="Delete Task"
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
            <button className="btn-primary" onClick={handleSubmit}>
              {editTask ? 'Update Task' : 'Save Task'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Audit Clause 7.1.5 Measurement Traceability"
            />
          </div>

          <div>
            <label className="form-label">Task Description</label>
            <textarea
              rows={2}
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide actionable guidance and acceptance criteria..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Parent Project *</label>
              <select
                className="form-select"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              >
                {initialProjects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Assignee *</label>
              <input
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
              <label className="form-label">Priority</label>
              <select
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
              <label className="form-label">Status</label>
              <select
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
              <label className="form-label">Progress ({formData.progress}%)</label>
              <input
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
              <label className="form-label">Estimated (hrs)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Logged (hrs)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.loggedHours}
                onChange={(e) => setFormData({ ...formData, loggedHours: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

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
