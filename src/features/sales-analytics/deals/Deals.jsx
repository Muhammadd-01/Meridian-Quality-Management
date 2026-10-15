import React, { useState, useMemo } from 'react';
import {
  DollarSign, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  TrendingUp, Award, Clock, ArrowRight, Building2, User,
  Filter, Search, Layers, ChevronRight
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
import { initialFullDeals } from '../../../data/salesAnalyticsData';
import { formatCurrency, formatDate, generateId } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';

const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export default function Deals() {
  const [deals, setDeals] = useLocalStorage('meridian-full-deals', initialFullDeals);
  const [stageFilter, setStageFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [viewDeal, setViewDeal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(deals, ['name', 'company', 'contact', 'owner', 'notes']);

  // Filters
  const filteredDeals = useMemo(() => {
    if (stageFilter === 'All') return searchFiltered;
    return searchFiltered.filter(d => d.stage === stageFilter);
  }, [searchFiltered, stageFilter]);

  // Pagination
  const pagination = usePagination(filteredDeals, 8);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contact: '',
    owner: 'Sarah Ahmed',
    value: 1500000,
    stage: 'Proposal',
    probability: 60,
    expectedClose: '2026-11-30',
    status: 'Active',
    tags: 'ISO 9001, Quality',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditDeal(null);
    setFormData({
      name: '',
      company: '',
      contact: '',
      owner: 'Sarah Ahmed',
      value: 1800000,
      stage: 'Qualified',
      probability: 50,
      expectedClose: '2026-11-30',
      status: 'Active',
      tags: 'ISO 9001, Consulting',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (deal) => {
    setEditDeal(deal);
    setFormData({
      ...deal,
      tags: Array.isArray(deal.tags) ? deal.tags.join(', ') : deal.tags,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editDeal) {
      setDeals(prev =>
        prev.map(d =>
          d.id === editDeal.id
            ? {
                ...formData,
                value: Number(formData.value),
                probability: Number(formData.probability),
                tags: tagArray,
              }
            : d
        )
      );
      addToast('Deal record updated!', 'success');
    } else {
      const newDeal = {
        id: `deal-${generateId()}`,
        ...formData,
        value: Number(formData.value),
        probability: Number(formData.probability),
        tags: tagArray,
      };
      setDeals(prev => [newDeal, ...prev]);
      addToast('Deal successfully created!', 'success');
    }
    setModalOpen(false);
  };

  const handleAdvanceStage = (deal) => {
    const curIdx = stages.indexOf(deal.stage);
    if (curIdx < stages.length - 2) {
      const nextStage = stages[curIdx + 1];
      const nextProb = nextStage === 'Closed Won' ? 100 : Math.min(95, deal.probability + 20);
      setDeals(prev =>
        prev.map(d =>
          d.id === deal.id
            ? { ...d, stage: nextStage, probability: nextProb, status: nextStage === 'Closed Won' ? 'Won' : 'Active' }
            : d
        )
      );
      addToast(`Deal advanced to ${nextStage}!`, 'success');
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setDeals(prev => prev.filter(d => d.id !== deleteConfirm.id));
    addToast('Deal deleted.', 'success');
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    exportToCSV(
      deals,
      'meridian_sales_deals',
      [
        { key: 'name', label: 'Deal Name' },
        { key: 'company', label: 'Company' },
        { key: 'contact', label: 'Contact' },
        { key: 'owner', label: 'Owner' },
        { key: 'value', label: 'Value (PKR)' },
        { key: 'stage', label: 'Stage' },
        { key: 'probability', label: 'Probability (%)' },
        { key: 'expectedClose', label: 'Close Date' },
      ]
    );
    addToast('Deals exported to CSV!', 'info');
  };

  // KPIs
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedPipeline = deals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);
  const wonRevenue = deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + (d.value || 0), 0);
  const avgProb = deals.length ? Math.round(deals.reduce((acc, d) => acc + (d.probability || 0), 0) / deals.length) : 0;

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Manage deal stages, contract probability, weighted sales forecast, and account pipeline."
        breadcrumbs={[
          { label: 'Sales Analytics', href: '/sales-analytics' },
          { label: 'Deals' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExport} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Deal
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Deals Pipeline"
          value={formatCurrency(totalValue)}
          subtitle={`${deals.length} active opportunities`}
          icon={DollarSign}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Weighted Forecast"
          value={formatCurrency(Math.round(weightedPipeline))}
          subtitle="Probability weighted"
          icon={TrendingUp}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Closed Won Revenue"
          value={formatCurrency(wonRevenue)}
          subtitle="Secured contracts"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Avg Win Probability"
          value={`${avgProb}%`}
          subtitle="Portfolio confidence"
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
              placeholder="Search deal, company, owner..."
            />
          </div>
          <div className="flex items-center gap-3">
            <FilterDropdown
              value={stageFilter}
              onChange={setStageFilter}
              options={[
                { value: 'All', label: 'All Stages' },
                ...stages.map(s => ({ value: s, label: s }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="card mb-6 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal & Account</th>
                <th>Contract Value</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Close Date</th>
                <th>Owner</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedData.map(d => (
                <tr key={d.id}>
                  <td className="max-w-xs">
                    <p className="font-semibold text-xs text-gray-900 truncate">{d.name}</p>
                    <p className="text-2xs text-gray-500">{d.company} • {d.contact}</p>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-primary">
                      {formatCurrency(d.value)}
                    </span>
                  </td>
                  <td><StatusBadge status={d.stage} /></td>
                  <td className="w-28">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 w-8">{d.probability}%</span>
                      <ProgressBar value={d.probability} size="sm" showLabel={false} color={d.probability > 75 ? 'bg-success' : 'bg-primary'} />
                    </div>
                  </td>
                  <td><span className="text-xs text-gray-600 font-medium">{formatDate(d.expectedClose)}</span></td>
                  <td><span className="text-xs text-gray-700">{d.owner}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {d.stage !== 'Closed Won' && d.stage !== 'Closed Lost' && (
                        <button
                          onClick={() => handleAdvanceStage(d)}
                          className="p-1 text-primary hover:bg-primary/10 rounded"
                          title="Advance Stage"
                        >
                          <ChevronRight size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setViewDeal(d)}
                        className="p-1 text-gray-400 hover:text-primary rounded"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1 text-gray-400 hover:text-info rounded"
                        title="Edit Deal"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(d)}
                        className="p-1 text-gray-400 hover:text-danger rounded"
                        title="Delete Deal"
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
        title={editDeal ? 'Edit Deal' : 'Create Sales Deal'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editDeal ? 'Save Changes' : 'Create Deal'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Deal Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apex Industrial — ISO 9001 Full Rollout"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Client Company *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Contract Value (PKR)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Stage</label>
              <select
                className="form-select"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              >
                {stages.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Deal Owner</label>
              <input
                type="text"
                className="form-input"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Expected Close Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.expectedClose}
                onChange={(e) => setFormData({ ...formData, expectedClose: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Notes & Scope</label>
            <textarea
              rows={2}
              className="form-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* View Deal Modal */}
      {viewDeal && (
        <Modal
          isOpen={!!viewDeal}
          onClose={() => setViewDeal(null)}
          title={viewDeal.name}
          size="md"
          footer={
            <button className="btn-secondary" onClick={() => setViewDeal(null)}>Close</button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-2xs text-gray-400 uppercase tracking-wide block">Organization</span>
                <span className="text-sm font-bold text-gray-900">{viewDeal.company}</span>
                <span className="text-xs text-gray-500 block">Contact: {viewDeal.contact}</span>
              </div>
              <StatusBadge status={viewDeal.stage} />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 block">Contract Value</span>
                <span className="font-bold text-primary text-sm">{formatCurrency(viewDeal.value)}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Close Probability</span>
                <span className="font-bold text-gray-800 text-sm">{viewDeal.probability}%</span>
              </div>
              <div>
                <span className="text-gray-400 block">Target Close</span>
                <span className="font-medium text-gray-700">{formatDate(viewDeal.expectedClose)}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Account Owner</span>
                <span className="font-medium text-gray-700">{viewDeal.owner}</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="text-gray-400 block mb-1">Scope & Key Notes:</span>
              <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{viewDeal.notes || 'No notes logged.'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Deal"
        message={`Are you sure you want to remove deal "${deleteConfirm?.name}"?`}
      />
    </div>
  );
}
