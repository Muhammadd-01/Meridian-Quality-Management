import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Plus, Pencil, Trash2, Eye, Users, Target,
  TrendingUp, Award, Phone, Mail, Building2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/tables/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialLeads, leadSources, leadStatuses } from '../../data/leads';
import { formatCurrency, formatDate, generateId } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';

const leadSchema = z.object({
  contactName: z.string().min(2, 'Name is required'),
  company: z.string().min(2, 'Company is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone is required'),
  source: z.string().min(1, 'Source is required'),
  status: z.string().min(1, 'Status is required'),
  assignedTo: z.string().min(2, 'Assigned representative is required'),
  dealValue: z.coerce.number().min(0, 'Deal value must be positive'),
  notes: z.string().optional(),
});

export default function CRM() {
  const [leads, setLeads] = useLocalStorage('meridian-leads', initialLeads);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const addToast = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(leadSchema),
  });

  // KPI Calculations
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const activeOpportunities = leads.filter(l => ['Qualified', 'Proposal'].includes(l.status)).length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100) : 0;
  const totalPipeline = leads.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + l.dealValue, 0);

  // Source breakdown for chart
  const sourceBreakdown = useMemo(() => {
    const colors = { Website: '#40BFA6', Referral: '#7c5cfc', LinkedIn: '#17a2b8', Conference: '#ffc107', 'Cold Call': '#dc3545', Other: '#6c757d' };
    const counts = {};
    leads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: colors[name] || '#6c757d' }));
  }, [leads]);

  // Pipeline data for chart
  const pipelineData = useMemo(() => {
    return leadStatuses.map(status => ({
      name: status,
      count: leads.filter(l => l.status === status).length,
      value: leads.filter(l => l.status === status).reduce((s, l) => s + l.dealValue, 0),
    }));
  }, [leads]);

  // Filter
  const filteredByFilters = useMemo(() => {
    let data = leads;
    if (statusFilter !== 'All') data = data.filter(l => l.status === statusFilter);
    if (sourceFilter !== 'All') data = data.filter(l => l.source === sourceFilter);
    return data;
  }, [leads, statusFilter, sourceFilter]);

  const { query, setQuery, filtered } = useSearch(filteredByFilters, ['contactName', 'company', 'email', 'assignedTo']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'contactName');
  const pagination = usePagination(sorted, 8);

  const openCreate = () => {
    setEditingLead(null);
    reset({ contactName: '', company: '', email: '', phone: '', source: 'Website', status: 'New', assignedTo: '', dealValue: 0, notes: '' });
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    Object.keys(lead).forEach(k => {
      if (['contactName', 'company', 'email', 'phone', 'source', 'status', 'assignedTo', 'dealValue', 'notes'].includes(k)) {
        setValue(k, lead[k]);
      }
    });
    setModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingLead) {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...data, lastContact: new Date().toISOString().split('T')[0] } : l));
      addToast('Lead updated successfully', 'success');
    } else {
      const newLead = { ...data, id: generateId(), lastContact: new Date().toISOString().split('T')[0] };
      setLeads(prev => [newLead, ...prev]);
      addToast('Lead created successfully', 'success');
    }
    setModalOpen(false);
    reset();
  };

  const handleDelete = () => {
    setLeads(prev => prev.filter(l => l.id !== deleteDialog.id));
    addToast('Lead deleted successfully', 'success');
    setDeleteDialog(null);
  };

  const handleExport = () => {
    exportToCSV(sorted, 'leads', [
      { key: 'contactName', label: 'Contact Name' },
      { key: 'company', label: 'Company' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'dealValue', label: 'Deal Value (PKR)' },
      { key: 'lastContact', label: 'Last Contact' },
    ]);
    addToast('CSV exported successfully', 'info');
  };

  const pipelineColors = { New: '#40BFA6', Contacted: '#17a2b8', Qualified: '#7c5cfc', Proposal: '#ffc107', Won: '#28a745', Lost: '#dc3545' };

  const columns = [
    {
      key: 'contactName',
      label: 'Contact',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {row.contactName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{row.contactName}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building2 size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600">{row.company}</span>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      render: (row) => <span className="badge-secondary">{row.source}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-600">{row.assignedTo}</span>,
    },
    {
      key: 'dealValue',
      label: 'Deal Value',
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-gray-700">{formatCurrency(row.dealValue)}</span>,
    },
    {
      key: 'lastContact',
      label: 'Last Contact',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-500">{formatDate(row.lastContact)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="CRM"
        subtitle="Manage leads, contacts, and sales pipeline"
        breadcrumbs={[{ label: 'CRM' }]}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Lead
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total Leads" value={totalLeads} icon={Users} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Qualified" value={qualifiedLeads} icon={Target} iconColor="bg-accent/10 text-accent" />
        <StatCard title="Opportunities" value={activeOpportunities} icon={TrendingUp} iconColor="bg-info/10 text-info" />
        <StatCard title="Won Deals" value={wonLeads} icon={Award} iconColor="bg-success/10 text-success" />
        <StatCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} icon={Target} iconColor="bg-warning/10 text-warning" />
        <StatCard title="Pipeline Value" value={formatCurrency(totalPipeline)} icon={TrendingUp} iconColor="bg-primary/10 text-primary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Sales Pipeline" subtitle="Leads by status">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                {pipelineData.map((entry, i) => (
                  <Cell key={i} fill={pipelineColors[entry.name] || '#6c757d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Sources" subtitle="Distribution by source">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sourceBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {sourceBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="card card-body mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search leads..." className="flex-1" />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'All', label: 'All Statuses' }, ...leadStatuses.map(s => ({ value: s, label: s }))]}
          />
          <FilterDropdown
            value={sourceFilter}
            onChange={setSourceFilter}
            options={[{ value: 'All', label: 'All Sources' }, ...leadSources.map(s => ({ value: s, label: s }))]}
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
          emptyTitle="No leads found"
          emptyDescription="Try adjusting your search or filters, or create a new lead."
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
        title={editingLead ? 'Edit Lead' : 'Create New Lead'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)}>
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contact Name</label>
              <input {...register('contactName')} className="form-input" placeholder="Full name" />
              {errors.contactName && <p className="form-error">{errors.contactName.message}</p>}
            </div>
            <div>
              <label className="form-label">Company</label>
              <input {...register('company')} className="form-input" placeholder="Company name" />
              {errors.company && <p className="form-error">{errors.company.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Email</label>
              <input {...register('email')} type="email" className="form-input" placeholder="email@company.pk" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input {...register('phone')} className="form-input" placeholder="+92-XXX-XXXXXXX" />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Source</label>
              <select {...register('source')} className="form-select">
                {leadSources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-select">
                {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Assigned To</label>
              <input {...register('assignedTo')} className="form-input" placeholder="Rep name" />
              {errors.assignedTo && <p className="form-error">{errors.assignedTo.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">Deal Value (PKR)</label>
            <input {...register('dealValue')} type="number" className="form-input" placeholder="0" />
            {errors.dealValue && <p className="form-error">{errors.dealValue.message}</p>}
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea {...register('notes')} className="form-input" rows={3} placeholder="Additional notes..." />
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Lead Details" size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                {viewModal.contactName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{viewModal.contactName}</h3>
                <p className="text-sm text-gray-500">{viewModal.company}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={viewModal.status} /></div>
            </div>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={12} /> Email</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> Phone</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Source</p>
                <span className="badge-secondary">{viewModal.source}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Assigned To</p>
                <p className="text-sm font-medium text-gray-700">{viewModal.assignedTo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Deal Value</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(viewModal.dealValue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Last Contact</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(viewModal.lastContact)}</p>
              </div>
            </div>
            {viewModal.notes && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{viewModal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteDialog?.contactName}"? This action cannot be undone.`}
      />
    </div>
  );
}
