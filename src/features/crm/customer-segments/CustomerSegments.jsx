import React, { useState, useMemo } from 'react';
import {
  PieChart, Users, Plus, Pencil, Trash2, Eye, Download,
  Layers, ArrowUpRight, TrendingUp, CheckCircle, Tag, Filter, Search
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import ProgressBar from '../../../components/ui/ProgressBar';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useQuickAction from '../../../hooks/useQuickAction';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { initialSegments } from '../../../data/crmData';
import { formatCurrency, formatNumber, formatDate, generateId } from '../../../utils/format';

export default function CustomerSegments() {
  const [segments, setSegments] = useLocalStorage('meridian-customer-segments', initialSegments);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSegment, setEditSegment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewSegment, setViewSegment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(segments, ['name', 'description', 'criteria']);

  // Status Filter
  const filteredSegments = useMemo(() => {
    if (statusFilter === 'All') return searchFiltered;
    return searchFiltered.filter(s => s.status.toLowerCase() === statusFilter.toLowerCase());
  }, [searchFiltered, statusFilter]);

  // Pagination
  const pagination = usePagination(filteredSegments, 6);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: '',
    customerCount: 25,
    shareOfBase: 10,
    avgValue: 1000000,
    status: 'Active',
    tags: 'ISO 9001, Enterprise',
  });

  const handleOpenAdd = () => {
    setEditSegment(null);
    setFormData({
      name: '',
      description: '',
      criteria: '',
      customerCount: 25,
      shareOfBase: 10,
      avgValue: 1000000,
      status: 'Active',
      tags: 'ISO 9001, Enterprise',
    });
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (seg) => {
    setEditSegment(seg);
    setFormData({
      name: seg.name,
      description: seg.description,
      criteria: seg.criteria,
      customerCount: seg.customerCount,
      shareOfBase: seg.shareOfBase,
      avgValue: seg.avgValue,
      status: seg.status,
      tags: Array.isArray(seg.tags) ? seg.tags.join(', ') : seg.tags,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editSegment) {
      setSegments(prev =>
        prev.map(s =>
          s.id === editSegment.id
            ? {
                ...s,
                ...formData,
                customerCount: Number(formData.customerCount),
                shareOfBase: Number(formData.shareOfBase),
                avgValue: Number(formData.avgValue),
                tags: tagArray,
                updatedAt: new Date().toISOString().split('T')[0],
              }
            : s
        )
      );
      addToast('Customer segment updated successfully!', 'success');
    } else {
      const newSeg = {
        id: `seg-${generateId()}`,
        ...formData,
        customerCount: Number(formData.customerCount),
        shareOfBase: Number(formData.shareOfBase),
        avgValue: Number(formData.avgValue),
        tags: tagArray,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setSegments(prev => [newSeg, ...prev]);
      addToast('New customer segment created successfully!', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setSegments(prev => prev.filter(s => s.id !== deleteConfirm.id));
    addToast(`Segment "${deleteConfirm.name}" deleted.`, 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const totalAccounts = segments.reduce((sum, s) => sum + (s.customerCount || 0), 0);
  const highestShare = [...segments].sort((a, b) => b.shareOfBase - a.shareOfBase)[0];
  const avgOverallVal = segments.length ? Math.round(segments.reduce((acc, s) => acc + (s.avgValue || 0), 0) / segments.length) : 0;

  return (
    <div>
      <PageHeader
        title="Customer Segments"
        subtitle="Classify and monitor quality management client cohorts by contract tier and compliance scope."
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Customer Segments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="segments" records={segments} setRecords={setSegments} filtered={filteredSegments} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Segment
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Segments"
          value={segments.length}
          subtitle="Cohort profiles active"
          icon={Layers}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Classified Accounts"
          value={formatNumber(totalAccounts)}
          subtitle="Clients segmented"
          icon={Users}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Primary Cohort"
          value={highestShare ? `${highestShare.shareOfBase}%` : 'N/A'}
          subtitle={highestShare ? highestShare.name : 'No segments'}
          icon={TrendingUp}
          iconColor="bg-accent/10 text-accent"
        />
        <StatCard
          title="Avg Segment ACV"
          value={formatCurrency(avgOverallVal)}
          subtitle="Contract annual value"
          icon={CheckCircle}
          iconColor="bg-success/10 text-success"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search segments by name, criteria..."
            />
          </div>
          <div className="flex items-center gap-3">
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {pagination.paginatedData.map(segment => (
          <div
            key={segment.id}
            className="card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between border-t-4 border-t-primary"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="badge-primary text-2xs uppercase tracking-wider font-semibold">
                  {segment.criteria}
                </span>
                <StatusBadge status={segment.status} />
              </div>

              <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                {segment.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                {segment.description}
              </p>

              {/* Progress bar of Base Share */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">Share of Total Base</span>
                  <span className="font-semibold text-gray-800">{segment.shareOfBase}%</span>
                </div>
                <ProgressBar value={segment.shareOfBase} size="sm" color="bg-primary" showLabel={false} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                <div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide block">Clients</span>
                  <span className="text-sm font-bold text-gray-800">{segment.customerCount}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide block">Avg Value</span>
                  <span className="text-sm font-bold text-primary truncate block">
                    {formatCurrency(segment.avgValue)}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {segment.tags && segment.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {segment.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      <Tag size={10} className="text-gray-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <span className="text-2xs text-gray-400">
                Updated {formatDate(segment.updatedAt)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewSegment(segment)}
                  className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                  title="View Segment Accounts"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => handleOpenEdit(segment)}
                  className="p-1.5 text-gray-500 hover:text-info hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Segment"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(segment)}
                  className="p-1.5 text-gray-500 hover:text-danger hover:bg-gray-100 rounded-lg transition-colors"
                  title="Delete Segment"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSegment ? 'Edit Customer Segment' : 'Create Customer Segment'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="customerSegments-submit-form" className="btn-primary">
              {editSegment ? 'Save Changes' : 'Create Segment'}
            </button>
          </>
        }
      >
        <form id="customerSegments-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerSegments-field-1" className="form-label">Segment Name *</label>
            <input id="customerSegments-field-1"
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Enterprise Life Sciences"
            />
          </div>

          <div>
            <label htmlFor="customerSegments-field-2" className="form-label">Description</label>
            <textarea id="customerSegments-field-2"
              rows={2}
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key criteria, account behavioral traits..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="customerSegments-field-3" className="form-label">Criteria Rule *</label>
              <input id="customerSegments-field-3"
                type="text"
                required
                className="form-input"
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                placeholder="e.g. Contract > 2M PKR"
              />
            </div>
            <div>
              <label htmlFor="customerSegments-field-4" className="form-label">Status</label>
              <select id="customerSegments-field-4"
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="customerSegments-field-5" className="form-label">Accounts</label>
              <input id="customerSegments-field-5"
                type="number"
                min="0"
                className="form-input"
                value={formData.customerCount}
                onChange={(e) => setFormData({ ...formData, customerCount: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="customerSegments-field-6" className="form-label">Share (%)</label>
              <input id="customerSegments-field-6"
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="form-input"
                value={formData.shareOfBase}
                onChange={(e) => setFormData({ ...formData, shareOfBase: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="customerSegments-field-7" className="form-label">Avg Value (PKR)</label>
              <input id="customerSegments-field-7"
                type="number"
                min="0"
                className="form-input"
                value={formData.avgValue}
                onChange={(e) => setFormData({ ...formData, avgValue: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="customerSegments-field-8" className="form-label">Tags (comma separated)</label>
            <input id="customerSegments-field-8"
              type="text"
              className="form-input"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g. Tier-1, Audit-Ready, GMP"
            />
          </div>
        </form>
      </Modal>

      {/* View Segment Accounts Modal */}
      {viewSegment && (
        <Modal
          isOpen={!!viewSegment}
          onClose={() => setViewSegment(null)}
          title={`Cohort: ${viewSegment.name}`}
          size="lg"
          footer={
            <button className="btn-secondary" onClick={() => setViewSegment(null)}>Close</button>
          }
        >
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-700 font-medium">Filter Criteria</p>
                <p className="text-sm font-semibold text-gray-800">{viewSegment.criteria}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Segment Accounts</p>
                <p className="text-lg font-bold text-gray-900">{viewSegment.customerCount}</p>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-700">Representative Clients in this Cohort:</p>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {[
                { name: 'Northwind Engineering Corp', rep: 'Marcus Lee', email: 'marcus.lee@northwind.com', val: 2400000 },
                { name: 'PharmaCare International Labs', rep: 'Dr. Tariq Bashir', email: 'tariq@pharmacare.pk', val: 3500000 },
                { name: 'Apex Industrial Instruments', rep: 'Nadia Khan', email: 'nadia@apexinstruments.pk', val: 1850000 },
                { name: 'National Heavy Industries', rep: 'Kamran Siddiqui', email: 'kamran@nationalheavy.pk', val: 2900000 },
              ].map((client, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.rep} • {client.email}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(client.val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Customer Segment"
        message={`Are you sure you want to delete segment "${deleteConfirm?.name}"? Accounts will revert to unclassified status.`}
      />
    </div>
  );
}
