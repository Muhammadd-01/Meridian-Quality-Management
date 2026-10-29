import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Contact as ContactIcon, Users, Plus, Pencil, Trash2, Eye, Mail, Phone, MapPin,
  Building2, CheckCircle2, Target, DollarSign, Activity, PhoneCall,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';
import EmptyState from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useCollection from '../../../hooks/useCollection';
import useQuickAction from '../../../hooks/useQuickAction';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import { ENTITIES } from '../../../data/entities';
import { contactStatuses } from '../../../data/contacts';
import { formatCurrency, generateId } from '../../../utils/format';

const norm = (s) => String(s ?? '').trim().toLowerCase();
const initials = (name = '') =>
  String(name).replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'NA';

const emptyForm = {
  name: '', company: '', role: '', email: '', phone: '', location: '', status: 'Active', tags: '', notes: '',
};

const DemoBadge = () => (
  <span className="badge-warning text-2xs uppercase" title="Seeded from contact names on demo company and lead records">Demo</span>
);

export default function Contacts() {
  const [contacts, setContacts] = useCollection('contacts');
  const [companies] = useCollection('companies');
  const [leads] = useCollection('leads');
  const [deals] = useCollection('deals');
  const [activities] = useCollection('activities');
  const [communications] = useCollection('communications');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [viewContact, setViewContact] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const addToast = useToast();

  const { query, setQuery, filtered: searchFiltered } = useSearch(contacts, ENTITIES.contacts.searchFields);

  const filteredContacts = useMemo(() => searchFiltered.filter(c =>
    (statusFilter === 'All' || c.status === statusFilter) &&
    (companyFilter === 'All' || norm(c.company) === norm(companyFilter))
  ), [searchFiltered, statusFilter, companyFilter]);

  const pagination = usePagination(filteredContacts, 10);

  const companyNames = useMemo(() => {
    const names = new Set([...companies.map(c => c.name), ...contacts.map(c => c.company)].filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [companies, contacts]);

  // Related records are matched by contact name, as the other collections store contacts by name.
  const relatedFor = (contact) => {
    const n = norm(contact.name);
    const relLeads = leads.filter(l => norm(l.contactName) === n);
    const relDeals = deals.filter(d => norm(d.contact) === n);
    return {
      leads: relLeads,
      deals: relDeals,
      records: [
        ...relLeads.map(l => ({ id: l.id, title: `Lead · ${l.company}`, meta: formatCurrency(l.dealValue), status: l.status, to: `/sales-analytics/leads?q=${encodeURIComponent(l.contactName)}` })),
        ...relDeals.map(d => ({ id: d.id, title: d.name, meta: formatCurrency(d.value), status: d.stage, to: `/sales-analytics/deals?q=${encodeURIComponent(d.name)}` })),
      ],
      timeline: [
        ...activities.filter(a => norm(a.contact) === n).map(a => ({ id: a.id, at: a.dateTime, icon: Activity, title: a.title, meta: `${a.type} · ${a.status}`, to: `/crm/activities?q=${encodeURIComponent(a.title)}` })),
        ...communications.filter(c => norm(c.contact) === n).map(c => ({ id: c.id, at: c.dateTime, icon: c.type === 'Email' ? Mail : PhoneCall, title: c.subject, meta: `${c.type} · ${c.direction}`, to: `/crm/calls-emails?q=${encodeURIComponent(c.subject)}` })),
      ].sort((a, b) => String(b.at).localeCompare(String(a.at))),
    };
  };

  const handleOpenAdd = () => {
    setEditContact(null);
    setFormData(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (contact) => {
    setEditContact(contact);
    setFormData({ ...emptyForm, ...contact, tags: (contact.tags || []).join(', ') });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) { setFormError('Full name is required.'); return; }
    const email = norm(formData.email);
    const duplicate = contacts.find(c => c.id !== editContact?.id && (
      (email && norm(c.email) === email && c.source !== 'Company record') ||
      (norm(c.name) === norm(name) && norm(c.company) === norm(formData.company))
    ));
    if (duplicate) { setFormError(`A contact matching "${duplicate.name}" already exists.`); return; }

    const record = {
      ...formData,
      name,
      tags: String(formData.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    };
    if (editContact) {
      setContacts(prev => prev.map(c => (c.id === editContact.id ? { ...c, ...record } : c)));
      addToast('Contact updated successfully!', 'success');
    } else {
      setContacts(prev => [{ id: `contact-${generateId()}`, source: 'Manual', ...record, isDemo: false }, ...prev]);
      addToast('Contact added successfully!', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setContacts(prev => prev.filter(c => c.id !== deleteConfirm.id));
    addToast(`Contact "${deleteConfirm.name}" removed.`, 'success');
    setDeleteConfirm(null);
  };

  const activeCount = contacts.filter(c => c.status === 'Active').length;
  const companyCount = new Set(contacts.map(c => norm(c.company)).filter(Boolean)).size;
  const leadLinked = contacts.filter(c => leads.some(l => norm(l.contactName) === norm(c.name))).length;
  const demoCount = contacts.filter(c => c.isDemo).length;
  const related = viewContact ? relatedFor(viewContact) : null;
  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People you work with across client, partner and prospect organizations."
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Contacts' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DataTransferActions entityType="contacts" records={contacts} setRecords={setContacts} filtered={filteredContacts} />
            <button type="button" onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Contact
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Contacts" value={contacts.length} subtitle={demoCount ? `${demoCount} demo records` : 'Directory records'} icon={ContactIcon} iconColor="bg-primary-100 text-brand" />
        <StatCard title="Active" value={activeCount} subtitle="Currently engaged" icon={CheckCircle2} iconColor="bg-success/10 text-success" />
        <StatCard title="Organizations" value={companyCount} subtitle="Companies represented" icon={Building2} iconColor="primrose" />
        <StatCard title="Linked to Leads" value={leadLinked} subtitle="Matched by contact name" icon={Target} iconColor="bg-accent/10 text-accent" />
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput value={query} onChange={setQuery} placeholder="Search name, company, email, phone..." />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'All', label: 'All Statuses' }, ...contactStatuses.map(s => ({ value: s, label: s }))]}
            />
            <FilterDropdown
              value={companyFilter}
              onChange={setCompanyFilter}
              options={[{ value: 'All', label: 'All Companies' }, ...companyNames.map(n => ({ value: n, label: n }))]}
            />
          </div>
        </div>
      </div>

      <div className="card mb-6 overflow-hidden">
        {filteredContacts.length === 0 ? (
          <EmptyState
            title="No contacts found"
            description={contacts.length ? 'Try adjusting your filters or search query.' : 'Add a contact or import a file to build the directory.'}
            icon={Users}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedData.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          {c.role && <p className="text-2xs text-gray-400">{c.role}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span className="text-xs text-gray-700">{c.company || '—'}</span></td>
                    <td>
                      <p className="text-xs text-gray-700">{c.email || '—'}</p>
                      {c.phone && <p className="text-2xs text-gray-400">{c.phone}</p>}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-600">{c.source || 'Manual'}</span>
                        {c.isDemo && <DemoBadge />}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setViewContact(c)} className="p-1.5 text-gray-500 hover:text-brand rounded-lg hover:bg-gray-100" aria-label={`View ${c.name}`} title="View Details">
                          <Eye size={14} />
                        </button>
                        <button type="button" onClick={() => handleOpenEdit(c)} className="p-1.5 text-gray-500 hover:text-info rounded-lg hover:bg-gray-100" aria-label={`Edit ${c.name}`} title="Edit Contact">
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(c)} className="p-1.5 text-gray-500 hover:text-danger rounded-lg hover:bg-gray-100" aria-label={`Delete ${c.name}`} title="Delete Contact">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        title={editContact ? 'Edit Contact' : 'Add New Contact'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="contacts-submit-form" className="btn-primary">
              {editContact ? 'Update Contact' : 'Save Contact'}
            </button>
          </>
        }
      >
        <form id="contacts-submit-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && <p role="alert" className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contacts-field-name" className="form-label">Full Name *</label>
              <input id="contacts-field-name" type="text" required className="form-input" value={formData.name} onChange={set('name')} placeholder="e.g. Samira Khan" />
            </div>
            <div>
              <label htmlFor="contacts-field-role" className="form-label">Role / Title</label>
              <input id="contacts-field-role" type="text" className="form-input" value={formData.role} onChange={set('role')} placeholder="e.g. QA Regulatory Manager" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contacts-field-company" className="form-label">Company</label>
              <input id="contacts-field-company" type="text" list="contacts-company-options" className="form-input" value={formData.company} onChange={set('company')} placeholder="Choose or type a company" />
              <datalist id="contacts-company-options">
                {companyNames.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div>
              <label htmlFor="contacts-field-status" className="form-label">Status</label>
              <select id="contacts-field-status" className="form-select" value={formData.status} onChange={set('status')}>
                {contactStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contacts-field-email" className="form-label">Email</label>
              <input id="contacts-field-email" type="email" className="form-input" value={formData.email} onChange={set('email')} placeholder="name@company.com" />
            </div>
            <div>
              <label htmlFor="contacts-field-phone" className="form-label">Phone</label>
              <input id="contacts-field-phone" type="tel" className="form-input" value={formData.phone} onChange={set('phone')} placeholder="+92 300 1234567" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contacts-field-location" className="form-label">Location</label>
              <input id="contacts-field-location" type="text" className="form-input" value={formData.location} onChange={set('location')} placeholder="Karachi, Sindh" />
            </div>
            <div>
              <label htmlFor="contacts-field-tags" className="form-label">Tags (comma separated)</label>
              <input id="contacts-field-tags" type="text" className="form-input" value={formData.tags} onChange={set('tags')} placeholder="Decision maker, ISO 9001" />
            </div>
          </div>
          <div>
            <label htmlFor="contacts-field-notes" className="form-label">Notes</label>
            <textarea id="contacts-field-notes" rows={3} className="form-input" value={formData.notes} onChange={set('notes')} />
          </div>
        </form>
      </Modal>

      {/* View Contact Modal */}
      {viewContact && (
        <Modal
          isOpen={!!viewContact}
          onClose={() => setViewContact(null)}
          title={viewContact.name}
          size="lg"
          footer={
            <>
              <button type="button" className="btn-outline" onClick={() => { const c = viewContact; setViewContact(null); handleOpenEdit(c); }}>
                <Pencil size={14} /> Edit
              </button>
              <button type="button" className="btn-secondary" onClick={() => setViewContact(null)}>Close</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-primary-100 text-brand flex items-center justify-center font-bold text-lg">
                {initials(viewContact.name)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewContact.name}</h3>
                <p className="text-xs text-gray-500">{[viewContact.role, viewContact.company].filter(Boolean).join(' • ') || 'No company'}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusBadge status={viewContact.status} />
                  {viewContact.isDemo && <DemoBadge />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-start gap-2"><Mail size={14} className="text-gray-400 mt-0.5" aria-hidden="true" /><span className="font-semibold text-gray-800 break-all">{viewContact.email || '—'}</span></div>
              <div className="flex items-start gap-2"><Phone size={14} className="text-gray-400 mt-0.5" aria-hidden="true" /><span className="font-semibold text-gray-800">{viewContact.phone || '—'}</span></div>
              <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5" aria-hidden="true" /><span className="font-semibold text-gray-800">{viewContact.location || '—'}</span></div>
              <div className="flex items-start gap-2">
                <Building2 size={14} className="text-gray-400 mt-0.5" aria-hidden="true" />
                {viewContact.company ? (
                  <Link to={`/crm/companies?q=${encodeURIComponent(viewContact.company)}`} className="font-semibold text-brand hover:underline">{viewContact.company}</Link>
                ) : <span className="font-semibold text-gray-800">—</span>}
              </div>
            </div>

            {(viewContact.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewContact.tags.map(t => <span key={t} className="badge-secondary text-2xs">{t}</span>)}
              </div>
            )}
            {viewContact.notes && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">{viewContact.notes}</p>}

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Leads', icon: Target, count: related.leads.length },
                { label: 'Deals', icon: DollarSign, count: related.deals.length },
                { label: 'Interactions', icon: Activity, count: related.timeline.length },
              ].map(g => (
                <div key={g.label} className="rounded-lg border border-gray-100 p-2.5 text-center">
                  <g.icon size={15} className="mx-auto text-brand mb-1" aria-hidden="true" />
                  <p className="text-base font-bold text-gray-800">{g.count}</p>
                  <p className="text-[11px] text-gray-500">{g.label}</p>
                </div>
              ))}
            </div>

            {related.records.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Leads &amp; deals</p>
                <ul className="space-y-1.5">
                  {related.records.map(item => (
                    <li key={item.id}>
                      <Link to={item.to} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50">
                        <span className="text-xs font-medium text-gray-800 truncate">{item.title}</span>
                        <span className="flex items-center gap-2 shrink-0"><span className="text-2xs text-gray-500">{item.meta}</span><StatusBadge status={item.status} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Interaction timeline</p>
              {related.timeline.length === 0 ? (
                <p className="text-xs text-gray-400">No activities, calls or emails logged with this contact yet.</p>
              ) : (
                <ol className="space-y-2">
                  {related.timeline.slice(0, 8).map(t => (
                    <li key={t.id} className="flex items-start gap-2">
                      <t.icon size={14} className="text-brand mt-0.5 shrink-0" aria-hidden="true" />
                      <Link to={t.to} className="min-w-0 hover:underline">
                        <p className="text-xs font-medium text-gray-800 truncate">{t.title}</p>
                        <p className="text-2xs text-gray-400">{t.at || 'No date'} · {t.meta}</p>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove Contact"
        message={`Are you sure you want to remove "${deleteConfirm?.name}"? Leads, deals and activities that mention this name are not changed.`}
      />
    </div>
  );
}
