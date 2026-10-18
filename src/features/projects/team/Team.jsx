import React, { useState, useMemo } from 'react';
import {
  Users, Plus, Pencil, Trash2, Eye, Download, Mail, Phone,
  Briefcase, CheckSquare, Award, AlertTriangle, Search, Filter,
  Calendar, ShieldCheck, UserCheck
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
import { initialTeamMembers } from '../../../data/projectManagementData';
import { formatDate, generateId } from '../../../utils/format';

export default function Team() {
  const [team, setTeam] = useLocalStorage('meridian-team', initialTeamMembers);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(team, ['name', 'role', 'department', 'email']);

  // Filters
  const filteredTeam = useMemo(() => {
    return searchFiltered.filter(m => {
      const matchDept = departmentFilter === 'All' || m.department === departmentFilter;
      const matchStatus = statusFilter === 'All' || m.status.toLowerCase() === statusFilter.toLowerCase();
      return matchDept && matchStatus;
    });
  }, [searchFiltered, departmentFilter, statusFilter]);

  // Pagination
  const pagination = usePagination(filteredTeam, 6);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: 'Quality Assurance',
    email: '',
    phone: '',
    assignedProjects: 2,
    activeTasks: 4,
    workload: 65,
    status: 'Active',
  });

  const handleOpenAdd = () => {
    setEditMember(null);
    setFormData({
      name: '',
      role: 'Quality Assurance Auditor',
      department: 'Quality Assurance',
      email: '',
      phone: '+92 300 0000000',
      assignedProjects: 1,
      activeTasks: 2,
      workload: 50,
      status: 'Active',
    });
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (m) => {
    setEditMember(m);
    setFormData({ ...m });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const initials = formData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TM';

    if (editMember) {
      setTeam(prev =>
        prev.map(m =>
          m.id === editMember.id
            ? {
                ...formData,
                avatar: initials,
                assignedProjects: Number(formData.assignedProjects),
                activeTasks: Number(formData.activeTasks),
                workload: Number(formData.workload),
              }
            : m
        )
      );
      addToast('Team member profile updated!', 'success');
    } else {
      const newMember = {
        id: `team-${generateId()}`,
        ...formData,
        avatar: initials,
        color: 'bg-primary text-white',
        joinedDate: new Date().toISOString().split('T')[0],
        assignedProjects: Number(formData.assignedProjects),
        activeTasks: Number(formData.activeTasks),
        workload: Number(formData.workload),
      };
      setTeam(prev => [newMember, ...prev]);
      addToast('New team member added!', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setTeam(prev => prev.filter(m => m.id !== deleteConfirm.id));
    addToast(`Team member "${deleteConfirm.name}" removed.`, 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const activeMembers = team.filter(m => m.status === 'Active').length;
  const avgWorkload = team.length ? Math.round(team.reduce((acc, m) => acc + (m.workload || 0), 0) / team.length) : 0;
  const totalTasksUnderway = team.reduce((acc, m) => acc + (m.activeTasks || 0), 0);

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Manage lead auditors, compliance engineers, and quality assurance specialists."
        breadcrumbs={[
          { label: 'Project Management', href: '/projects' },
          { label: 'Team' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="team" records={team} setRecords={setTeam} filtered={filteredTeam} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Team Member
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Staff"
          value={team.length}
          subtitle="Consulting personnel"
          icon={Users}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active on Engagements"
          value={activeMembers}
          subtitle="Currently deployed"
          icon={UserCheck}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Avg Team Workload"
          value={`${avgWorkload}%`}
          subtitle="Capacity utilization"
          icon={ShieldCheck}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Active Deliverables"
          value={totalTasksUnderway}
          subtitle="Total assigned tasks"
          icon={CheckSquare}
          iconColor="bg-accent/10 text-accent"
        />
      </div>

      {/* Filters and Search */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search member name, role, email..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={[
                { value: 'All', label: 'All Departments' },
                { value: 'Quality Assurance', label: 'Quality Assurance' },
                { value: 'Audit & Compliance', label: 'Audit & Compliance' },
                { value: 'Quality Management', label: 'Quality Management' },
                { value: 'Process Engineering', label: 'Process Engineering' },
              ]}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'On Leave', label: 'On Leave' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {pagination.paginatedData.map(member => {
          let workloadColor = 'bg-success';
          if (member.workload > 85) workloadColor = 'bg-danger';
          else if (member.workload > 70) workloadColor = 'bg-warning';

          return (
            <div
              key={member.id}
              className="card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-sm ${member.color || 'bg-primary text-white'}`}>
                      {member.avatar || 'TM'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{member.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                    </div>
                  </div>
                  <StatusBadge status={member.status} />
                </div>

                <div className="mb-3">
                  <span className="badge-secondary text-2xs uppercase tracking-wide font-semibold">
                    {member.department}
                  </span>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 py-3 border-y border-gray-100 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                </div>

                {/* Workload */}
                <div className="mt-3.5">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-500 font-medium">Workload Capacity</span>
                    <span className="font-semibold text-gray-800">{member.workload}%</span>
                  </div>
                  <ProgressBar value={member.workload} color={workloadColor} size="sm" showLabel={false} />
                </div>

                {/* Assigned stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-center">
                  <div>
                    <span className="text-2xs text-gray-400 uppercase tracking-wide block">Projects</span>
                    <span className="text-sm font-bold text-gray-800">{member.assignedProjects} Assigned</span>
                  </div>
                  <div>
                    <span className="text-2xs text-gray-400 uppercase tracking-wide block">Active Tasks</span>
                    <span className="text-sm font-bold text-primary">{member.activeTasks} Tasks</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <span className="text-2xs text-gray-400">
                  Joined {formatDate(member.joinedDate)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-1.5 text-gray-500 hover:text-info hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Member"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(member)}
                    className="p-1.5 text-gray-500 hover:text-danger hover:bg-gray-100 rounded-lg transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
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
        title={editMember ? 'Edit Team Member Profile' : 'Add Team Member'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="team-submit-form" className="btn-primary">
              {editMember ? 'Save Changes' : 'Add Member'}
            </button>
          </>
        }
      >
        <form id="team-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="team-field-1" className="form-label">Full Name *</label>
            <input id="team-field-1"
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Kamran Hussain"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="team-field-2" className="form-label">Role Title *</label>
              <input id="team-field-2"
                type="text"
                required
                className="form-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Senior Lead Auditor"
              />
            </div>
            <div>
              <label htmlFor="team-field-3" className="form-label">Department</label>
              <select id="team-field-3"
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Audit & Compliance">Audit & Compliance</option>
                <option value="Quality Management">Quality Management</option>
                <option value="Process Engineering">Process Engineering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="team-field-4" className="form-label">Email Address *</label>
              <input id="team-field-4"
                type="email"
                required
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@meridian.com"
              />
            </div>
            <div>
              <label htmlFor="team-field-5" className="form-label">Phone Number</label>
              <input id="team-field-5"
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="team-field-6" className="form-label">Assigned Projects</label>
              <input id="team-field-6"
                type="number"
                min="0"
                className="form-input"
                value={formData.assignedProjects}
                onChange={(e) => setFormData({ ...formData, assignedProjects: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="team-field-7" className="form-label">Active Tasks</label>
              <input id="team-field-7"
                type="number"
                min="0"
                className="form-input"
                value={formData.activeTasks}
                onChange={(e) => setFormData({ ...formData, activeTasks: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="team-field-8" className="form-label">Workload (%)</label>
              <input id="team-field-8"
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.workload}
                onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="team-field-9" className="form-label">Status</label>
            <select id="team-field-9"
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${deleteConfirm?.name} from active staff?`}
      />
    </div>
  );
}
