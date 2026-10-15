import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Pencil, Trash2, Eye, Download, Briefcase,
  CheckCircle, Clock, AlertTriangle, Filter
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import AvatarGroup from '../../components/ui/AvatarGroup';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/tables/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialProjects } from '../../data/projects';
import { formatCurrency, formatDate, generateId } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';

const projectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  manager: z.string().min(2, 'Manager name is required'),
  category: z.string().min(2, 'Category is required'),
  startDate: z.string().min(1, 'Start date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.coerce.number().min(0, 'Budget must be positive'),
  progress: z.coerce.number().min(0).max(100, 'Progress must be 0-100'),
});

const statuses = ['All', 'Active', 'In Progress', 'Completed', 'Pending', 'Overdue'];
const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

export default function Projects() {
  const [projects, setProjects] = useLocalStorage('meridian-projects', initialProjects);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const addToast = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
  });

  // Filter by status and priority
  const filteredByStatus = useMemo(() => {
    let data = projects;
    if (statusFilter !== 'All') data = data.filter(p => p.status === statusFilter);
    if (priorityFilter !== 'All') data = data.filter(p => p.priority === priorityFilter);
    return data;
  }, [projects, statusFilter, priorityFilter]);

  const { query, setQuery, filtered } = useSearch(filteredByStatus, ['name', 'manager', 'category']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'name');
  const pagination = usePagination(sorted, 8);

  // KPI calculations
  const totalProjects = projects.length;
  const activeCount = projects.filter(p => ['Active', 'In Progress'].includes(p.status)).length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const overdueCount = projects.filter(p => p.status === 'Overdue').length;

  const openCreate = () => {
    setEditingProject(null);
    reset({ name: '', description: '', status: 'Pending', priority: 'Medium', manager: '', category: '', startDate: '', dueDate: '', budget: 0, progress: 0 });
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    Object.keys(project).forEach(k => {
      if (['name', 'description', 'status', 'priority', 'manager', 'category', 'startDate', 'dueDate', 'budget', 'progress'].includes(k)) {
        setValue(k, project[k]);
      }
    });
    setModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...data, spent: p.spent } : p));
      addToast('Project updated successfully', 'success');
    } else {
      const newProject = {
        ...data,
        id: generateId(),
        team: [],
        spent: 0,
      };
      setProjects(prev => [newProject, ...prev]);
      addToast('Project created successfully', 'success');
    }
    setModalOpen(false);
    reset();
  };

  const handleDelete = () => {
    setProjects(prev => prev.filter(p => p.id !== deleteDialog.id));
    addToast('Project deleted successfully', 'success');
    setDeleteDialog(null);
  };

  const handleExport = () => {
    exportToCSV(sorted, 'projects', [
      { key: 'name', label: 'Project Name' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'manager', label: 'Manager' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'budget', label: 'Budget (PKR)' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'dueDate', label: 'Due Date' },
    ]);
    addToast('CSV exported successfully', 'info');
  };

  const columns = [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.name}</p>
          <p className="text-xs text-gray-400">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'manager',
      label: 'Manager',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-600">{row.manager}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (row) => <StatusBadge status={row.priority} />,
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (row) => <ProgressBar value={row.progress} size="sm" className="w-28" />,
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-700">{formatCurrency(row.budget)}</p>
          <p className="text-xs text-gray-400">Spent: {formatCurrency(row.spent)}</p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-600">{formatDate(row.dueDate)}</span>,
    },
    {
      key: 'team',
      label: 'Team',
      render: (row) => <AvatarGroup names={row.team || []} max={3} size="xs" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Project Management"
        subtitle="Manage and track all quality management projects"
        breadcrumbs={[{ label: 'Projects' }]}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Project
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Projects" value={totalProjects} icon={Briefcase} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Active Projects" value={activeCount} icon={Clock} iconColor="bg-info/10 text-info" />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle} iconColor="bg-success/10 text-success" />
        <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} iconColor="bg-danger/10 text-danger" />
      </div>

      {/* Filters */}
      <div className="card card-body mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search projects..." className="flex-1" />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={statuses.map(s => ({ value: s, label: s }))}
          />
          <FilterDropdown
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorities.map(p => ({ value: p, label: p }))}
          />
          <ExportButton onClick={handleExport} />
        </div>
      </div>

      {/* Table */}
      <div className="card card-body">
        <DataTable
          columns={columns}
          data={pagination.paginatedData}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          pagination={pagination}
          emptyTitle="No projects found"
          emptyDescription="Try adjusting your search or filters, or create a new project."
          actions={(row) => (
            <div className="flex items-center gap-1">
              <button onClick={() => setViewModal(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-info hover:bg-info/10" title="View">
                <Eye size={15} />
              </button>
              <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10" title="Edit">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteDialog(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10" title="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)}>
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Project Name</label>
              <input {...register('name')} className="form-input" placeholder="Enter project name" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Category</label>
              <input {...register('category')} className="form-input" placeholder="e.g., Quality Assurance" />
              {errors.category && <p className="form-error">{errors.category.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...register('description')} className="form-input" rows={3} placeholder="Project description" />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-select">
                {statuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select {...register('priority')} className="form-select">
                {priorities.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Manager</label>
              <input {...register('manager')} className="form-input" placeholder="Project manager" />
              {errors.manager && <p className="form-error">{errors.manager.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input {...register('startDate')} type="date" className="form-input" />
              {errors.startDate && <p className="form-error">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input {...register('dueDate')} type="date" className="form-input" />
              {errors.dueDate && <p className="form-error">{errors.dueDate.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Budget (PKR)</label>
              <input {...register('budget')} type="number" className="form-input" placeholder="0" />
              {errors.budget && <p className="form-error">{errors.budget.message}</p>}
            </div>
            <div>
              <label className="form-label">Progress (%)</label>
              <input {...register('progress')} type="number" min="0" max="100" className="form-input" placeholder="0" />
              {errors.progress && <p className="form-error">{errors.progress.message}</p>}
            </div>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        title="Project Details"
        size="lg"
      >
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{viewModal.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{viewModal.description}</p>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400">Manager</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.manager}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Priority</p>
                <StatusBadge status={viewModal.priority} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Start Date</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(viewModal.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Due Date</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(viewModal.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Budget</p>
                <p className="text-sm font-medium text-gray-700">{formatCurrency(viewModal.budget)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Progress</p>
              <ProgressBar value={viewModal.progress} size="lg" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Team Members</p>
              <AvatarGroup names={viewModal.team || []} max={6} size="md" />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
