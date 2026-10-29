import React, { useState, useMemo, useRef } from 'react';
import PageHeroIcon from '../../components/ui/PageHeroIcon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Download,
  Upload,
  Eye,
  Pencil,
  Trash2,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  X,
  FileCheck,
  FileText,
  FileSpreadsheet,
  Check,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  GanttChartSquare,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useQuickAction from '../../hooks/useQuickAction';
import { useSearchParams } from 'react-router-dom';
import { initialProjects } from '../../data/projects';
import { formatCurrency, formatDate, generateId } from '../../utils/format';
import ProjectMilestones, { milestonePercent } from './ProjectMilestones';
import {
  exportProjectsToCSV,
  exportProjectsToExcel,
  exportProjectsToJSON,
  exportProjectsToPDF,
  downloadImportTemplate,
  parseImportFile
} from '../../utils/projectExportImport';

// Form validation schema
const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  company: z.string().min(2, 'Client or Company name is required'),
  priority: z.enum(['High', 'Medium', 'Low']),
  status: z.enum(['In Progress', 'Delayed', 'On Track', 'Completed']),
  lead: z.string().min(2, 'Project lead name is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.coerce.number().min(0, 'Total budget must be a positive number'),
  spent: z.coerce.number().min(0, 'Budget spent must be a positive number').default(0),
  totalTasks: z.coerce.number().min(1, 'Total tasks must be at least 1').default(10),
  completedTasks: z.coerce.number().min(0, 'Completed tasks cannot be negative').default(0),
  category: z.string().optional(),
  description: z.string().optional(),
}).refine(data => data.completedTasks <= data.totalTasks, {
  message: 'Completed tasks cannot exceed total tasks',
  path: ['completedTasks'],
});

const statuses = ['All', 'In Progress', 'Delayed', 'On Track', 'Completed'];
const priorities = ['All', 'High', 'Medium', 'Low'];

export default function Projects() {
  // Persistence via localStorage with seed fallback
  const [projects, setProjects] = useLocalStorage('meridian-projects-v2', initialProjects);

  // Filter & Search states
  const [urlParams] = useSearchParams();
  // Global search links open this page with ?q=<project name>
  const [searchQuery, setSearchQuery] = useState(() => urlParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [leadFilter, setLeadFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // View mode: 'grid' (reference cards) or 'table'
  const [viewMode, setViewMode] = useState('grid');

  // Row selection for bulk actions & selective export
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal dialog states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Export options
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' | 'xlsx' | 'pdf' | 'json'
  const [exportScope, setExportScope] = useState('all'); // 'all' | 'filtered' | 'selected'

  // Import options & progress
  const [importFile, setImportFile] = useState(null);
  const [importDragActive, setImportDragActive] = useState(false);
  const [importSkipDuplicates, setImportSkipDuplicates] = useState(true);
  const [importUpdateExisting, setImportUpdateExisting] = useState(false);
  const [importNotify, setImportNotify] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const addToast = useToast();

  // Form management
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      company: '',
      priority: 'Medium',
      status: 'In Progress',
      lead: '',
      dueDate: '',
      budget: 100000,
      spent: 0,
      totalTasks: 20,
      completedTasks: 0,
      category: 'General',
      description: '',
    },
  });

  // Extract unique leads for filter dropdown
  const uniqueLeads = useMemo(() => {
    const set = new Set();
    projects.forEach(p => {
      const l = p.lead || p.manager;
      if (l) set.add(l);
    });
    return Array.from(set).sort();
  }, [projects]);

  // Dynamic summary statistics calculated from active data
  const summaryStats = useMemo(() => {
    const activeCount = projects.filter(p => p.status !== 'Completed').length;
    const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
    const completedCount = projects.filter(p => p.status === 'Completed').length;

    const formattedBudget =
      totalBudget >= 1000000
        ? `$${(totalBudget / 1000000).toFixed(1)}M`
        : `$${Math.round(totalBudget / 1000)}K`;

    return {
      activeCount,
      totalBudget,
      totalSpent,
      completedCount,
      formattedBudget,
    };
  }, [projects]);

  // Filtered & sorted projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.company && p.company.toLowerCase().includes(q)) ||
        (p.client && p.client.toLowerCase().includes(q)) ||
        (p.lead && p.lead.toLowerCase().includes(q)) ||
        (p.manager && p.manager.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'All') {
      result = result.filter(p => p.priority === priorityFilter);
    }

    // Lead filter
    if (leadFilter !== 'All') {
      result = result.filter(p => (p.lead || p.manager) === leadFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'progress') {
        aVal = a.totalTasks > 0 ? (a.completedTasks / a.totalTasks) : 0;
        bVal = b.totalTasks > 0 ? (b.completedTasks / b.totalTasks) : 0;
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [projects, searchQuery, statusFilter, priorityFilter, leadFilter, sortField, sortDir]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    reset({
      name: '',
      company: '',
      priority: 'Medium',
      status: 'In Progress',
      lead: '',
      dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      budget: 120000,
      spent: 40000,
      totalTasks: 24,
      completedTasks: 8,
      category: 'Implementation',
      description: '',
    });
    setCreateModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenCreate);

  // Open Edit Modal
  const handleOpenEdit = (project) => {
    setEditingProject(project);
    reset({
      name: project.name || '',
      company: project.company || project.client || '',
      priority: project.priority || 'Medium',
      status: project.status || 'In Progress',
      lead: project.lead || project.manager || '',
      dueDate: project.dueDate || '',
      budget: project.budget || 0,
      spent: project.spent || 0,
      totalTasks: project.totalTasks || 10,
      completedTasks: project.completedTasks || 0,
      category: project.category || 'General',
      description: project.description || '',
    });
    setCreateModalOpen(true);
  };

  // Save Project (Create or Edit)
  const onSubmitProject = (data) => {
    const progress = data.totalTasks > 0
      ? Math.min(100, Math.round((data.completedTasks / data.totalTasks) * 100))
      : 0;

    if (editingProject) {
      // Edit existing
      setProjects(prev =>
        prev.map(p =>
          p.id === editingProject.id
            ? {
                ...p,
                ...data,
                client: data.company,
                manager: data.lead,
                progress,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
      addToast(`Project "${data.name}" updated successfully.`, 'success');
    } else {
      // Create new
      const newProj = {
        id: `proj-${Date.now()}`,
        ...data,
        client: data.company,
        manager: data.lead,
        progress,
        team: [data.lead],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects(prev => [newProj, ...prev]);
      addToast(`Project "${data.name}" created successfully.`, 'success');
    }

    setCreateModalOpen(false);
    setEditingProject(null);
  };

  // Milestones are edited from the detail view and saved straight onto the project record.
  const handleMilestonesChange = (milestones) => {
    const id = viewProject?.id;
    if (!id) return;
    const updatedAt = new Date().toISOString();
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, milestones, updatedAt } : p)));
    setViewProject(prev => (prev && prev.id === id ? { ...prev, milestones, updatedAt } : prev));
  };

  // Delete project
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    setProjects(prev => prev.filter(p => p.id !== deleteConfirm.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(deleteConfirm.id);
      return next;
    });
    addToast(`Project "${deleteConfirm.name}" deleted.`, 'info');
    setDeleteConfirm(null);
  };

  // Handle Export Execution
  const handleExecuteExport = () => {
    let dataset = [];
    if (exportScope === 'selected') {
      if (selectedIds.size === 0) {
        addToast('No projects selected. Please select at least one row.', 'error');
        return;
      }
      dataset = projects.filter(p => selectedIds.has(p.id));
    } else if (exportScope === 'filtered') {
      dataset = filteredProjects;
    } else {
      dataset = projects;
    }

    if (dataset.length === 0) {
      addToast('No project records to export.', 'error');
      return;
    }

    let success = false;
    const filename = `meridian-projects-${new Date().toISOString().split('T')[0]}`;

    if (exportFormat === 'csv') {
      success = exportProjectsToCSV(dataset, filename);
    } else if (exportFormat === 'xlsx') {
      success = exportProjectsToExcel(dataset, filename);
    } else if (exportFormat === 'json') {
      success = exportProjectsToJSON(dataset, filename);
    } else if (exportFormat === 'pdf') {
      success = exportProjectsToPDF(dataset, filename);
    }

    if (success) {
      addToast(`Successfully exported ${dataset.length} projects to ${exportFormat.toUpperCase()}.`, 'success');
      setExportModalOpen(false);
    }
  };

  // Handle Import Execution
  const handleStartImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      const { validRows, errors, total } = await parseImportFile(importFile);

      if (validRows.length === 0 && errors.length > 0) {
        setImportResult({
          imported: 0,
          updated: 0,
          skipped: 0,
          failed: errors.length,
          errors,
        });
        setImportLoading(false);
        return;
      }

      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      setProjects(prev => {
        const nextList = [...prev];
        const existingKeyMap = new Map();

        nextList.forEach((p, idx) => {
          const key = `${(p.name || '').toLowerCase().trim()}|${(p.company || p.client || '').toLowerCase().trim()}`;
          existingKeyMap.set(key, idx);
        });

        validRows.forEach(row => {
          const key = `${row.name.toLowerCase()}|${row.company.toLowerCase()}`;
          const existingIdx = existingKeyMap.get(key);

          if (existingIdx !== undefined) {
            if (importUpdateExisting) {
              nextList[existingIdx] = {
                ...nextList[existingIdx],
                ...row,
                id: nextList[existingIdx].id,
                updatedAt: new Date().toISOString(),
              };
              updatedCount++;
            } else if (importSkipDuplicates) {
              skippedCount++;
            } else {
              nextList.push(row);
              importedCount++;
            }
          } else {
            nextList.push(row);
            importedCount++;
          }
        });

        return nextList;
      });

      setImportResult({
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: errors.length,
        errors,
        total,
      });

      if (importNotify) {
        addToast(
          `Import complete: ${importedCount} added, ${updatedCount} updated, ${skippedCount} skipped.`,
          'success'
        );
      }
    } catch (err) {
      addToast(`Import failed: ${err.message}`, 'error');
      setImportResult({
        imported: 0,
        updated: 0,
        skipped: 0,
        failed: 1,
        errors: [{ row: 0, error: err.message }],
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setLeadFilter('All');
    setSortField('name');
    setSortDir('asc');
  };

  // Priority color styling
  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-danger-50 text-danger-600 border border-danger-200';
      case 'medium':
        return 'bg-warning-50 text-warning-600 border border-warning-200';
      case 'low':
      default:
        return 'bg-success-50 text-success-700 border border-success-200';
    }
  };

  // Status color styling matching reference DreamsCore
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return 'bg-info-50 text-info-700 border border-info-200';
      case 'delayed':
        return 'bg-danger-50 text-danger-700 border border-danger-200';
      case 'on track':
      case 'completed':
        return 'bg-success-50 text-success-700 border border-success-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* 1. Breadcrumbs & Header Bar matching DreamsCore projects.html             */}
      {/* ========================================================================= */}
      <div className="page-hero is-brand mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-no-reveal>
        <PageHeroIcon icon={GanttChartSquare} />
        <span className="hero-rings hidden md:block" aria-hidden="true" />
        <div>
          <p className="hero-eyebrow mb-1.5">Meridian / Project Management</p>
          <h1 className="font-display text-[24px] leading-tight font-extrabold tracking-tight text-white">Projects</h1>
          <span className="page-heading-accent" aria-hidden="true" />
          <p className="text-xs text-white/70 mt-2">
            {summaryStats.activeCount} active projects &middot; {summaryStats.formattedBudget} total budget
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="btn btn-outline text-xs !py-2"
            title="Import projects from CSV, Excel, or JSON"
          >
            <Upload size={14} className="text-secondary-600" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="btn btn-outline text-xs !py-2"
            title="Export projects to CSV, Excel, PDF, or JSON"
          >
            <Download size={14} className="text-secondary-600" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary text-xs !py-2 shadow-sm"
          >
            <Plus size={15} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Controls Toolbar: Search, Filters, Sorting, View Toggle, Selection     */}
      {/* ========================================================================= */}
      <div className="card filter-toolbar p-4 sm:p-5 space-y-4">
        {/* Row 1: search, result count, view switch */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 lg:max-w-lg group">
            <label htmlFor="projects-search" className="sr-only">Search projects</label>
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand pointer-events-none" aria-hidden="true" />
            <input
              id="projects-search"
              type="search"
              placeholder="Search by project, client or lead…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input !rounded-xl !py-2.5 pl-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
            <span className="text-xs text-gray-500" aria-live="polite">
              Showing <strong className="text-gray-900 tabular-nums">{filteredProjects.length}</strong> of <span className="tabular-nums">{projects.length}</span> projects
            </span>
            {selectedIds.size > 0 && (
              <span className="badge-primary badge-dot">{selectedIds.size} selected</span>
            )}
            <div className="seg-control" role="group" aria-label="View mode">
              {[['grid', LayoutGrid, 'Cards'], ['table', TableIcon, 'Table']].map(([mode, Icon, label]) => (
                <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode} className={viewMode === mode ? 'is-active' : ''}>
                  <Icon size={14} aria-hidden="true" /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: status and priority chips */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="filter-label"><Filter size={12} aria-hidden="true" /> Status</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {statuses.map(s => {
                const count = s === 'All' ? projects.length : projects.filter(p => p.status === s).length;
                return (
                  <button key={s} type="button" onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s} className={`filter-chip ${statusFilter === s ? 'is-active' : ''}`}>
                    {s !== 'All' && <span className={`filter-dot status-${s.toLowerCase().replace(/\s+/g, '-')}`} aria-hidden="true" />}
                    {s}
                    <span className="filter-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="filter-label"><AlertTriangle size={12} aria-hidden="true" /> Priority</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by priority">
              {priorities.map(p => (
                <button key={p} type="button" onClick={() => setPriorityFilter(p)} aria-pressed={priorityFilter === p} className={`filter-chip ${priorityFilter === p ? 'is-active' : ''}`}>
                  {p !== 'All' && <span className={`filter-dot priority-${p.toLowerCase()}`} aria-hidden="true" />}
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: lead, sort, active filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="picker">
              <User size={14} className="text-brand shrink-0" aria-hidden="true" />
              <label htmlFor="projects-lead" className="sr-only">Project lead</label>
              <select id="projects-lead" value={leadFilter} onChange={(e) => setLeadFilter(e.target.value)}>
                <option value="All">All leads</option>
                {uniqueLeads.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="picker">
              <ArrowUpDown size={14} className="text-brand shrink-0" aria-hidden="true" />
              <label htmlFor="projects-sort" className="sr-only">Sort projects by</label>
              <select id="projects-sort" value={sortField} onChange={(e) => setSortField(e.target.value)}>
                <option value="name">Sort: Name</option>
                <option value="dueDate">Sort: Due date</option>
                <option value="budget">Sort: Budget</option>
                <option value="progress">Sort: Progress</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
                className="sort-dir"
                aria-label={sortDir === 'asc' ? 'Ascending, switch to descending' : 'Descending, switch to ascending'}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown size={13} className={`transition-transform duration-300 ${sortDir === 'desc' ? 'rotate-180' : ''}`} aria-hidden="true" />
                {sortDir === 'asc' ? 'A→Z' : 'Z→A'}
              </button>
            </div>
          </div>

          {(searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || leadFilter !== 'All') && (
            <div className="flex flex-wrap items-center gap-1.5 md:ms-auto animate-fade-in">
              {[
                searchQuery && { key: 'q', label: `“${searchQuery}”`, clear: () => setSearchQuery('') },
                statusFilter !== 'All' && { key: 's', label: statusFilter, clear: () => setStatusFilter('All') },
                priorityFilter !== 'All' && { key: 'p', label: `${priorityFilter} priority`, clear: () => setPriorityFilter('All') },
                leadFilter !== 'All' && { key: 'l', label: leadFilter, clear: () => setLeadFilter('All') },
              ].filter(Boolean).map(f => (
                <span key={f.key} className="active-filter">
                  {f.label}
                  <button type="button" onClick={f.clear} aria-label={`Remove filter ${f.label}`}><X size={11} /></button>
                </span>
              ))}
              <button type="button" onClick={handleResetFilters} className="text-xs font-bold text-danger-600 hover:text-danger-700 inline-flex items-center gap-1 ms-1">
                <RotateCcw size={12} aria-hidden="true" /> Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Projects View: GRID CARDS (exact DreamsCore reference) or TABLE        */}
      {/* ========================================================================= */}
      {filteredProjects.length === 0 ? (
        <div className="card p-12 text-center">
          <Layers size={36} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-800">No projects found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
            Try adjusting your search criteria or clear your active filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-outline text-xs mt-4"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Reference DreamsCore 3-column Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const isSelected = selectedIds.has(project.id);
            const totalTasks = project.totalTasks || 20;
            const completedTasks = project.completedTasks || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const spent = project.spent || 0;
            const budget = project.budget || 1;
            const spentPct = Math.min(100, Math.round((spent / budget) * 100));

            return (
              <div
                key={project.id}
                className={`card p-4 hover:shadow-card-hover transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected ? 'ring-2 ring-primary-400 border-primary-400' : ''
                }`}
              >
                <div>
                  {/* Top Header: Icon + Selection + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(project.id)}
                        className="rounded border-gray-300 text-brand focus:ring-primary/20 size-4 cursor-pointer"
                        title="Select project"
                      />
                      <span className="size-9 rounded-2xl bg-primrose-fill flex items-center justify-center text-sm shadow-xs ring-2 ring-primary-300/60">
                        <Layers size={17} />
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Project Title */}
                  <h3
                    onClick={() => setViewProject(project)}
                    className="text-[14px] font-bold text-gray-900 leading-snug hover:text-brand cursor-pointer transition-colors truncate"
                    title={project.name}
                  >
                    {project.name}
                  </h3>

                  {/* Client & Priority */}
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-secondary-500">
                    <span className="truncate max-w-[140px] font-medium">{project.company || project.client}</span>
                    <span>&middot;</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityBadgeClass(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>

                  {/* Tasks count */}
                  <div className="mt-3 flex items-center justify-between text-xs text-secondary-500 font-medium">
                    <span>
                      {completedTasks}/{totalTasks} tasks
                      {milestonePercent(project) !== null && (
                        <span className="ml-1.5 text-[11px]" title="Milestones complete">
                          &middot; {project.milestones.filter(m => m.completed).length}/{project.milestones.length} milestones
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-secondary-700">{progress}%</span>
                  </div>

                  {/* Budget & Progress bar */}
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[11px] text-secondary-500 mb-1">
                      <span>Budget</span>
                      <span className="font-semibold text-secondary-700">
                        ${Math.round(spent / 1000)}K / ${Math.round(budget / 1000)}K
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.status === 'Delayed'
                            ? 'bg-danger-500'
                            : project.status === 'Completed'
                            ? 'bg-success-600'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${spentPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Lead and Due date */}
                  <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="size-6 rounded-full bg-primary-100 text-brand text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(project.lead || project.manager || 'A').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-secondary-600 truncate font-medium">
                        {project.lead || project.manager} &middot; Lead
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-900 leading-none">
                        {formatDate(project.dueDate)}
                      </p>
                      <p className="text-[10px] text-secondary-400 mt-0.5">Due Date</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: View, Edit, Delete */}
                <div className="flex items-center gap-1.5 mt-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewProject(project)}
                    className="btn btn-outline text-xs !py-1.5 flex-1 transition-colors"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(project)}
                    className="size-8 rounded-lg border border-gray-200 grid place-items-center text-secondary-600 hover:text-brand hover:bg-gray-50 transition-colors"
                    title="Edit project"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(project)}
                    className="size-8 rounded-lg border border-gray-200 grid place-items-center text-secondary-600 hover:text-danger hover:bg-danger-50 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={filteredProjects.length > 0 && selectedIds.size === filteredProjects.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-brand focus:ring-primary/20 size-4 cursor-pointer"
                    />
                  </th>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Tasks</th>
                  <th>Budget</th>
                  <th>Lead</th>
                  <th>Due Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const isSelected = selectedIds.has(project.id);
                  const totalTasks = project.totalTasks || 20;
                  const completedTasks = project.completedTasks || 0;
                  const spent = project.spent || 0;
                  const budget = project.budget || 1;

                  return (
                    <tr key={project.id} className={isSelected ? 'bg-primary-50' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(project.id)}
                          className="rounded border-gray-300 text-brand focus:ring-primary/20 size-4 cursor-pointer"
                        />
                      </td>
                      <td>
                        <span
                          onClick={() => setViewProject(project)}
                          className="font-semibold text-gray-900 hover:text-brand cursor-pointer"
                        >
                          {project.name}
                        </span>
                      </td>
                      <td className="text-secondary-600 font-medium">
                        {project.company || project.client}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${getPriorityBadgeClass(project.priority)}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-secondary-700">
                          {completedTasks}/{totalTasks}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-gray-900">
                          ${Math.round(spent / 1000)}K / ${Math.round(budget / 1000)}K
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-secondary-700 font-medium">
                          {project.lead || project.manager}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-secondary-600">
                          {formatDate(project.dueDate)}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewProject(project)}
                            className="size-7 rounded hover:bg-gray-100 grid place-items-center text-gray-500 hover:text-brand"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(project)}
                            className="size-7 rounded hover:bg-gray-100 grid place-items-center text-gray-500 hover:text-brand"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(project)}
                            className="size-7 rounded hover:bg-danger-50 grid place-items-center text-gray-500 hover:text-danger"
                            title="Delete"
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
      )}

      {/* ========================================================================= */}
      {/* 4. Modal: CREATE or EDIT PROJECT                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitProject)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Project Name */}
            <div>
              <label htmlFor="projects-field-1" className="form-label">Project Name *</label>
              <input id="projects-field-1"
                type="text"
                {...register('name')}
                placeholder="e.g. Northwind POS Rollout"
                className="form-input text-xs"
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            {/* Client / Company */}
            <div>
              <label htmlFor="projects-field-2" className="form-label">Client / Company *</label>
              <input id="projects-field-2"
                type="text"
                {...register('company')}
                placeholder="e.g. Northwind Corp"
                className="form-input text-xs"
              />
              {errors.company && <p className="form-error">{errors.company.message}</p>}
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="projects-field-3" className="form-label">Priority *</label>
              <select id="projects-field-3" {...register('priority')} className="form-select text-xs">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              {errors.priority && <p className="form-error">{errors.priority.message}</p>}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="projects-field-4" className="form-label">Status *</label>
              <select id="projects-field-4" {...register('status')} className="form-select text-xs">
                <option value="In Progress">In Progress</option>
                <option value="Delayed">Delayed</option>
                <option value="On Track">On Track</option>
                <option value="Completed">Completed</option>
              </select>
              {errors.status && <p className="form-error">{errors.status.message}</p>}
            </div>

            {/* Project Lead */}
            <div>
              <label htmlFor="projects-field-5" className="form-label">Project Lead *</label>
              <input id="projects-field-5"
                type="text"
                {...register('lead')}
                placeholder="e.g. Aisha Rahman"
                className="form-input text-xs"
              />
              {errors.lead && <p className="form-error">{errors.lead.message}</p>}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="projects-field-6" className="form-label">Due Date *</label>
              <input id="projects-field-6"
                type="date"
                {...register('dueDate')}
                className="form-input text-xs"
              />
              {errors.dueDate && <p className="form-error">{errors.dueDate.message}</p>}
            </div>

            {/* Total Budget */}
            <div>
              <label htmlFor="projects-field-7" className="form-label">Total Budget ($) *</label>
              <input id="projects-field-7"
                type="number"
                {...register('budget')}
                placeholder="120000"
                className="form-input text-xs"
              />
              {errors.budget && <p className="form-error">{errors.budget.message}</p>}
            </div>

            {/* Budget Spent */}
            <div>
              <label htmlFor="projects-field-8" className="form-label">Budget Spent ($)</label>
              <input id="projects-field-8"
                type="number"
                {...register('spent')}
                placeholder="84000"
                className="form-input text-xs"
              />
              {errors.spent && <p className="form-error">{errors.spent.message}</p>}
            </div>

            {/* Total Tasks */}
            <div>
              <label htmlFor="projects-field-9" className="form-label">Total Tasks</label>
              <input id="projects-field-9"
                type="number"
                {...register('totalTasks')}
                placeholder="24"
                className="form-input text-xs"
              />
              {errors.totalTasks && <p className="form-error">{errors.totalTasks.message}</p>}
            </div>

            {/* Completed Tasks */}
            <div>
              <label htmlFor="projects-field-10" className="form-label">Completed Tasks</label>
              <input id="projects-field-10"
                type="number"
                {...register('completedTasks')}
                placeholder="18"
                className="form-input text-xs"
              />
              {errors.completedTasks && <p className="form-error">{errors.completedTasks.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="projects-field-11" className="form-label">Description (Optional)</label>
            <textarea id="projects-field-11"
              {...register('description')}
              rows={3}
              placeholder="Provide context, objectives, milestones, or notes..."
              className="form-input text-xs resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-outline text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-xs"
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. Modal: VIEW PROJECT DETAILS                                            */}
      {/* ========================================================================= */}
      {viewProject && (
        <Modal
          isOpen={Boolean(viewProject)}
          onClose={() => setViewProject(null)}
          title="Project Details"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-start gap-3">
                <span className="size-11 rounded-2xl bg-primrose-fill flex items-center justify-center text-lg shadow-xs ring-2 ring-primary-300/60 shrink-0">
                  <Layers size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{viewProject.name}</h3>
                  <p className="text-secondary-600 font-medium text-xs mt-0.5">
                    {viewProject.company || viewProject.client} &middot; {viewProject.category || 'General'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(viewProject.status)}`}>
                  {viewProject.status}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${getPriorityBadgeClass(viewProject.priority)}`}>
                  {viewProject.priority} Priority
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <span className="text-2xs font-semibold text-secondary-500 uppercase tracking-wide">Tasks Progress</span>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {viewProject.completedTasks || 0} / {viewProject.totalTasks || 0}
                </p>
                <div className="mt-1.5">
                  <ProgressBar
                    value={
                      viewProject.totalTasks > 0
                        ? Math.round(((viewProject.completedTasks || 0) / viewProject.totalTasks) * 100)
                        : 0
                    }
                    size="sm"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <span className="text-2xs font-semibold text-secondary-500 uppercase tracking-wide">Budget Used</span>
                <p className="text-base font-bold text-gray-900 mt-1">
                  ${Number(viewProject.spent || 0).toLocaleString()}
                </p>
                <span className="text-2xs text-secondary-400">
                  of ${Number(viewProject.budget || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <span className="text-2xs font-semibold text-secondary-500 uppercase tracking-wide">Project Lead</span>
                <p className="text-sm font-bold text-gray-900 mt-1 truncate">
                  {viewProject.lead || viewProject.manager || 'Unassigned'}
                </p>
                <span className="text-2xs text-secondary-400">Team Director</span>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <span className="text-2xs font-semibold text-secondary-500 uppercase tracking-wide">Due Date</span>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {formatDate(viewProject.dueDate)}
                </p>
                <span className="text-2xs text-secondary-400">Target Completion</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
              <h4 className="font-semibold text-gray-800 text-xs mb-1">Project Description</h4>
              <p className="text-secondary-600 leading-relaxed text-xs">
                {viewProject.description || 'No additional description provided for this project.'}
              </p>
            </div>

            {/* Milestones */}
            <ProjectMilestones project={viewProject} onChange={handleMilestonesChange} />

            {/* Audit Timestamps */}
            <div className="flex items-center justify-between text-2xs text-secondary-400 px-1">
              <span>ID: {viewProject.id}</span>
              {viewProject.updatedAt && (
                <span>Last Updated: {new Date(viewProject.updatedAt).toLocaleDateString()}</span>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViewProject(null)}
                className="btn btn-outline text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewProject;
                  setViewProject(null);
                  handleOpenEdit(target);
                }}
                className="btn btn-primary text-xs"
              >
                <Pencil size={13} />
                <span>Edit Project</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. Modal: EXPORT PROJECTS                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Projects"
        size="md"
      >
        <div className="space-y-4 text-xs">
          {/* Format Selection */}
          <div>
            <label className="form-label">Export Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'csv', label: 'CSV (.csv)', icon: FileText },
                { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
                { id: 'pdf', label: 'PDF Document', icon: FileCheck },
                { id: 'json', label: 'JSON Data', icon: Layers },
              ].map(fmt => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setExportFormat(fmt.id)}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                    exportFormat === fmt.id
                      ? 'border-primary-400 bg-primary-100 text-brand-strong font-bold shadow-xs'
                      : 'border-gray-200 bg-white text-secondary-600 hover:bg-gray-50'
                  }`}
                >
                  <fmt.icon size={18} />
                  <span className="text-2xs">{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="form-label">Export Scope</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportScope"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="accent-primary"
                />
                <div>
                  <p className="font-semibold text-gray-900">All Records ({projects.length} projects)</p>
                  <p className="text-2xs text-secondary-400">Export the complete dataset stored in the system</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportScope"
                  value="filtered"
                  checked={exportScope === 'filtered'}
                  onChange={() => setExportScope('filtered')}
                  className="accent-primary"
                />
                <div>
                  <p className="font-semibold text-gray-900">Current Filtered View ({filteredProjects.length} projects)</p>
                  <p className="text-2xs text-secondary-400">Respect active search query, status, priority, and lead filters</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 transition-colors ${
                  selectedIds.size > 0 ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="selected"
                  checked={exportScope === 'selected'}
                  onChange={() => selectedIds.size > 0 && setExportScope('selected')}
                  disabled={selectedIds.size === 0}
                  className="accent-primary"
                />
                <div>
                  <p className="font-semibold text-gray-900">Selected Rows Only ({selectedIds.size} selected)</p>
                  <p className="text-2xs text-secondary-400">
                    {selectedIds.size > 0
                      ? 'Export only the projects you checked in the list'
                      : 'No projects currently selected (check boxes in list to enable)'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="btn btn-outline text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              className="btn btn-primary text-xs"
            >
              <Download size={14} />
              <span>Download Export</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 7. Modal: IMPORT PROJECTS (matching reference design & Section 9)         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportFile(null);
          setImportResult(null);
        }}
        title="Import Projects"
        size="md"
      >
        <div className="space-y-4 text-xs">
          {!importResult ? (
            <>
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setImportDragActive(true); }}
                onDragLeave={() => setImportDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setImportDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setImportFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 rounded-xl cursor-pointer transition-colors border-2 border-dashed text-center ${
                  importDragActive
                    ? 'border-primary-400 bg-primary-100'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(e) => e.target.files && setImportFile(e.target.files[0])}
                  className="hidden"
                />
                <span className="size-11 rounded-full bg-primary-100 text-brand grid place-items-center mb-2">
                  <Upload size={20} />
                </span>
                <p className="font-semibold text-gray-800 text-xs">
                  {importFile ? importFile.name : 'Drag & drop a file here'}
                </p>
                <p className="text-2xs text-secondary-500 mt-0.5">
                  or <span className="text-brand font-semibold underline">browse to upload</span>
                </p>
                {importFile && (
                  <p className="text-2xs text-success-700 font-semibold mt-2">
                    Size: {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              {/* Template link & size constraint */}
              <div className="flex items-center justify-between text-2xs text-secondary-500">
                <span>Supports CSV, XLSX, JSON &middot; max 10MB</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Templates:</span>
                  <button
                    type="button"
                    onClick={() => downloadImportTemplate('csv')}
                    className="text-brand hover:underline font-semibold"
                  >
                    CSV
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => downloadImportTemplate('xlsx')}
                    className="text-brand hover:underline font-semibold"
                  >
                    Excel
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => downloadImportTemplate('json')}
                    className="text-brand hover:underline font-semibold"
                  >
                    JSON
                  </button>
                </div>
              </div>

              {/* Import Options Checkboxes */}
              <div className="space-y-2 p-3 rounded-xl border border-gray-200 bg-white">
                <label className="flex items-center gap-2 text-xs text-secondary-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={importSkipDuplicates}
                    onChange={(e) => setImportSkipDuplicates(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span>Skip duplicate entries</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-secondary-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={importUpdateExisting}
                    onChange={(e) => setImportUpdateExisting(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span>Update existing records (matches project name & company)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-secondary-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={importNotify}
                    onChange={(e) => setImportNotify(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span>Notify me when import completes</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="btn btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importFile || importLoading}
                  onClick={handleStartImport}
                  className="btn btn-primary text-xs"
                >
                  {importLoading ? 'Importing...' : 'Import Projects'}
                </button>
              </div>
            </>
          ) : (
            /* Import Results Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-success-50 border border-success-200 text-center">
                <CheckCircle2 size={32} className="text-success-600 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-success-900">Import Processing Complete</h4>
                <p className="text-xs text-success-700 mt-1">
                  Your project dataset has been validated and applied to the workspace.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-base font-bold text-success-600">{importResult.imported}</p>
                  <p className="text-2xs text-secondary-500">Imported</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-base font-bold text-info-600">{importResult.updated}</p>
                  <p className="text-2xs text-secondary-500">Updated</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-base font-bold text-warning-600">{importResult.skipped}</p>
                  <p className="text-2xs text-secondary-500">Skipped</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-base font-bold text-danger-600">{importResult.failed}</p>
                  <p className="text-2xs text-secondary-500">Failed</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-2xs space-y-1 max-h-32 overflow-y-auto">
                  <p className="font-bold text-danger-800">Errors encountered:</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-danger-700">
                      Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  className="btn btn-primary text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 8. Delete Confirmation Dialog                                             */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This will remove the project from the active workspace.`}
        confirmLabel="Delete"
        variant="danger"
      />

    </div>
  );
}
