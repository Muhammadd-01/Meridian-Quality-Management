import React, { useState, useMemo } from 'react';
import {
  PhoneCall, Mail, Phone, Send, Plus, Trash2, Eye, Download,
  Clock, ArrowDownLeft, ArrowUpRight, Search, Filter, MessageSquare,
  Building2, User, CheckCircle2, AlertCircle, FileText
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
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import { initialCommunications } from '../../../data/crmData';
import { generateId } from '../../../utils/format';

export default function CallsEmails() {
  const [comms, setComms] = useLocalStorage('meridian-calls-emails', initialCommunications);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'calls' | 'emails'
  const [directionFilter, setDirectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [logCallModal, setLogCallModal] = useState(false);
  const [composeEmailModal, setComposeEmailModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(comms, ['contact', 'company', 'subject', 'notes', 'owner']);

  // Filters + Tab
  const filteredComms = useMemo(() => {
    return searchFiltered.filter(c => {
      const matchTab =
        activeTab === 'all' ||
        (activeTab === 'calls' && c.type === 'Call') ||
        (activeTab === 'emails' && c.type === 'Email');
      const matchDir = directionFilter === 'All' || c.direction === directionFilter;
      const matchStatus = statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase();
      return matchTab && matchDir && matchStatus;
    });
  }, [searchFiltered, activeTab, directionFilter, statusFilter]);

  // Pagination
  const pagination = usePagination(filteredComms, 7);

  // Call form state
  const [callData, setCallData] = useState({
    contact: '',
    company: '',
    direction: 'Outbound',
    duration: '10m 00s',
    owner: 'Sarah Ahmed',
    status: 'Completed',
    subject: '',
    notes: '',
  });

  // Email form state
  const [emailData, setEmailData] = useState({
    contact: '',
    company: '',
    direction: 'Outbound',
    owner: 'Sarah Ahmed',
    status: 'Delivered',
    subject: '',
    notes: '',
  });

  const handleSaveCall = (e) => {
    e.preventDefault();
    const newCall = {
      id: `comm-${generateId()}`,
      type: 'Call',
      ...callData,
      dateTime: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setComms(prev => [newCall, ...prev]);
    addToast('Call record logged successfully!', 'success');
    setLogCallModal(false);
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    const newEmail = {
      id: `comm-${generateId()}`,
      type: 'Email',
      ...emailData,
      duration: 'N/A',
      dateTime: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setComms(prev => [newEmail, ...prev]);
    addToast('Email logged to the communication history. It was not sent — no email service is configured.', 'info', 5000);
    setComposeEmailModal(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setComms(prev => prev.filter(c => c.id !== deleteConfirm.id));
    addToast('Communication record removed.', 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const totalCalls = comms.filter(c => c.type === 'Call').length;
  const totalEmails = comms.filter(c => c.type === 'Email').length;
  const outboundCount = comms.filter(c => c.direction === 'Outbound').length;
  const inboundCount = comms.filter(c => c.direction === 'Inbound').length;

  return (
    <div>
      <PageHeader
        title="Calls & Emails"
        subtitle="Unified audit communications record tracking phone consults, advisory emails, and client responses."
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Calls & Emails' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DataTransferActions entityType="communications" records={comms} setRecords={setComms} filtered={filteredComms} />
            <button onClick={() => setLogCallModal(true)} className="btn-outline">
              <Phone size={15} /> Log Call
            </button>
            <button onClick={() => setComposeEmailModal(true)} className="btn-primary">
              <Send size={15} /> Log Email
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Communications"
          value={comms.length}
          subtitle="Calls and emails combined"
          icon={MessageSquare}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Phone Logs"
          value={totalCalls}
          subtitle="Audio consultations"
          icon={PhoneCall}
          iconColor="primrose"
        />
        <StatCard
          title="Emails Sent/Received"
          value={totalEmails}
          subtitle="Direct client messages"
          icon={Mail}
          iconColor="bg-accent/10 text-accent"
        />
        <StatCard
          title="Touchpoint Flow"
          value={`${outboundCount} Out / ${inboundCount} In`}
          subtitle="Outbound vs Inbound ratio"
          icon={ArrowUpRight}
          iconColor="bg-success/10 text-success"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Communications ({comms.length})
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'calls'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Phone size={14} /> Calls ({totalCalls})
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'emails'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail size={14} /> Emails ({totalEmails})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search contact, company, subject..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={directionFilter}
              onChange={setDirectionFilter}
              options={[
                { value: 'All', label: 'All Directions' },
                { value: 'Outbound', label: 'Outbound' },
                { value: 'Inbound', label: 'Inbound' },
              ]}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Read', label: 'Read' },
                { value: 'Voicemail', label: 'Voicemail' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Communications Table */}
      <div className="card mb-6 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Channel & Type</th>
                <th>Recipient / Account</th>
                <th>Subject & Notes Excerpt</th>
                <th>Duration / Stat</th>
                <th>Consultant</th>
                <th>Timestamp</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedData.map(c => {
                const isCall = c.type === 'Call';
                const isOutbound = c.direction === 'Outbound';

                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isCall ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
                        }`}>
                          {isCall ? <Phone size={15} /> : <Mail size={15} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 font-semibold text-gray-800 text-xs">
                            {isOutbound ? (
                              <ArrowUpRight size={13} className="text-accent-600" />
                            ) : (
                              <ArrowDownLeft size={13} className="text-primary-600" />
                            )}
                            {c.direction}
                          </div>
                          <span className="text-2xs text-gray-400">{c.type}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-semibold text-xs text-gray-900">{c.contact}</p>
                      <p className="text-2xs text-gray-500">{c.company}</p>
                    </td>
                    <td className="max-w-xs">
                      <p className="font-medium text-xs text-gray-900 truncate">{c.subject}</p>
                      <p className="text-2xs text-gray-500 line-clamp-1">{c.notes}</p>
                    </td>
                    <td>
                      {isCall ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-700 font-medium">
                          <Clock size={12} className="text-gray-400" />
                          {c.duration}
                        </span>
                      ) : (
                        <StatusBadge status={c.status} />
                      )}
                    </td>
                    <td><span className="text-xs text-gray-700">{c.owner}</span></td>
                    <td><span className="text-2xs text-gray-500">{c.dateTime}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewItem(c)}
                          className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c)}
                          className="p-1.5 text-gray-500 hover:text-danger rounded-lg hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Log Call Modal */}
      <Modal
        isOpen={logCallModal}
        onClose={() => setLogCallModal(false)}
        title="Log Phone Consultation"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setLogCallModal(false)}>Cancel</button>
            <button type="submit" form="callsEmails-saveCall-form" className="btn-primary">Save Log</button>
          </>
        }
      >
        <form id="callsEmails-saveCall-form" onSubmit={handleSaveCall} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="callsEmails-field-1" className="form-label">Contact Person *</label>
              <input id="callsEmails-field-1"
                type="text"
                required
                className="form-input"
                value={callData.contact}
                onChange={(e) => setCallData({ ...callData, contact: e.target.value })}
                placeholder="Marcus Lee"
              />
            </div>
            <div>
              <label htmlFor="callsEmails-field-2" className="form-label">Organization *</label>
              <input id="callsEmails-field-2"
                type="text"
                required
                className="form-input"
                value={callData.company}
                onChange={(e) => setCallData({ ...callData, company: e.target.value })}
                placeholder="Northwind Engineering Corp"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="callsEmails-field-3" className="form-label">Direction</label>
              <select id="callsEmails-field-3"
                className="form-select"
                value={callData.direction}
                onChange={(e) => setCallData({ ...callData, direction: e.target.value })}
              >
                <option value="Outbound">Outbound</option>
                <option value="Inbound">Inbound</option>
              </select>
            </div>
            <div>
              <label htmlFor="callsEmails-field-4" className="form-label">Call Duration</label>
              <input id="callsEmails-field-4"
                type="text"
                className="form-input"
                value={callData.duration}
                onChange={(e) => setCallData({ ...callData, duration: e.target.value })}
                placeholder="15m 30s"
              />
            </div>
            <div>
              <label htmlFor="callsEmails-field-5" className="form-label">Outcome Status</label>
              <select id="callsEmails-field-5"
                className="form-select"
                value={callData.status}
                onChange={(e) => setCallData({ ...callData, status: e.target.value })}
              >
                <option value="Completed">Completed</option>
                <option value="Voicemail">Voicemail</option>
                <option value="No Answer">No Answer</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="callsEmails-field-6" className="form-label">Call Purpose / Subject *</label>
            <input id="callsEmails-field-6"
              type="text"
              required
              className="form-input"
              value={callData.subject}
              onChange={(e) => setCallData({ ...callData, subject: e.target.value })}
              placeholder="e.g. Audit schedule confirmation"
            />
          </div>

          <div>
            <label htmlFor="callsEmails-field-7" className="form-label">Consultant Notes & Follow-ups</label>
            <textarea id="callsEmails-field-7"
              rows={3}
              className="form-input"
              value={callData.notes}
              onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
              placeholder="Summary of agreements, next steps..."
            />
          </div>
        </form>
      </Modal>

      {/* Compose Email Modal */}
      <Modal
        isOpen={composeEmailModal}
        onClose={() => setComposeEmailModal(false)}
        title="Log Advisory Email"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setComposeEmailModal(false)}>Cancel</button>
            <button type="submit" form="callsEmails-sendEmail-form" className="btn-primary">
              <Send size={15} /> Save to History
            </button>
          </>
        }
      >
        <form id="callsEmails-sendEmail-form" onSubmit={handleSendEmail} className="space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5" role="note">
            This records an email in the communication history. Meridian has no email service configured, so nothing is delivered.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="callsEmails-field-8" className="form-label">Recipient Contact *</label>
              <input id="callsEmails-field-8"
                type="text"
                required
                className="form-input"
                value={emailData.contact}
                onChange={(e) => setEmailData({ ...emailData, contact: e.target.value })}
                placeholder="Amelia Hart"
              />
            </div>
            <div>
              <label htmlFor="callsEmails-field-9" className="form-label">Client Company *</label>
              <input id="callsEmails-field-9"
                type="text"
                required
                className="form-input"
                value={emailData.company}
                onChange={(e) => setEmailData({ ...emailData, company: e.target.value })}
                placeholder="Cascade Retail Grp"
              />
            </div>
          </div>

          <div>
            <label htmlFor="callsEmails-field-10" className="form-label">Email Subject *</label>
            <input id="callsEmails-field-10"
              type="text"
              required
              className="form-input"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="e.g. ISO 9001:2015 Audit Preparation Documents"
            />
          </div>

          <div>
            <label htmlFor="callsEmails-field-11" className="form-label">Message Body *</label>
            <textarea id="callsEmails-field-11"
              rows={6}
              required
              className="form-input font-sans text-sm"
              value={emailData.notes}
              onChange={(e) => setEmailData({ ...emailData, notes: e.target.value })}
              placeholder="Dear Client,\n\nPlease find attached the audit verification checklist..."
            />
          </div>
        </form>
      </Modal>

      {/* View Item Modal */}
      {viewItem && (
        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={`${viewItem.type}: ${viewItem.subject}`}
          size="md"
          footer={
            <button className="btn-secondary" onClick={() => setViewItem(null)}>Close</button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-2xs text-gray-400 uppercase tracking-wide block">Contact</span>
                <span className="text-sm font-bold text-gray-900">{viewItem.contact}</span>
                <span className="text-xs text-gray-500 block">{viewItem.company}</span>
              </div>
              <div className="text-right">
                <span className="text-2xs text-gray-400 uppercase tracking-wide block">Channel</span>
                <StatusBadge status={viewItem.status} />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs font-semibold text-gray-700 block mb-1">Content & Notes:</span>
              <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{viewItem.notes}</p>
            </div>

            <div className="flex items-center justify-between text-2xs text-gray-400">
              <span>Recorded by: <strong className="text-gray-700">{viewItem.owner}</strong></span>
              <span>{viewItem.dateTime}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove Communication Log"
        message={`Are you sure you want to delete this communication record with ${deleteConfirm?.contact}?`}
      />
    </div>
  );
}
