import React, { useState, useMemo } from 'react';
import {
  Target, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  DollarSign, TrendingUp, Mail, Phone, Building2, User,
  ArrowRight, ShieldCheck, Filter, Search, Award, GitBranch, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDays, format } from 'date-fns';
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
import InfoTip from '../../../components/ui/InfoTip';
import { scoreLead, findDuplicateLeads, LEAD_SCORING_RULES } from '../../../utils/leadScoring';
import { initialLeads, leadSources, leadStatuses } from '../../../data/leads';
import { formatCurrency, formatDate, generateId, formatNumber } from '../../../utils/format';

export default function Leads() {
  const [leads, setLeads] = useLocalStorage('meridian-leads', initialLeads);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [deals, setDeals] = useCollection('deals');
  const addToast = useToast();

  const gradeStyles = { Hot: 'badge-danger', Warm: 'badge-warning', Cold: 'badge-info' };
  const scoringHelp = `Rule-based score (0-100). ${LEAD_SCORING_RULES.map(r => `${r.factor}: ${r.points}`).join('. ')}. Hot >= 70, Warm >= 45.`;

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
    setDuplicateMatches([]);
    setAllowDuplicate(false);
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (l) => {
    setEditLead(l);
    setFormData({ ...l });
    setDuplicateMatches([]);
    setAllowDuplicate(false);
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Duplicate detection: same email, or same contact name at the same company.
    const dups = findDuplicateLeads(formData, leads, editLead?.id);
    if (dups.length && !allowDuplicate) {
      setDuplicateMatches(dups);
      return;
    }
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

  // Lead -> deal conversion: creates a deal in the shared Deals/Pipeline collection
  // and links it back to the lead so it cannot be converted twice.
  const handleConvertToDeal = () => {
    const lead = convertTarget;
    if (!lead) return;
    const dealId = `deal-${generateId()}`;
    const deal = {
      id: dealId,
      name: `${lead.company} — ${lead.contactName}`,
      company: lead.company,
      contact: lead.contactName,
      owner: lead.assignedTo,
      value: Number(lead.dealValue) || 0,
      stage: 'Qualified',
      probability: 40,
      expectedClose: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      status: 'Active',
      tags: ['From lead', lead.source].filter(Boolean),
      notes: lead.notes || '',
      sourceLeadId: lead.id,
    };
    setDeals(prev => [deal, ...prev]);
    setLeads(prev => prev.map(l => (l.id === lead.id
      ? { ...l, status: ['New', 'Contacted'].includes(l.status) ? 'Qualified' : l.status, convertedDealId: dealId }
      : l)));
    setConvertTarget(null);
    addToast(`Deal created for ${lead.company}. Find it in Deals and the Pipeline.`, 'success', 4000);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setLeads(prev => prev.filter(l => l.id !== deleteConfirm.id));
    addToast('Lead removed.', 'success');
    setDeleteConfirm(null);
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
          { label: 'Website Analytics', href: '/sales-analytics' },
          { label: 'Leads' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="leads" records={leads} setRecords={setLeads} filtered={filteredLeads} />
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
                <th><span className="inline-flex items-center gap-1">Score <InfoTip text={scoringHelp} /></span></th>
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
                  <td>
                    {(() => {
                      const { score, grade } = scoreLead(l);
                      return (
                        <span className="inline-flex items-center gap-1.5" title={`Lead score ${score}/100 (${grade})`}>
                          <span className="text-xs font-bold text-gray-800 tabular-nums">{score}</span>
                          <span className={`${gradeStyles[grade]} text-2xs`}>{grade}</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td><span className="text-2xs text-gray-500">{formatDate(l.lastContact)}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {l.convertedDealId ? (
                        <Link
                          to={`/sales-analytics/deals?q=${encodeURIComponent(deals.find(d => d.id === l.convertedDealId)?.name || l.company)}`}
                          className="p-1 text-primary hover:bg-primary/10 rounded"
                          title="View converted deal"
                          aria-label={`View deal converted from ${l.contactName}`}
                        >
                          <GitBranch size={14} />
                        </Link>
                      ) : l.status !== 'Lost' && (
                        <button
                          onClick={() => setConvertTarget(l)}
                          className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded"
                          title="Convert to deal"
                          aria-label={`Convert ${l.contactName} to a deal`}
                        >
                          <GitBranch size={14} />
                        </button>
                      )}
                      {l.status !== 'Won' && (
                        <button
                          onClick={() => handleConvertToWon(l)}
                          className="p-1 text-success hover:bg-success/10 rounded"
                          title="Convert to Won"
                          aria-label={`Mark ${l.contactName} as won`}
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setViewLead(l)}
                        className="p-1 text-gray-400 hover:text-primary rounded"
                        title="View Details"
                        aria-label={`View ${l.contactName}`}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(l)}
                        className="p-1 text-gray-400 hover:text-info rounded"
                        title="Edit Lead"
                        aria-label={`Edit ${l.contactName}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(l)}
                        className="p-1 text-gray-400 hover:text-danger rounded"
                        title="Delete Lead"
                        aria-label={`Delete ${l.contactName}`}
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
        pageSize={pagination.pageSize}
        onPageSizeChange={pagination.setPageSize}
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
            <button type="submit" form="leads-submit-form" className="btn-primary">
              {editLead ? 'Save Changes' : 'Create Lead'}
            </button>
          </>
        }
      >
        <form id="leads-submit-form" onSubmit={handleSubmit} className="space-y-4">
          {duplicateMatches.length > 0 && (
            <div role="alert" className="p-3 rounded-lg border border-accent-200 bg-accent-50 text-xs text-secondary-700 space-y-2">
              <p className="flex items-center gap-1.5 font-semibold text-accent-600">
                <AlertTriangle size={14} aria-hidden="true" /> Possible duplicate — {duplicateMatches.length} existing lead(s) match
              </p>
              <ul className="list-disc pl-5">
                {duplicateMatches.map(d => <li key={d.id}>{d.contactName} · {d.company} · {d.email} ({d.status})</li>)}
              </ul>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={allowDuplicate} onChange={(e) => setAllowDuplicate(e.target.checked)} className="accent-[#2C5F6F]" />
                This is a different lead — save anyway
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="leads-field-1" className="form-label">Contact Name *</label>
              <input id="leads-field-1"
                type="text"
                required
                className="form-input"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Muhammad Azhar"
              />
            </div>
            <div>
              <label htmlFor="leads-field-2" className="form-label">Company / Account *</label>
              <input id="leads-field-2"
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
              <label htmlFor="leads-field-3" className="form-label">Email *</label>
              <input id="leads-field-3"
                type="email"
                required
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="leads-field-4" className="form-label">Phone</label>
              <input id="leads-field-4"
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="leads-field-5" className="form-label">Lead Source</label>
              <select id="leads-field-5"
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
              <label htmlFor="leads-field-6" className="form-label">Pipeline Status</label>
              <select id="leads-field-6"
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
              <label htmlFor="leads-field-7" className="form-label">Value (PKR)</label>
              <input id="leads-field-7"
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
              <label htmlFor="leads-field-8" className="form-label">Assigned Consultant</label>
              <input id="leads-field-8"
                type="text"
                className="form-input"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="leads-field-9" className="form-label">Last Contact</label>
              <input id="leads-field-9"
                type="date"
                className="form-input"
                value={formData.lastContact}
                onChange={(e) => setFormData({ ...formData, lastContact: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="leads-field-10" className="form-label">Discovery Notes</label>
            <textarea id="leads-field-10"
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

            {(() => {
              const { score, grade, breakdown } = scoreLead(viewLead);
              return (
                <div className="text-xs border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Lead score</span>
                    <span className="flex items-center gap-1.5"><strong className="text-gray-800 text-sm">{score}/100</strong><span className={gradeStyles[grade]}>{grade}</span></span>
                  </div>
                  <ul className="space-y-1">
                    {breakdown.map(b => (
                      <li key={b.factor} className="flex justify-between text-gray-600"><span>{b.factor} <span className="text-gray-400">({b.detail})</span></span><span className="font-semibold">+{b.points}</span></li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            <div className="text-xs">
              <span className="text-gray-400 block mb-1">Discovery Notes:</span>
              <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{viewLead.notes || 'No notes logged.'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Convert to Deal */}
      <ConfirmDialog
        isOpen={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={handleConvertToDeal}
        title="Convert lead to deal"
        message={convertTarget ? `Create a Qualified deal for ${convertTarget.company} worth ${formatCurrency(Number(convertTarget.dealValue) || 0)}, owned by ${convertTarget.assignedTo}? The lead stays in your list and links to the new deal.` : ''}
        confirmLabel="Create Deal"
        variant="primary"
      />

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
