import React, { useState, useMemo } from 'react';
import {
  Target, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  DollarSign, TrendingUp, Mail, Phone, Building2, User,
  ArrowRight, ShieldCheck, Filter, Search, Award
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import { initialLeads, leadSources, leadStatuses } from '../../../data/leads';
import { formatCurrency, formatDate, generateId, formatNumber } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';

export default function Leads() {
  const [leads, setLeads] = useLocalStorage('meridian-leads', initialLeads);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(leads, ['contactName', 'company', 'email', 'phone', 'notes', 'assignedTo']);

  // Filters
  const filteredLeads = useMemo(() => {
    return searchFiltered.filter(l => {
      const matchStatus = statusFilter === 'All' || l.status.toLowerCase() === statusFilter.toLowerCase();
      const matchSource = sourceFilter === 'All' || l.source.toLowerCase() === sourceFilter.toLowerCase();
      return matchStatus && matchSource;
    });
  }, [searchFiltered, statusFilter, sourceFilter]);

  // Pagination
  const pagination = usePagination(filteredLeads, 8);

  // Form State
  const [formData, setFormData] = useState({
    contactName: '',
    company: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'New',
    assignedTo: 'Sarah Ahmed',
    dealValue: 1200000,
    lastContact: '2026-10-15',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditLead(null);
    setFormData({
      contactName: '',
      company: '',
      email: '',
      phone: '+92-300-1234567',
      source: 'Website',
      status: 'New',
      assignedTo: 'Sarah Ahmed',
      dealValue: 1200000,
      lastContact: new Date().toISOString().split('T')[0],
      notes: 'Initial inquiry regarding ISO quality consulting.',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (l) => {
    setEditLead(l);
    setFormData({ ...l });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editLead) {
      setLeads(prev =>
        prev.map(l =>
          l.id === editLead.id
            ? { ...formData, dealValue: Number(formData.dealValue) }
            : l
        )
      );
      addToast('Lead details updated!', 'success');
    } else {
      const newLead = {
        id: `lead-${generateId()}`,
        ...formData,
        dealValue: Number(formData.dealValue),
      };
      setLeads(prev => [newLead, ...prev]);
      addToast('New lead added to sales pipeline!', 'success');
    }
    setModalOpen(false);
  };

  const handleConvertToWon = (lead) => {
    setLeads(prev =>
      prev.map(l => l.id === lead.id ? { ...l, status: 'Won' } : l)
    );
    addToast(`Lead "${lead.contactName}" successfully marked as WON! 🎉`, 'success');
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setLeads(prev => prev.filter(l => l.id !== deleteConfirm.id));
    addToast('Lead removed.', 'success');
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    exportToCSV(
      leads,
      'meridian_sales_leads',
      [
        { key: 'contactName', label: 'Contact Name' },
        { key: 'company', label: 'Company' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'source', label: 'Lead Source' },
        { key: 'status', label: 'Status' },
        { key: 'assignedTo', label: 'Assigned Consultant' },
        { key: 'dealValue', label: 'Potential Value (PKR)' },
        { key: 'lastContact', label: 'Last Contact' },
      ]
    );
    addToast('Leads exported to CSV!', 'info');
  };

  // KPIs
  const totalValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const wonCount = leads.filter(l => l.status === 'Won').length;
  const qualifiedCount = leads.filter(l => l.status === 'Qualified' || l.status === 'Proposal').length;
  const winRate = leads.length ? Math.round((wonCount / leads.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Manage prospective clients, audit inquiries, and sales qualification opportunities."
        breadcrumbs={[
          { label: 'Sales Analytics', href: '/sales-analytics' },
          { label: 'Leads' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExport} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Lead
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Inquiries"
          value={leads.length}
          subtitle="All incoming prospects"
          icon={Target}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Pipeline Volume"
          value={formatCurrency(totalValue)}
          subtitle="Unweighted total"
          icon={DollarSign}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Qualified / Proposal"
          value={qualifiedCount}
          subtitle="High probability deals"
          icon={TrendingUp}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Conversion Win Rate"
          value={`${winRate}%`}
          subtitle={`${wonCount} won to date`}
          icon={Award}
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
              placeholder="Search contact, company, email..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={sourceFilter}
              onChange={setSourceFilter}
              options={[
                { value: 'All', label: 'All Sources' },
                ...leadSources.map(s => ({ value: s, label: s }))
              ]}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                ...leadStatuses.map(s => ({ value: s, label: s }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card mb-6 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead & Organization</th>
                <th>Contact Information</th>
                <th>Channel Source</th>
                <th>Opportunity Value</th>
                <th>Consultant Owner</th>
                <th>Status</th>
                <th>Last Touch</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedData.map(l => (
                <tr key={l.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {l.contactName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-gray-900">{l.contactName}</p>
                        <p className="text-2xs text-gray-500">{l.company}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs text-gray-700">{l.email}</p>
                    <p className="text-2xs text-gray-400">{l.phone}</p>
                  </td>
                  <td>
                    <span className="badge-secondary text-2xs font-medium">{l.source}</span>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-primary">
                      {formatCurrency(l.dealValue)}
                    </span>
                  </td>
                  <td><span className="text-xs text-gray-700">{l.assignedTo}</span></td>
                  <td><StatusBadge status={l.status} /></td>
                  <td><span className="text-2xs text-gray-500">{formatDate(l.lastContact)}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {l.status !== 'Won' && (
                        <button
                          onClick={() => handleConvertToWon(l)}
                          className="p-1 text-success hover:bg-success/10 rounded"
                          title="Convert to Won"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setViewLead(l)}
                        className="p-1 text-gray-400 hover:text-primary rounded"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(l)}
                        className="p-1 text-gray-400 hover:text-info rounded"
                        title="Edit Lead"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(l)}
                        className="p-1 text-gray-400 hover:text-danger rounded"
                        title="Delete Lead"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editLead ? 'Edit Lead Details' : 'Capture New Lead'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editLead ? 'Save Changes' : 'Create Lead'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Contact Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Muhammad Azhar"
              />
            </div>
            <div>
              <label className="form-label">Company / Account *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Textile Corp Pakistan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Email *</label>
              <input
                type="email"
                required
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Lead Source</label>
              <select
                className="form-select"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                {leadSources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Pipeline Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {leadStatuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Value (PKR)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.dealValue}
                onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Assigned Consultant</label>
              <input
                type="text"
                className="form-input"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Last Contact</label>
              <input
                type="date"
                className="form-input"
                value={formData.lastContact}
                onChange={(e) => setFormData({ ...formData, lastContact: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Discovery Notes</label>
            <textarea
              rows={2}
              className="form-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Client requirements, standard focus..."
            />
          </div>
        </form>
      </Modal>

      {/* View Lead Modal */}
      {viewLead && (
        <Modal
          isOpen={!!viewLead}
          onClose={() => setViewLead(null)}
          title={`Lead: ${viewLead.contactName}`}
          size="md"
          footer={
            <button className="btn-secondary" onClick={() => setViewLead(null)}>Close</button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{viewLead.contactName}</h3>
                <p className="text-xs text-gray-500">{viewLead.company}</p>
              </div>
              <StatusBadge status={viewLead.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 block">Email</span>
                <span className="font-semibold text-gray-800 break-all">{viewLead.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Phone</span>
                <span className="font-semibold text-gray-800">{viewLead.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Source</span>
                <span className="font-semibold text-gray-800">{viewLead.source}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Assigned Owner</span>
                <span className="font-semibold text-gray-800">{viewLead.assignedTo}</span>
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex justify-between items-center">
              <div>
                <span className="text-2xs text-gray-500 uppercase tracking-wide block">Opportunity Value</span>
                <span className="text-base font-bold text-primary">{formatCurrency(viewLead.dealValue)}</span>
              </div>
              <span className="text-2xs text-gray-400">Last contact: {formatDate(viewLead.lastContact)}</span>
            </div>

            <div className="text-xs">
              <span className="text-gray-400 block mb-1">Discovery Notes:</span>
              <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{viewLead.notes || 'No notes logged.'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to remove lead "${deleteConfirm?.contactName}"?`}
      />
    </div>
  );
}
