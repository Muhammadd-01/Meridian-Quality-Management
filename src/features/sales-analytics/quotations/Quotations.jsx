import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  Printer, DollarSign, Calendar, Building2, User, FileText,
  AlertCircle, Clock, ShieldCheck, X
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
import { printQuotation, quotationAmounts } from '../../../utils/quotationPrint';

const todayKey = () => new Date().toISOString().slice(0, 10);
// "Expired" is derived: a sent quotation whose validity date has passed.
const displayStatus = (q) => (q.status === 'Sent' && q.expiryDate && q.expiryDate < todayKey() ? 'Expired' : q.status);
const NEXT_STATUSES = { Draft: ['Sent'], Sent: ['Accepted', 'Declined'], Accepted: [], Declined: ['Draft'] };
import { initialQuotations } from '../../../data/salesAnalyticsData';
import { formatCurrency, formatDate, generateId } from '../../../utils/format';

export default function Quotations() {
  const [quotations, setQuotations] = useLocalStorage('meridian-quotations', initialQuotations);
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewQuote, setViewQuote] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(quotations, ['quoteNumber', 'customer', 'relatedDeal', 'preparedBy']);

  // Filters
  const filteredQuotations = useMemo(() => {
    if (statusFilter === 'All') return searchFiltered;
    return searchFiltered.filter(q => displayStatus(q).toLowerCase() === statusFilter.toLowerCase());
  }, [searchFiltered, statusFilter]);

  // Pagination
  const pagination = usePagination(filteredQuotations, 8);

  // Form State
  const [formData, setFormData] = useState({
    quoteNumber: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: 'Cascade Retail Grp',
    relatedDeal: 'Cascade Retail Grp — ISO 9001 Renewal',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-11-30',
    preparedBy: 'Sarah Ahmed',
    status: 'Sent',
    discountPercent: 5,
    taxPercent: 10,
    notes: 'Valid for 30 calendar days. 50% advance on contract execution.',
    lineItems: [
      { id: 1, description: 'ISO 9001:2015 Pre-Audit Assessment & Gap Report', quantity: 1, unitPrice: 850000, total: 850000 },
      { id: 2, description: 'Internal Quality Auditor Certification Workshop (20 Staff)', quantity: 1, unitPrice: 400000, total: 400000 },
    ],
  });

  const handleOpenAdd = () => {
    setFormData({
      quoteNumber: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: 'Cascade Retail Grp',
      relatedDeal: 'ISO 9001 Consulting Package',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '2026-11-30',
      preparedBy: 'Sarah Ahmed',
      status: 'Sent',
      discountPercent: 5,
      taxPercent: 10,
      notes: 'Valid for 30 calendar days. 50% advance upon contract signing.',
      lineItems: [
        { id: 1, description: 'ISO 9001:2015 Pre-Audit Assessment & Gap Report', quantity: 1, unitPrice: 850000, total: 850000 },
        { id: 2, description: 'Internal Quality Auditor Certification Workshop (20 Staff)', quantity: 1, unitPrice: 400000, total: 400000 },
      ],
    });
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: Date.now(), description: 'New Scope Item', quantity: 1, unitPrice: 200000, total: 200000 }
      ]
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...formData.lineItems];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[index].quantity) || 0;
      const p = Number(updated[index].unitPrice) || 0;
      updated[index].total = q * p;
    }
    setFormData({ ...formData, lineItems: updated });
  };

  const handleRemoveLineItem = (index) => {
    if (formData.lineItems.length <= 1) return;
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  // Compute Totals
  const subtotal = formData.lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
  const discountAmount = (subtotal * (Number(formData.discountPercent) || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (Number(formData.taxPercent) || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newQuote = {
      id: `quote-${generateId()}`,
      ...formData,
      subtotal,
      discountPercent: Number(formData.discountPercent),
      taxPercent: Number(formData.taxPercent),
      total: grandTotal,
    };
    setQuotations(prev => [newQuote, ...prev]);
    addToast(`Quotation ${newQuote.quoteNumber} issued successfully!`, 'success');
    setModalOpen(false);
  };

  // Status workflow with history (Draft → Sent → Accepted / Declined).
  const handleChangeStatus = (quote, status) => {
    const entry = { status, at: new Date().toISOString() };
    setQuotations(prev => prev.map(q => (q.id === quote.id
      ? { ...q, status, history: [...(q.history || []), entry] }
      : q)));
    setViewQuote(v => (v && v.id === quote.id ? { ...v, status, history: [...(v.history || []), entry] } : v));
    addToast(`${quote.quoteNumber} marked as ${status}.`, 'success');
  };

  const handlePrint = (quote) => {
    if (!printQuotation(quote)) addToast('The print window was blocked. Allow pop-ups to print or save as PDF.', 'error', 5000);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setQuotations(prev => prev.filter(q => q.id !== deleteConfirm.id));
    addToast(`Quotation ${deleteConfirm.quoteNumber} removed.`, 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const totalValue = quotations.reduce((sum, q) => sum + (q.total || 0), 0);
  const acceptedValue = quotations.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + (q.total || 0), 0);
  const sentCount = quotations.filter(q => q.status === 'Sent').length;
  const acceptedCount = quotations.filter(q => q.status === 'Accepted').length;

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Manage commercial consulting fee estimates, audit quotations, and line-item scopes of work."
        breadcrumbs={[
          { label: 'Website Analytics', href: '/sales-analytics' },
          { label: 'Quotations' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="quotations" records={quotations} setRecords={setQuotations} filtered={filteredQuotations} />
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Create Quotation
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Issued Quotes"
          value={quotations.length}
          subtitle="All generated estimates"
          icon={FileSpreadsheet}
          iconColor="bg-primary-100 text-brand"
        />
        <StatCard
          title="Accepted Proposals"
          value={acceptedCount}
          subtitle={`Worth ${formatCurrency(acceptedValue)}`}
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Awaiting Decision"
          value={sentCount}
          subtitle="Proposals currently pending"
          icon={Clock}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Total Quote Portfolio"
          value={formatCurrency(totalValue)}
          subtitle="Cumulative commercial value"
          icon={DollarSign}
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
              placeholder="Search quote #, customer, author..."
            />
          </div>
          <div className="flex items-center gap-3">
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Sent', label: 'Sent' },
                { value: 'Accepted', label: 'Accepted' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Declined', label: 'Declined' },
                { value: 'Expired', label: 'Expired' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="card mb-6 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote Number</th>
                <th>Client & Project Scope</th>
                <th>Issue Date</th>
                <th>Valid Until</th>
                <th>Subtotal</th>
                <th>Total (PKR)</th>
                <th>Status</th>
                <th>Prepared By</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedData.map(q => (
                <tr key={q.id}>
                  <td>
                    <span className="font-mono font-bold text-xs text-brand">{q.quoteNumber}</span>
                  </td>
                  <td className="max-w-xs">
                    <p className="font-semibold text-xs text-gray-900">{q.customer}</p>
                    <p className="text-2xs text-gray-500 truncate">{q.relatedDeal}</p>
                  </td>
                  <td><span className="text-xs text-gray-600">{formatDate(q.issueDate)}</span></td>
                  <td><span className="text-xs text-gray-600">{formatDate(q.expiryDate)}</span></td>
                  <td><span className="text-xs text-gray-500">{formatCurrency(q.subtotal)}</span></td>
                  <td>
                    <span className="text-xs font-bold text-gray-900">
                      {formatCurrency(q.total)}
                    </span>
                  </td>
                  <td><StatusBadge status={displayStatus(q)} /></td>
                  <td><span className="text-xs text-gray-700">{q.preparedBy}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewQuote(q)}
                        className="p-1 text-gray-400 hover:text-brand rounded"
                        title="View Formal Quotation"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(q)}
                        className="p-1 text-gray-400 hover:text-danger rounded"
                        title="Delete Quote"
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

      {/* Create Quotation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Quality Consulting Quotation"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="quotations-submit-form" className="btn-primary">Issue Quotation</button>
          </>
        }
      >
        <form id="quotations-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quotations-field-1" className="form-label">Quote Number</label>
              <input id="quotations-field-1" type="text" readOnly className="form-input bg-gray-50 font-mono" value={formData.quoteNumber} />
            </div>
            <div>
              <label htmlFor="quotations-field-2" className="form-label">Client Organization *</label>
              <input id="quotations-field-2"
                type="text"
                required
                className="form-input"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="quotations-field-3" className="form-label">Related Project / Deal *</label>
            <input id="quotations-field-3"
              type="text"
              required
              className="form-input"
              value={formData.relatedDeal}
              onChange={(e) => setFormData({ ...formData, relatedDeal: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="quotations-field-4" className="form-label">Issue Date</label>
              <input id="quotations-field-4"
                type="date"
                className="form-input"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="quotations-field-5" className="form-label">Valid Until</label>
              <input id="quotations-field-5"
                type="date"
                className="form-input"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="quotations-field-6" className="form-label">Consultant / Author</label>
              <input id="quotations-field-6"
                type="text"
                className="form-input"
                value={formData.preparedBy}
                onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Scope Line Items *</label>
              <button type="button" onClick={handleAddLineItem} className="text-xs text-brand font-semibold hover:underline">
                + Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2.5 bg-gray-50/50">
              {formData.lineItems.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <input
                      type="text"
                      required
                      placeholder="Item description"
                      className="form-input text-xs"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      className="form-input text-xs"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Unit Price"
                      className="form-input text-xs"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="text-gray-400 hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
            <div>
              <label htmlFor="quotations-field-7" className="form-label">Discount (%)</label>
              <input id="quotations-field-7"
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="quotations-field-8" className="form-label">Sales Tax (%)</label>
              <input id="quotations-field-8"
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.taxPercent}
                onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Calculated Grand Total:</span>
            <span className="text-brand text-base">{formatCurrency(grandTotal)}</span>
          </div>
        </form>
      </Modal>

      {/* View Printable Quotation Modal */}
      {viewQuote && (
        <Modal
          isOpen={!!viewQuote}
          onClose={() => setViewQuote(null)}
          title={`Quotation: ${viewQuote.quoteNumber}`}
          size="lg"
          footer={
            <div className="flex flex-wrap justify-between w-full items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {(NEXT_STATUSES[viewQuote.status] || []).map(st => (
                  <button
                    key={st}
                    type="button"
                    className={st === 'Declined' ? 'btn-outline btn-sm text-danger' : 'btn-outline btn-sm'}
                    onClick={() => handleChangeStatus(viewQuote, st)}
                  >
                    {st === 'Draft' ? 'Reopen as Draft' : `Mark ${st}`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-outline btn-sm" onClick={() => handlePrint(viewQuote)}>
                  <Printer size={14} aria-hidden="true" /> Print / PDF
                </button>
                <button className="btn-secondary" onClick={() => setViewQuote(null)}>Close</button>
              </div>
            </div>
          }
        >
          <div className="p-4 space-y-6 bg-white border border-gray-100 rounded-xl">
            {/* Header info */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Meridian Quality Management</h3>
                <p className="text-xs text-gray-500">ISO 9001 / Six Sigma / GMP Advisory Services</p>
                <p className="text-xs text-gray-500">Karachi, Islamabad, Lahore</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold text-brand block">{viewQuote.quoteNumber}</span>
                <span className="mt-1 inline-block"><StatusBadge status={displayStatus(viewQuote)} /></span>
              </div>
            </div>

            {/* Billed To / Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Proposal For:</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{viewQuote.customer}</p>
                <p className="text-gray-500">{viewQuote.relatedDeal}</p>
              </div>
              <div className="text-right">
                <p><span className="text-gray-400">Issue Date:</span> <strong className="text-gray-800">{formatDate(viewQuote.issueDate)}</strong></p>
                <p><span className="text-gray-400">Valid Until:</span> <strong className="text-gray-800">{formatDate(viewQuote.expiryDate)}</strong></p>
                <p><span className="text-gray-400">Author:</span> <strong className="text-gray-800">{viewQuote.preparedBy}</strong></p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-2.5 text-left">Description</th>
                    <th className="p-2.5 text-center w-16">Qty</th>
                    <th className="p-2.5 text-right w-28">Unit Price</th>
                    <th className="p-2.5 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewQuote.lineItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-gray-800">{item.description}</td>
                      <td className="p-2.5 text-center text-gray-600">{item.quantity}</td>
                      <td className="p-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2.5 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(viewQuote.subtotal)}</span>
                </div>
                {viewQuote.discountPercent > 0 && (
                  <div className="flex justify-between text-success-600 font-medium">
                    <span>Discount ({viewQuote.discountPercent}%):</span>
                    <span>- {formatCurrency((viewQuote.subtotal * viewQuote.discountPercent) / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Sales Tax ({viewQuote.taxPercent}% of discounted amount):</span>
                  <span>{formatCurrency(quotationAmounts(viewQuote).tax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span className="text-brand text-base font-black">{formatCurrency(viewQuote.total)}</span>
                </div>
              </div>
            </div>

            {/* Status history */}
            {viewQuote.history?.length > 0 && (
              <div className="text-2xs text-gray-500">
                <strong className="block text-gray-700 mb-1">Status history</strong>
                <ul className="space-y-0.5">
                  {viewQuote.history.map((h, i) => (
                    <li key={i}>{new Date(h.at).toLocaleString()} — {h.status}</li>
                  ))}
                </ul>
              </div>
            )}
            {displayStatus(viewQuote) === 'Expired' && (
              <p className="text-2xs text-danger-600 bg-danger-50 rounded-lg p-2">This quotation passed its validity date on {formatDate(viewQuote.expiryDate)}.</p>
            )}

            {/* Terms */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-2xs text-gray-500">
              <strong className="block text-gray-700 mb-0.5">Commercial Terms:</strong>
              {viewQuote.notes || 'All audits are conducted according to ISO / IAF 17021 regulations.'}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message={`Are you sure you want to remove quote "${deleteConfirm?.quoteNumber}"?`}
      />
    </div>
  );
}
