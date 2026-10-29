import React, { useState, useMemo } from 'react';
import {
  CalendarCheck, Clock, CheckCircle2, AlertCircle, Plus, Pencil,
  Trash2, Phone, Mail, Users, CheckSquare, Search, Filter,
  Download, Calendar, Building2, User, ArrowUpRight
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
import { initialActivities } from '../../../data/crmData';
import { generateId } from '../../../utils/format';

const activityTypeIcons = {
  Meeting: { icon: Users, color: 'bg-primary-100 text-brand border-primary-300/70' },
  Call: { icon: Phone, color: 'bg-info/10 text-info border-info/20' },
  Task: { icon: CheckSquare, color: 'bg-accent-50 text-accent-700 border-accent/20' },
  Email: { icon: Mail, color: 'bg-warning/10 text-warning border-warning/20' },
};

export default function Activities() {
  const [activities, setActivities] = useLocalStorage('meridian-activities', initialActivities);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(activities, ['title', 'company', 'contact', 'notes', 'assignedTo']);

  // Filters
  const filteredActivities = useMemo(() => {
    return searchFiltered.filter(a => {
      const matchType = typeFilter === 'All' || a.type.toLowerCase() === typeFilter.toLowerCase();
      const matchStatus = statusFilter === 'All' || a.status.toLowerCase() === statusFilter.toLowerCase();
      const matchPriority = priorityFilter === 'All' || a.priority.toLowerCase() === priorityFilter.toLowerCase();
      return matchType && matchStatus && matchPriority;
    });
  }, [searchFiltered, typeFilter, statusFilter, priorityFilter]);

  // Pagination
  const pagination = usePagination(filteredActivities, 7);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'Meeting',
    company: '',
    contact: '',
    assignedTo: 'Sarah Ahmed',
    dateTime: '2026-10-18 10:00 AM',
    priority: 'Medium',
    status: 'Scheduled',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditActivity(null);
    setFormData({
      title: '',
      type: 'Meeting',
      company: 'Northwind Engineering Corp',
      contact: 'Marcus Lee',
      assignedTo: 'Sarah Ahmed',
      dateTime: '2026-10-20 11:00 AM',
      priority: 'High',
      status: 'Scheduled',
      notes: '',
    });
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (act) => {
    setEditActivity(act);
    setFormData({ ...act });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editActivity) {
      setActivities(prev =>
        prev.map(a => a.id === editActivity.id ? { ...formData } : a)
      );
      addToast('Activity updated successfully!', 'success');
    } else {
      const newAct = {
        id: `act-${generateId()}`,
        ...formData,
      };
      setActivities(prev => [newAct, ...prev]);
      addToast('Activity scheduled successfully!', 'success');
    }
    setModalOpen(false);
  };

  const handleToggleComplete = (act) => {
    const nextStatus = act.status === 'Completed' ? 'Scheduled' : 'Completed';
    setActivities(prev =>
      prev.map(a => a.id === act.id ? { ...a, status: nextStatus } : a)
    );
    addToast(`Activity marked as ${nextStatus.toLowerCase()}!`, 'success');
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setActivities(prev => prev.filter(a => a.id !== deleteConfirm.id));
    addToast('Activity deleted.', 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const scheduledCount = activities.filter(a => a.status === 'Scheduled').length;
  const completedCount = activities.filter(a => a.status === 'Completed').length;
  const highPriorityCount = activities.filter(a => a.priority === 'High' || a.priority === 'Critical').length;

  return (
    <div>
      <PageHeader
        title="Activities"
        subtitle="Manage consultative checkpoints, audit preparation calls, and client stakeholder engagements."
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Activities' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="activities" records={activities} setRecords={setActivities} filtered={filteredActivities} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Log Activity
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Activities"
          value={activities.length}
          subtitle="All recorded events"
          icon={CalendarCheck}
          iconColor="bg-primary-100 text-brand"
        />
        <StatCard
          title="Scheduled Pending"
          value={scheduledCount}
          subtitle="Upcoming actions"
          icon={Clock}
          iconColor="primrose"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          subtitle="Closed out items"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount}
          subtitle="Requires attention"
          icon={AlertCircle}
          iconColor="bg-danger/10 text-danger"
        />
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search title, company, notes..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'All', label: 'All Types' },
                { value: 'Meeting', label: 'Meetings' },
                { value: 'Call', label: 'Calls' },
                { value: 'Task', label: 'Tasks' },
                { value: 'Email', label: 'Emails' },
              ]}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Overdue', label: 'Overdue' },
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

      {/* Activity Timeline List */}
      <div className="card divide-y divide-gray-100 mb-6">
        {pagination.paginatedData.map(act => {
          const typeMeta = activityTypeIcons[act.type] || activityTypeIcons.Meeting;
          const IconComp = typeMeta.icon;
          const isDone = act.status === 'Completed';

          return (
            <div key={act.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Complete checkbox / icon */}
                <button
                  onClick={() => handleToggleComplete(act)}
                  className={`mt-0.5 w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                    isDone
                      ? 'bg-success text-white border-success'
                      : `${typeMeta.color} hover:bg-white`
                  }`}
                  title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                >
                  {isDone ? <CheckCircle2 size={20} /> : <IconComp size={18} />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {act.title}
                    </span>
                    <StatusBadge status={act.status} />
                    <StatusBadge status={act.priority} />
                    <span className="badge-secondary text-2xs uppercase tracking-wide">
                      {act.type}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                    {act.notes}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-gray-400" />
                      <strong className="text-gray-700">{act.company}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-gray-400" />
                      {act.contact}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      {act.dateTime}
                    </span>
                    <span className="text-gray-400">
                      Owner: <span className="text-gray-700 font-medium">{act.assignedTo}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleToggleComplete(act)}
                  className={`btn-sm ${isDone ? 'btn-outline' : 'btn-primary'}`}
                >
                  {isDone ? 'Undo' : 'Complete'}
                </button>
                <button
                  onClick={() => handleOpenEdit(act)}
                  className="p-1.5 text-gray-500 hover:text-info hover:bg-gray-100 rounded-lg"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(act)}
                  className="p-1.5 text-gray-500 hover:text-danger hover:bg-gray-100 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editActivity ? 'Edit Activity' : 'Schedule Activity'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="activities-submit-form" className="btn-primary">
              {editActivity ? 'Save Changes' : 'Schedule Activity'}
            </button>
          </>
        }
      >
        <form id="activities-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="activities-field-1" className="form-label">Subject / Title *</label>
            <input id="activities-field-1"
              type="text"
              required
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. ISO 9001 Stage 2 Audit Kickoff"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="activities-field-2" className="form-label">Type</label>
              <select id="activities-field-2"
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Meeting">Meeting</option>
                <option value="Call">Call</option>
                <option value="Task">Task</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div>
              <label htmlFor="activities-field-3" className="form-label">Priority</label>
              <select id="activities-field-3"
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="activities-field-4" className="form-label">Company / Account *</label>
              <input id="activities-field-4"
                type="text"
                required
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Cascade Retail Grp"
              />
            </div>
            <div>
              <label htmlFor="activities-field-5" className="form-label">Contact Person</label>
              <input id="activities-field-5"
                type="text"
                className="form-input"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="e.g. Amelia Hart"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="activities-field-6" className="form-label">Date & Time</label>
              <input id="activities-field-6"
                type="text"
                className="form-input"
                value={formData.dateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                placeholder="2026-10-20 10:00 AM"
              />
            </div>
            <div>
              <label htmlFor="activities-field-7" className="form-label">Assigned Consultant</label>
              <input id="activities-field-7"
                type="text"
                className="form-input"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Sarah Ahmed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="activities-field-8" className="form-label">Status</label>
            <select id="activities-field-8"
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label htmlFor="activities-field-9" className="form-label">Meeting Notes / Agenda</label>
            <textarea id="activities-field-9"
              rows={3}
              className="form-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Action items, prerequisites, or talking points..."
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message={`Are you sure you want to remove activity "${deleteConfirm?.title}"?`}
      />
    </div>
  );
}
