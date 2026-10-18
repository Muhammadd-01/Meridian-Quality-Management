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
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useQuickAction from '../../../hooks/useQuickAction';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { initialFullDeals } from '../../../data/salesAnalyticsData';
import { formatCurrency, formatDate, generateId } from '../../../utils/format';

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
  const [urlParams] = useSearchParams();
  // Global search links open this page with ?q=<deal name>
  const [searchQuery, setSearchQuery] = useState(() => urlParams.get('q') || '');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [closeFrom, setCloseFrom] = useState('');
  const [closeTo, setCloseTo] = useState('');
  const [dragOverStage, setDragOverStage] = useState(null);
  const addToast = useToast();

  const owners = useMemo(() => Array.from(new Set(deals.map(d => d.owner).filter(Boolean))).sort(), [deals]);

  // Search + filters (owner, status, expected close date)
  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return deals.filter(d => {
      if (q && !(d.name?.toLowerCase().includes(q) || d.company?.toLowerCase().includes(q) || d.contact?.toLowerCase().includes(q))) return false;
      if (ownerFilter !== 'All' && d.owner !== ownerFilter) return false;
      if (statusFilter !== 'All' && d.status !== statusFilter) return false;
      if (closeFrom && (!d.expectedClose || d.expectedClose < closeFrom)) return false;
      if (closeTo && (!d.expectedClose || d.expectedClose > closeTo)) return false;
      return true;
    });
  }, [deals, searchQuery, ownerFilter, statusFilter, closeFrom, closeTo]);

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

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', () => handleOpenAdd('Lead'));

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

  // Drag-and-drop: drop a deal card on another stage column.
  const handleDropOnStage = (dealId, targetStage) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;
    const targetIdx = PIPELINE_STAGES.findIndex(s => s.id === targetStage);
    const targetProb = targetStage === 'Closed Won' ? 100 : Math.min(95, Math.max(10, (targetIdx + 1) * 20));
    setDeals(prev => prev.map(d => (d.id === dealId
      ? { ...d, stage: targetStage, probability: targetProb, status: targetStage === 'Closed Won' ? 'Won' : 'Active' }
      : d)));
    addToast(`Moved to ${targetStage}!`, 'info');
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setDeals(prev => prev.filter(d => d.id !== deleteConfirm.id));
    addToast('Deal removed from pipeline.', 'success');
    setDeleteConfirm(null);
  };

  // KPIs (calculated on the filtered view)
  const openDeals = filteredDeals.filter(d => !String(d.stage).startsWith('Closed'));
  const lostDeals = filteredDeals.filter(d => d.stage === 'Closed Lost');
  const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0) * (d.probability || 0) / 100, 0);
  const wonTotal = filteredDeals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + (d.value || 0), 0);
  const wonCount = filteredDeals.filter(d => d.stage === 'Closed Won').length;
  const lostTotal = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const decided = wonCount + lostDeals.length;
  const winRate = decided ? Math.round((wonCount / decided) * 100) : 0;

  // Stage conversion: share of (non-lost) deals that reached each stage or beyond.
  const nonLost = filteredDeals.filter(d => d.stage !== 'Closed Lost');
  const stageReach = PIPELINE_STAGES.map((st, idx) => {
    const reached = nonLost.filter(d => PIPELINE_STAGES.findIndex(s => s.id === d.stage) >= idx).length;
    return { stage: st.label, reached, pct: nonLost.length ? Math.round((reached / nonLost.length) * 100) : 0 };
  });
  const filtersActive = ownerFilter !== 'All' || statusFilter !== 'All' || closeFrom || closeTo || searchQuery;

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
            <DataTransferActions entityType="deals" records={deals} filtered={filteredDeals} exportOnly />
            <button onClick={() => handleOpenAdd('Lead')} className="btn-primary">
              <Plus size={16} /> Add Opportunity
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Open Pipeline Value"
          value={formatCurrency(totalPipeline)}
          subtitle={`${formatCurrency(Math.round(weightedPipeline))} weighted`}
          icon={DollarSign}
          iconColor="bg-primary/10 text-primary"
          info="Σ value of deals not yet Closed Won/Lost. Weighted = Σ value × probability ÷ 100."
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
          value={openDeals.length}
          subtitle={`${lostDeals.length} lost · ${formatCurrency(lostTotal)}`}
          icon={Layers}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Win Rate"
          value={`${winRate}%`}
          subtitle={`${wonCount} won of ${decided} closed`}
          icon={GitBranch}
          iconColor="bg-accent/10 text-accent"
          info="Closed Won ÷ (Closed Won + Closed Lost). Open deals are excluded."
        />
      </div>

      {/* Search & Filters */}
      <div className="card p-3.5 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="text"
            className="form-input text-xs w-full sm:w-64"
            placeholder="Quick search pipeline deals..."
            aria-label="Search pipeline deals"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="form-select text-xs !w-auto" aria-label="Filter by owner" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="All">All owners</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="form-select text-xs !w-auto" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {['Active', 'At Risk', 'Won', 'Lost'].map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <label className="text-[11px] text-gray-500">Close from<input type="date" className="form-input !py-1.5 text-xs mt-0.5 !w-36" value={closeFrom} onChange={(e) => setCloseFrom(e.target.value)} /></label>
          <label className="text-[11px] text-gray-500">to<input type="date" className="form-input !py-1.5 text-xs mt-0.5 !w-36" value={closeTo} onChange={(e) => setCloseTo(e.target.value)} /></label>
          {filtersActive && (
            <button type="button" className="btn-secondary btn-sm" onClick={() => { setSearchQuery(''); setOwnerFilter('All'); setStatusFilter('All'); setCloseFrom(''); setCloseTo(''); }}>Reset</button>
          )}
          <span className="text-2xs text-gray-400 font-medium ml-auto">
            Showing {filteredDeals.length} of {deals.length} opportunities
          </span>
        </div>
      </div>

      {/* Stage conversion */}
      <div className="card p-3.5 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
          Stage conversion <span className="normal-case font-normal tracking-normal">· share of open and won deals that reached each stage (lost deals excluded — their last stage is not recorded)</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {stageReach.map(s => (
            <div key={s.stage}>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{s.stage}</span><span className="font-semibold tabular-nums">{s.pct}%</span></div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${s.pct}%` }} /></div>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.reached} deal(s)</p>
            </div>
          ))}
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
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverStage !== stage.id) setDragOverStage(stage.id); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverStage(null); }}
              onDrop={(e) => { e.preventDefault(); setDragOverStage(null); handleDropOnStage(e.dataTransfer.getData('text/plain'), stage.id); }}
              aria-label={`${stage.label} stage, ${stageDeals.length} deals`}
              className={`bg-gray-50/80 rounded-xl p-3 border border-gray-200 border-t-4 ${stage.color} flex flex-col min-h-[500px] transition-colors ${dragOverStage === stage.id ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
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
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', deal.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => setDragOverStage(null)}
                    className="card p-3.5 hover:shadow-card transition-all bg-white flex flex-col justify-between group cursor-grab active:cursor-grabbing"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                          <Link to={`/sales-analytics/deals?q=${encodeURIComponent(deal.name)}`} className="hover:underline" draggable={false}>
                            {deal.name}
                          </Link>
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
                          aria-label={`Move ${deal.name} to previous stage`}
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          disabled={colIdx === PIPELINE_STAGES.length - 1}
                          onClick={() => handleMoveStage(deal, 1)}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20"
                          title="Move to next stage"
                          aria-label={`Move ${deal.name} to next stage`}
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(deal)}
                          className="p-1 text-gray-400 hover:text-info rounded"
                          title="Edit"
                          aria-label={`Edit ${deal.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(deal)}
                          className="p-1 text-gray-400 hover:text-danger rounded"
                          title="Delete"
                          aria-label={`Delete ${deal.name}`}
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
            <button type="submit" form="pipeline-submit-form" className="btn-primary">Save Opportunity</button>
          </>
        }
      >
        <form id="pipeline-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pipeline-field-1" className="form-label">Opportunity Name *</label>
            <input id="pipeline-field-1"
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
              <label htmlFor="pipeline-field-2" className="form-label">Account Company *</label>
              <input id="pipeline-field-2"
                type="text"
                required
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pipeline-field-3" className="form-label">Key Contact</label>
              <input id="pipeline-field-3"
                type="text"
                className="form-input"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="pipeline-field-4" className="form-label">Value (PKR) *</label>
              <input id="pipeline-field-4"
                type="number"
                min="0"
                required
                className="form-input"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pipeline-field-5" className="form-label">Stage</label>
              <select id="pipeline-field-5"
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
              <label htmlFor="pipeline-field-6" className="form-label">Probability (%)</label>
              <input id="pipeline-field-6"
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
            <label htmlFor="pipeline-field-7" className="form-label">Tags (comma separated)</label>
            <input id="pipeline-field-7"
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
