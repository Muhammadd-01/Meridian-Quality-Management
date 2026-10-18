import React, { useState, useMemo } from 'react';
import {
  Clock, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  XCircle, AlertCircle, Filter, Search, Calendar, User, Briefcase,
  FileCheck, ShieldAlert
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useQuickAction from '../../../hooks/useQuickAction';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import useCollection from '../../../hooks/useCollection';
import WeeklySummary from './WeeklySummary';
import { initialTimesheets } from '../../../data/projectManagementData';
import { formatDate, generateId } from '../../../utils/format';

export default function Timesheets() {
  const [timesheets, setTimesheets] = useLocalStorage('meridian-timesheets', initialTimesheets);
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTimesheet, setEditTimesheet] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();
  const [projects] = useCollection('projects');

  // Project options: live project records plus project names already used on entries.
  const projectOptions = useMemo(
    () => Array.from(new Set([...projects.map(p => p.name), ...timesheets.map(t => t.project)].filter(Boolean))).sort(),
    [projects, timesheets]
  );

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(timesheets, ['employee', 'project', 'task', 'description']);

  // Filters
  const filteredTimesheets = useMemo(() => {
    return searchFiltered.filter(ts => {
      const matchStatus = statusFilter === 'All' || ts.status.toLowerCase() === statusFilter.toLowerCase();
      const matchProject = projectFilter === 'All' || ts.project === projectFilter;
      return matchStatus && matchProject;
    });
  }, [searchFiltered, statusFilter, projectFilter]);

  // Pagination
  const pagination = usePagination(filteredTimesheets, 8);

  // Form State
  const [formData, setFormData] = useState({
    employee: 'Sarah Ahmed',
    project: projectOptions[0] || 'ISO 9001 Implementation',
    task: 'Measurement Traceability Check',
    date: '2026-10-15',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    hours: 7.5,
    description: '',
    status: 'Pending',
    approvedBy: 'Pending Review',
  });

  const handleOpenAdd = () => {
    setEditTimesheet(null);
    setFormData({
      employee: 'Sarah Ahmed',
      project: projectOptions[0] || 'ISO 9001 Implementation',
      task: 'Audit Documentation Review',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      hours: 7.5,
      description: 'Reviewing process documentation and compliance registers.',
      status: 'Pending',
      approvedBy: 'Pending Review',
    });
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (ts) => {
    setEditTimesheet(ts);
    setFormData({ ...ts });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editTimesheet) {
      setTimesheets(prev =>
        prev.map(ts =>
          ts.id === editTimesheet.id
            ? { ...formData, hours: Number(formData.hours) }
            : ts
        )
      );
      addToast('Timesheet record updated!', 'success');
    } else {
      const newTs = {
        id: `ts-${generateId()}`,
        ...formData,
        hours: Number(formData.hours),
      };
      setTimesheets(prev => [newTs, ...prev]);
      addToast('Hours logged successfully!', 'success');
    }
    setModalOpen(false);
  };

  const handleUpdateStatus = (ts, newStatus) => {
    setTimesheets(prev =>
      prev.map(item =>
        item.id === ts.id
          ? {
              ...item,
              status: newStatus,
              approvedBy: newStatus === 'Approved' ? 'Sarah Ahmed (Lead Auditor)' : 'Rejected by Lead',
            }
          : item
      )
    );
    addToast(`Timesheet marked as ${newStatus}!`, newStatus === 'Approved' ? 'success' : 'info');
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setTimesheets(prev => prev.filter(ts => ts.id !== deleteConfirm.id));
    addToast('Timesheet record removed.', 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hours || 0), 0);
  const approvedHours = timesheets.filter(ts => ts.status === 'Approved').reduce((sum, ts) => sum + (ts.hours || 0), 0);
  const pendingCount = timesheets.filter(ts => ts.status === 'Pending').length;
  const rejectedCount = timesheets.filter(ts => ts.status === 'Rejected').length;

  return (
    <div>
      <PageHeader
        title="Timesheets"
        subtitle="Track on-site auditor logs, client consult hours, and project time expenditure."
        breadcrumbs={[
          { label: 'Project Management', href: '/projects' },
          { label: 'Timesheets' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="timesheets" records={timesheets} setRecords={setTimesheets} filtered={filteredTimesheets} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Log Hours
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Logged Hours"
          value={`${totalHours} hrs`}
          subtitle="Cumulative hours"
          icon={Clock}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Approved Hours"
          value={`${approvedHours} hrs`}
          subtitle="Verified billable"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          subtitle="Awaiting signoff"
          icon={AlertCircle}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Flagged / Rejected"
          value={rejectedCount}
          subtitle="Action required"
          icon={ShieldAlert}
          iconColor="bg-danger/10 text-danger"
        />
      </div>

      {/* Filters and Search */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search employee, project, task..."
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
                { value: 'Approved', label: 'Approved' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Weekly summary (respects search and filters) */}
      <WeeklySummary entries={filteredTimesheets} />

      {/* Timesheets Table */}
      <div className="card mb-6 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Consultant</th>
                <th>Project & Deliverable</th>
                <th>Work Description</th>
                <th>Date</th>
                <th>Time Window</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Approver</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedData.map(ts => (
                <tr key={ts.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-2xs flex items-center justify-center">
                        {ts.employee.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{ts.employee}</span>
                    </div>
                  </td>
                  <td>
                    <p className="font-semibold text-xs text-gray-900">{ts.task}</p>
                    <span className="badge-secondary text-2xs mt-0.5">{ts.project}</span>
                  </td>
                  <td className="max-w-xs">
                    <p className="text-xs text-gray-600 line-clamp-1">{ts.description}</p>
                  </td>
                  <td>
                    <span className="text-xs text-gray-600 font-medium">{formatDate(ts.date)}</span>
                  </td>
                  <td>
                    <span className="text-2xs text-gray-500">{ts.startTime} - {ts.endTime}</span>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-primary">{ts.hours} hrs</span>
                  </td>
                  <td><StatusBadge status={ts.status} /></td>
                  <td>
                    <span className="text-2xs text-gray-500">{ts.approvedBy}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {ts.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(ts, 'Approved')}
                            className="p-1 text-success hover:bg-success/10 rounded"
                            title="Approve"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(ts, 'Rejected')}
                            className="p-1 text-danger hover:bg-danger/10 rounded"
                            title="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOpenEdit(ts)}
                        className="p-1 text-gray-400 hover:text-info rounded"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(ts)}
                        className="p-1 text-gray-400 hover:text-danger rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Add / Edit Timesheet Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTimesheet ? 'Edit Timesheet Entry' : 'Log Hours'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="timesheets-submit-form" className="btn-primary">
              {editTimesheet ? 'Update Record' : 'Submit Hours'}
            </button>
          </>
        }
      >
        <form id="timesheets-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="timesheets-field-1" className="form-label">Consultant *</label>
              <input id="timesheets-field-1"
                type="text"
                required
                className="form-input"
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="timesheets-field-2" className="form-label">Date *</label>
              <input id="timesheets-field-2"
                type="date"
                required
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="timesheets-field-3" className="form-label">Project *</label>
            <select id="timesheets-field-3"
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
            <label htmlFor="timesheets-field-4" className="form-label">Task Deliverable *</label>
            <input id="timesheets-field-4"
              type="text"
              required
              className="form-input"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              placeholder="e.g. ISO 9001 Clause 7 Traceability Check"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="timesheets-field-5" className="form-label">Start Time</label>
              <input id="timesheets-field-5"
                type="text"
                className="form-input"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                placeholder="09:00 AM"
              />
            </div>
            <div>
              <label htmlFor="timesheets-field-6" className="form-label">End Time</label>
              <input id="timesheets-field-6"
                type="text"
                className="form-input"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                placeholder="05:00 PM"
              />
            </div>
            <div>
              <label htmlFor="timesheets-field-7" className="form-label">Hours *</label>
              <input id="timesheets-field-7"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                className="form-input"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="timesheets-field-8" className="form-label">Work Description *</label>
            <textarea id="timesheets-field-8"
              rows={3}
              required
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail actions completed, audit checks conducted, or reports drafted..."
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Timesheet Entry"
        message={`Are you sure you want to remove the ${deleteConfirm?.hours} hrs logged for ${deleteConfirm?.employee}?`}
      />
    </div>
  );
}
