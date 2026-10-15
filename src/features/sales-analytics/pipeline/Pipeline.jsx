import React, { useState, useMemo } from 'react';
import {
  GitBranch, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  DollarSign, ArrowRight, ArrowLeft, Building2, User, Clock,
  Layers, Filter, Search, Tag, Sparkles
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import ProgressBar from '../../../components/ui/ProgressBar';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { initialFullDeals } from '../../../data/salesAnalyticsData';
import { formatCurrency, formatDate, generateId } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';

const PIPELINE_STAGES = [
  { id: 'Lead', label: 'Lead', color: 'border-t-blue-500' },
  { id: 'Qualified', label: 'Qualified', color: 'border-t-indigo-500' },
  { id: 'Proposal', label: 'Proposal', color: 'border-t-purple-500' },
  { id: 'Negotiation', label: 'Negotiation', color: 'border-t-amber-500' },
  { id: 'Closed Won', label: 'Closed Won', color: 'border-t-emerald-500' },
];

export default function Pipeline() {
  const [deals, setDeals] = useLocalStorage('meridian-full-deals', initialFullDeals);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const addToast = useToast();

  // Search filter
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const q = searchQuery.toLowerCase();
    return deals.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.company?.toLowerCase().includes(q) ||
      d.contact?.toLowerCase().includes(q)
    );
  }, [deals, searchQuery]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contact: '',
    owner: 'Sarah Ahmed',
    value: 1200000,
    stage: 'Lead',
    probability: 30,
    expectedClose: '2026-11-30',
    tags: 'ISO 9001, Audit',
  });

  const handleOpenAdd = (defaultStage = 'Lead') => {
    setEditDeal(null);
    setFormData({
      name: '',
      company: '',
      contact: '',
      owner: 'Sarah Ahmed',
      value: 1500000,
      stage: defaultStage,
      probability: defaultStage === 'Closed Won' ? 100 : 40,
      expectedClose: '2026-11-30',
      tags: 'Quality Consulting',
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
      addToast('Pipeline deal updated!', 'success');
    } else {
      const newDeal = {
        id: `deal-${generateId()}`,
        ...formData,
        value: Number(formData.value),
        probability: Number(formData.probability),
        status: formData.stage === 'Closed Won' ? 'Won' : 'Active',
        tags: tagArray,
      };
      setDeals(prev => [newDeal, ...prev]);
      addToast('Deal inserted into pipeline stage!', 'success');
    }
    setModalOpen(false);
  };

  const handleMoveStage = (deal, direction) => {
    const curIdx = PIPELINE_STAGES.findIndex(s => s.id === deal.stage);
    if (curIdx === -1) return;
    const newIdx = curIdx + direction;
    if (newIdx >= 0 && newIdx < PIPELINE_STAGES.length) {
      const targetStage = PIPELINE_STAGES[newIdx].id;
      const targetProb = targetStage === 'Closed Won' ? 100 : Math.min(95, Math.max(10, (newIdx + 1) * 20));
      setDeals(prev =>
        prev.map(d =>
          d.id === deal.id
            ? {
                ...d,
                stage: targetStage,
                probability: targetProb,
                status: targetStage === 'Closed Won' ? 'Won' : 'Active',
              }
            : d
        )
      );
      addToast(`Moved to ${targetStage}!`, 'info');
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setDeals(prev => prev.filter(d => d.id !== deleteConfirm.id));
    addToast('Deal removed from pipeline.', 'success');
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    exportToCSV(
      deals,
      'meridian_sales_pipeline',
      [
        { key: 'name', label: 'Deal Name' },
        { key: 'company', label: 'Company' },
        { key: 'stage', label: 'Pipeline Stage' },
        { key: 'value', label: 'Value (PKR)' },
        { key: 'probability', label: 'Probability (%)' },
        { key: 'owner', label: 'Owner' },
      ]
    );
    addToast('Pipeline exported to CSV!', 'info');
  };

  // KPIs
  const totalPipeline = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonTotal = deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + (d.value || 0), 0);
  const wonCount = deals.filter(d => d.stage === 'Closed Won').length;
  const winRate = deals.length ? Math.round((wonCount / deals.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Visual Kanban pipeline tracking opportunities across consultation and audit closure stages."
        breadcrumbs={[
          { label: 'Sales Analytics', href: '/sales-analytics' },
          { label: 'Pipeline' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExport} />
            <button onClick={() => handleOpenAdd('Lead')} className="btn-primary">
              <Plus size={16} /> Add Opportunity
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Pipeline Value"
          value={formatCurrency(totalPipeline)}
          subtitle="All active stages"
          icon={DollarSign}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Won Contract Value"
          value={formatCurrency(wonTotal)}
          subtitle={`${wonCount} deals finalized`}
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Active Opportunities"
          value={deals.length}
          subtitle="Across 5 stages"
          icon={Layers}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Stage Velocity"
          value={`${winRate}%`}
          subtitle="Win conversion rate"
          icon={GitBranch}
          iconColor="bg-accent/10 text-accent"
        />
      </div>

      {/* Search Bar */}
      <div className="card p-3.5 mb-6">
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            className="form-input text-xs w-full sm:w-80"
            placeholder="Quick search pipeline deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="text-2xs text-gray-400 font-medium hidden sm:block">
            Showing {filteredDeals.length} opportunities
          </span>
        </div>
      </div>

      {/* Visual Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage, colIdx) => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div
              key={stage.id}
              className={`bg-gray-50/80 rounded-xl p-3 border border-gray-200 border-t-4 ${stage.color} flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200/80">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{stage.label}</h3>
                  <span className="text-[11px] font-semibold text-primary block mt-0.5">
                    {formatCurrency(stageTotal)}
                  </span>
                </div>
                <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-700 text-2xs font-bold flex items-center justify-center">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deal Cards in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    className="card p-3.5 hover:shadow-card transition-all bg-white flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                          {deal.name}
                        </h4>
                      </div>

                      <p className="text-2xs text-gray-500 font-medium mb-2">{deal.company}</p>

                      <div className="flex items-center justify-between text-xs py-1.5 border-y border-gray-50">
                        <span className="font-bold text-primary">{formatCurrency(deal.value)}</span>
                        <span className="text-2xs text-gray-400 font-medium">{deal.probability}% win</span>
                      </div>

                      {/* Tags */}
                      {deal.tags && deal.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {deal.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mover & Edit Actions */}
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <button
                          disabled={colIdx === 0}
                          onClick={() => handleMoveStage(deal, -1)}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20"
                          title="Move to previous stage"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          disabled={colIdx === PIPELINE_STAGES.length - 1}
                          onClick={() => handleMoveStage(deal, 1)}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20"
                          title="Move to next stage"
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(deal)}
                          className="p-1 text-gray-400 hover:text-info rounded"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(deal)}
                          className="p-1 text-gray-400 hover:text-danger rounded"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add deal to column button */}
              <button
                onClick={() => handleOpenAdd(stage.id)}
                className="mt-3 w-full py-2 border border-dashed border-gray-300 rounded-lg text-2xs text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={12} /> Add to {stage.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Deal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editDeal ? 'Edit Opportunity' : 'Insert Opportunity in Pipeline'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>Save Opportunity</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Opportunity Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. National Heavy Industries — QMS Rollout"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Account Company *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Key Contact</label>
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
              <label className="form-label">Value (PKR) *</label>
              <input
                type="number"
                min="0"
                required
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
                {PIPELINE_STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
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

          <div>
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove Opportunity"
        message={`Are you sure you want to remove "${deleteConfirm?.name}" from the pipeline?`}
      />
    </div>
  );
}
