import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark, Plus, Pencil, Trash2, Eye, Mail, Phone, MapPin, Users, Target, DollarSign,
  TrendingUp, Trophy, Contact as ContactIcon, ArrowRight, Briefcase,
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
import { useAuth } from '../../../lib/auth';
import WhatsAppSendButton from '../../../components/whatsapp/WhatsAppSendButton';
import EmailSendButton from '../../../components/email/EmailSendButton';
import { accountMessage } from '../../../lib/shareMessages';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useCollection from '../../../hooks/useCollection';
import useQuickAction from '../../../hooks/useQuickAction';
import useSearch from '../../../hooks/useSearch';
import usePagination from '../../../hooks/usePagination';
import { ENTITIES } from '../../../data/entities';
import { formatCurrency, generateId } from '../../../utils/format';

/**
 * Accounts — the organisations you sell to and work with, each with its
 * contacts, leads and deals. Account records are the "companies" collection,
 * stored on the server through /api/accounts; contacts, leads and deals are
 * linked to an account by company name (that is how those records store it).
 */

const RELATIONSHIPS = ['Customer', 'Prospect', 'Partner', 'Supplier'];
const CATEGORIES = ['Enterprise', 'Mid-Market', 'SMB'];
const CLOSED_STAGES = ['Closed Won', 'Closed Lost'];
const SEARCH_FIELDS = ENTITIES.companies.searchFields;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SORTS = [
  { value: 'name', label: 'Sort: Name (A–Z)' },
  { value: 'pipeline', label: 'Sort: Open pipeline' },
  { value: 'won', label: 'Sort: Won revenue' },
  { value: 'contacts', label: 'Sort: Most contacts' },
];

const norm = (s) => String(s ?? '').trim().toLowerCase();
const initialsOf = (name = '') =>
  String(name).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AC';

// Logo tiles use the Meridian palette, whatever colour class a stored record carries.
const LOGO_TONES = [
  'bg-teal-800 text-primrose',
  'bg-accent text-primary-ink',
  'bg-teal-500 text-white',
  'bg-primrose on-primrose',
  'bg-teal-950 text-primrose',
  'bg-rust text-white',
];
const logoTone = (account) => LOGO_TONES[[...String(account?.name || '')].reduce((h, ch) => h + ch.charCodeAt(0), 0) % LOGO_TONES.length];

const emptyForm = {
  name: '', industry: '', relationship: 'Prospect', category: 'Enterprise',
  contactPerson: '', contactRole: '', email: '', phone: '', location: '', country: 'Pakistan', totalSpent: 0,
};

const EMPTY_STATS = { contacts: [], leads: [], openLeads: [], deals: [], openDeals: [], pipeline: 0, weighted: 0, won: 0 };

function AccountLogo({ account, size = 'md' }) {
  const cls = size === 'lg' ? 'w-14 h-14 rounded-xl text-lg' : 'w-9 h-9 rounded-lg text-xs';
  return (
    <div className={`${cls} flex items-center justify-center font-bold shrink-0 ${logoTone(account)}`} aria-hidden="true">
      {account.logoText || initialsOf(account.name)}
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useCollection('companies');
  const [contacts] = useCollection('contacts');
  const [leads] = useCollection('leads');
  const [deals] = useCollection('deals');
  const addToast = useToast();
  const canDelete = useAuth().can('records.delete');

  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [viewId, setViewId] = useState(null);
  const [viewTab, setViewTab] = useState('contacts');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Related records per account, keyed by normalised account name.
  const statsByName = useMemo(() => {
    const map = new Map();
    const bucket = (name) => {
      const key = norm(name);
      if (!key) return null;
      if (!map.has(key)) map.set(key, { contacts: [], leads: [], openLeads: [], deals: [], openDeals: [], pipeline: 0, weighted: 0, won: 0 });
      return map.get(key);
    };
    contacts.forEach(c => bucket(c.company)?.contacts.push(c));
    leads.forEach(l => {
      const b = bucket(l.company);
      if (!b) return;
      b.leads.push(l);
      if (!['Won', 'Lost'].includes(l.status) && !l.convertedDealId) b.openLeads.push(l);
    });
    deals.forEach(d => {
      const b = bucket(d.company);
      if (!b) return;
      const value = Number(d.value) || 0;
      b.deals.push(d);
      if (d.stage === 'Closed Won') b.won += value;
      if (!CLOSED_STAGES.includes(d.stage)) {
        b.openDeals.push(d);
        b.pipeline += value;
        b.weighted += value * ((Number(d.probability) || 0) / 100);
      }
    });
    return map;
  }, [contacts, leads, deals]);

  const statsFor = (account) => statsByName.get(norm(account?.name)) || EMPTY_STATS;

  const industries = useMemo(
    () => [...new Set(accounts.map(a => a.industry).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [accounts]
  );

  const { query, setQuery, filtered: searchFiltered } = useSearch(accounts, SEARCH_FIELDS);

  const filteredAccounts = useMemo(() => {
    const list = searchFiltered.filter(a =>
      (relationshipFilter === 'All' || a.relationship === relationshipFilter) &&
      (categoryFilter === 'All' || a.category === categoryFilter) &&
      (industryFilter === 'All' || a.industry === industryFilter)
    );
    const stat = (a) => statsByName.get(norm(a.name)) || EMPTY_STATS;
    const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''));
    const sorters = {
      name: byName,
      pipeline: (a, b) => stat(b).pipeline - stat(a).pipeline || byName(a, b),
      won: (a, b) => stat(b).won - stat(a).won || byName(a, b),
      contacts: (a, b) => stat(b).contacts.length - stat(a).contacts.length || byName(a, b),
    };
    return [...list].sort(sorters[sortBy] || byName);
  }, [searchFiltered, relationshipFilter, categoryFilter, industryFilter, sortBy, statsByName]);

  const pagination = usePagination(filteredAccounts, 10);

  // KPIs across every account.
  const kpis = useMemo(() => {
    let pipeline = 0;
    let won = 0;
    let linkedContacts = 0;
    accounts.forEach(a => {
      const s = statsByName.get(norm(a.name));
      if (!s) return;
      pipeline += s.pipeline;
      won += s.won;
      linkedContacts += s.contacts.length;
    });
    return {
      customers: accounts.filter(a => a.relationship === 'Customer').length,
      prospects: accounts.filter(a => a.relationship === 'Prospect').length,
      withOpenDeals: accounts.filter(a => (statsByName.get(norm(a.name))?.openDeals.length || 0) > 0).length,
      pipeline,
      won,
      linkedContacts,
    };
  }, [accounts, statsByName]);

  const viewAccount = viewId ? accounts.find(a => a.id === viewId) : null;
  const viewStats = viewAccount ? statsFor(viewAccount) : EMPTY_STATS;

  // ---- Create / edit -------------------------------------------------------
  const handleOpenAdd = () => {
    setEditAccount(null);
    setFormData(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (account) => {
    setEditAccount(account);
    setFormData({ ...emptyForm, ...account, totalSpent: account.totalSpent ?? 0 });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = String(formData.name || '').trim();
    const industry = String(formData.industry || '').trim();
    const email = String(formData.email || '').trim();
    const totalSpent = Number(formData.totalSpent) || 0;
    if (!name) { setFormError('Account name is required.'); return; }
    if (!industry) { setFormError('Industry is required.'); return; }
    if (email && !EMAIL_RE.test(email)) { setFormError('Enter a valid email address.'); return; }
    if (totalSpent < 0) { setFormError('Lifetime value cannot be negative.'); return; }
    const duplicate = accounts.find(a => a.id !== editAccount?.id && norm(a.name) === norm(name));
    if (duplicate) { setFormError(`An account named "${duplicate.name}" already exists.`); return; }

    const record = {
      ...formData,
      name,
      industry,
      email,
      totalSpent,
      logoText: initialsOf(name),
      logoColor: formData.logoColor || 'bg-teal-800',
      // Kept in step with the deals linked to this account, for the other modules that read it.
      activeDeals: (statsByName.get(norm(name))?.openDeals.length) || 0,
    };

    if (editAccount) {
      setAccounts(prev => prev.map(a => (a.id === editAccount.id ? { ...a, ...record } : a)));
      addToast('Account updated.', 'success');
    } else {
      setAccounts(prev => [{ id: `comp-${generateId()}`, ...record }, ...prev]);
      addToast('Account created.', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setAccounts(prev => prev.filter(a => a.id !== deleteConfirm.id));
    if (viewId === deleteConfirm.id) setViewId(null);
    addToast(`Account "${deleteConfirm.name}" deleted.`, 'success');
    setDeleteConfirm(null);
  };

  const openView = (account) => {
    setViewTab('contacts');
    setViewId(account.id);
  };

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));
  const filtersActive = query || relationshipFilter !== 'All' || categoryFilter !== 'All' || industryFilter !== 'All';
  const clearFilters = () => {
    setQuery('');
    setRelationshipFilter('All');
    setCategoryFilter('All');
    setIndustryFilter('All');
  };

  // ---- Detail tabs ---------------------------------------------------------
  const tabs = viewAccount ? [
    {
      id: 'contacts', label: 'Contacts', icon: ContactIcon, items: viewStats.contacts,
      empty: 'No contacts at this account yet.',
      allTo: `/crm/contacts?q=${encodeURIComponent(viewAccount.name)}`,
      render: c => ({ title: c.name, meta: [c.role, c.email || c.phone].filter(Boolean).join(' · ') || '—', status: c.status, to: `/crm/contacts?q=${encodeURIComponent(c.name)}` }),
    },
    {
      id: 'deals', label: 'Deals', icon: DollarSign, items: viewStats.deals,
      empty: 'No deals with this account yet.',
      allTo: `/sales-analytics/deals?q=${encodeURIComponent(viewAccount.name)}`,
      render: d => ({ title: d.name, meta: [formatCurrency(d.value), d.owner, d.expectedClose && `closes ${d.expectedClose}`].filter(Boolean).join(' · '), status: d.stage, to: `/sales-analytics/deals?q=${encodeURIComponent(d.name)}` }),
    },
    {
      id: 'leads', label: 'Leads', icon: Target, items: viewStats.leads,
      empty: 'No leads from this account yet.',
      allTo: `/sales-analytics/leads?q=${encodeURIComponent(viewAccount.name)}`,
      render: l => ({ title: l.contactName, meta: [formatCurrency(l.dealValue), l.source, l.assignedTo].filter(Boolean).join(' · '), status: l.status, to: `/sales-analytics/leads?q=${encodeURIComponent(l.contactName)}` }),
    },
  ] : [];
  const activeTab = tabs.find(t => t.id === viewTab) || tabs[0];

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Every organisation you sell to or work with, with its people, open pipeline and won business in one place."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DataTransferActions entityType="companies" records={accounts} setRecords={setAccounts} filtered={filteredAccounts} />
            <button type="button" onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Account
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Accounts" value={accounts.length} subtitle={`${kpis.customers} customers · ${kpis.prospects} prospects`} icon={Landmark} iconColor="bg-primary-100 text-brand" />
        <StatCard title="Open Pipeline" value={formatCurrency(kpis.pipeline)} subtitle={`${kpis.withOpenDeals} accounts with open deals`} icon={TrendingUp} iconColor="bg-accent/10 text-accent" />
        <StatCard title="Won Revenue" value={formatCurrency(kpis.won)} subtitle="Closed-won deals" icon={Trophy} iconColor="bg-success/10 text-success" />
        <StatCard title="Linked Contacts" value={kpis.linkedContacts} subtitle="People at these accounts" icon={Users} iconColor="primrose" />
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="w-full lg:w-80">
            <SearchInput value={query} onChange={setQuery} placeholder="Search account, contact, email, city..." />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={relationshipFilter}
              onChange={setRelationshipFilter}
              options={[{ value: 'All', label: 'All Relationships' }, ...RELATIONSHIPS.map(r => ({ value: r, label: r }))]}
            />
            <FilterDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[{ value: 'All', label: 'All Sizes' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]}
            />
            <FilterDropdown
              value={industryFilter}
              onChange={setIndustryFilter}
              options={[{ value: 'All', label: 'All Industries' }, ...industries.map(i => ({ value: i, label: i }))]}
            />
            <FilterDropdown value={sortBy} onChange={setSortBy} options={SORTS} />
          </div>
        </div>
      </div>

      <div className="card mb-6 overflow-hidden">
        {filteredAccounts.length === 0 ? (
          <EmptyState
            title={accounts.length ? 'No accounts match' : 'No accounts yet'}
            description={accounts.length ? 'Try adjusting your filters or search query.' : 'Add an account or import a file to get started.'}
            icon={Landmark}
            action={accounts.length
              ? (filtersActive && <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>)
              : <button type="button" className="btn-primary" onClick={handleOpenAdd}><Plus size={16} /> Add Account</button>}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Relationship</th>
                  <th>Primary Contact</th>
                  <th className="text-right">Contacts</th>
                  <th>Open Deals</th>
                  <th className="text-right">Won</th>
                  <th>Location</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedData.map(a => {
                  const s = statsFor(a);
                  return (
                    <tr key={a.id}>
                      <td>
                        <button type="button" onClick={() => openView(a)} className="flex items-center gap-2.5 text-left group">
                          <AccountLogo account={a} />
                          <span className="min-w-0">
                            <span className="block font-semibold text-gray-900 group-hover:text-brand transition-colors">{a.name}</span>
                            <span className="block text-2xs text-gray-400">{[a.industry, a.category].filter(Boolean).join(' · ')}</span>
                          </span>
                        </button>
                      </td>
                      <td><StatusBadge status={a.relationship || 'Prospect'} /></td>
                      <td>
                        {a.contactPerson ? (
                          <>
                            <p className="text-xs font-semibold text-gray-900">{a.contactPerson}</p>
                            <p className="text-2xs text-gray-400">{a.contactRole || a.email || '—'}</p>
                          </>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="text-right"><span className="text-xs font-semibold text-gray-800 tabular-nums">{s.contacts.length}</span></td>
                      <td>
                        {s.openDeals.length ? (
                          <>
                            <p className="text-xs font-bold text-brand tabular-nums">{formatCurrency(s.pipeline)}</p>
                            <p className="text-2xs text-gray-400">{s.openDeals.length} open deal{s.openDeals.length === 1 ? '' : 's'}</p>
                          </>
                        ) : <span className="text-xs text-gray-400">None</span>}
                      </td>
                      <td className="text-right"><span className="text-xs font-semibold text-gray-800 tabular-nums">{s.won ? formatCurrency(s.won) : '—'}</span></td>
                      <td><span className="text-xs text-gray-600">{[a.location, a.country].filter(Boolean).join(', ') || '—'}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <WhatsAppSendButton title={`Account: ${a.name}`} phone={a.phone} message={() => accountMessage(a, statsFor(a))} />
                          <EmailSendButton title={`Account: ${a.name}`} to={a.email} name={a.contactPerson} subject={`Meridian × ${a.name}`} details={() => accountMessage(a, statsFor(a))} />
                          <button type="button" onClick={() => openView(a)} className="p-1.5 text-gray-500 hover:text-brand rounded-lg hover:bg-gray-100" aria-label={`View ${a.name}`} title="View account">
                            <Eye size={14} />
                          </button>
                          <button type="button" onClick={() => handleOpenEdit(a)} className="p-1.5 text-gray-500 hover:text-info rounded-lg hover:bg-gray-100" aria-label={`Edit ${a.name}`} title="Edit account">
                            <Pencil size={14} />
                          </button>
                          {canDelete && (
                            <button type="button" onClick={() => setDeleteConfirm(a)} className="p-1.5 text-gray-500 hover:text-danger rounded-lg hover:bg-gray-100" aria-label={`Delete ${a.name}`} title="Delete account">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Create / edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAccount ? 'Edit Account' : 'New Account'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="accounts-form" className="btn-primary">{editAccount ? 'Update Account' : 'Create Account'}</button>
          </>
        }
      >
        <form id="accounts-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && <p role="alert" className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="accounts-name" className="form-label">Account Name *</label>
              <input id="accounts-name" type="text" className="form-input" value={formData.name} onChange={set('name')} placeholder="e.g. Apex Industrial Solutions" />
            </div>
            <div>
              <label htmlFor="accounts-industry" className="form-label">Industry *</label>
              <input id="accounts-industry" type="text" list="accounts-industry-options" className="form-input" value={formData.industry} onChange={set('industry')} placeholder="e.g. Manufacturing" />
              <datalist id="accounts-industry-options">
                {industries.map(i => <option key={i} value={i} />)}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="accounts-relationship" className="form-label">Relationship</label>
              <select id="accounts-relationship" className="form-select" value={formData.relationship} onChange={set('relationship')}>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="accounts-category" className="form-label">Size</label>
              <select id="accounts-category" className="form-select" value={formData.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="accounts-value" className="form-label">Lifetime Value (PKR)</label>
              <input id="accounts-value" type="number" min="0" className="form-input" value={formData.totalSpent} onChange={set('totalSpent')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="accounts-contact" className="form-label">Primary Contact</label>
              <input id="accounts-contact" type="text" className="form-input" value={formData.contactPerson} onChange={set('contactPerson')} placeholder="e.g. Samira Khan" />
            </div>
            <div>
              <label htmlFor="accounts-role" className="form-label">Contact Role</label>
              <input id="accounts-role" type="text" className="form-input" value={formData.contactRole} onChange={set('contactRole')} placeholder="e.g. Quality Director" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="accounts-email" className="form-label">Email</label>
              <input id="accounts-email" type="email" className="form-input" value={formData.email} onChange={set('email')} placeholder="info@company.com" />
            </div>
            <div>
              <label htmlFor="accounts-phone" className="form-label">Phone</label>
              <input id="accounts-phone" type="tel" className="form-input" value={formData.phone} onChange={set('phone')} placeholder="+92 21 3456 7890" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="accounts-location" className="form-label">City / Region</label>
              <input id="accounts-location" type="text" className="form-input" value={formData.location} onChange={set('location')} placeholder="Karachi, Sindh" />
            </div>
            <div>
              <label htmlFor="accounts-country" className="form-label">Country</label>
              <input id="accounts-country" type="text" className="form-input" value={formData.country} onChange={set('country')} placeholder="Pakistan" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Account detail */}
      {viewAccount && (
        <Modal
          isOpen={!!viewAccount}
          onClose={() => setViewId(null)}
          title="Account"
          size="xl"
          footer={
            <>
              <button type="button" className="btn-outline" onClick={() => { const a = viewAccount; setViewId(null); handleOpenEdit(a); }}>
                <Pencil size={14} /> Edit
              </button>
              <button type="button" className="btn-secondary" onClick={() => setViewId(null)}>Close</button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <AccountLogo account={viewAccount} size="lg" />
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{viewAccount.name}</h3>
                <p className="text-xs text-gray-500">{[viewAccount.industry, viewAccount.category].filter(Boolean).join(' • ') || '—'}</p>
                <div className="mt-1"><StatusBadge status={viewAccount.relationship || 'Prospect'} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-start gap-2"><Briefcase size={14} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" /><span><span className="font-semibold text-gray-800">{viewAccount.contactPerson || '—'}</span>{viewAccount.contactRole && <span className="text-gray-500"> · {viewAccount.contactRole}</span>}</span></div>
              <div className="flex items-start gap-2"><Mail size={14} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />{viewAccount.email ? <a href={`mailto:${viewAccount.email}`} className="font-semibold text-brand hover:underline break-all">{viewAccount.email}</a> : <span className="font-semibold text-gray-800">—</span>}</div>
              <div className="flex items-start gap-2"><Phone size={14} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />{viewAccount.phone ? <a href={`tel:${viewAccount.phone}`} className="font-semibold text-brand hover:underline">{viewAccount.phone}</a> : <span className="font-semibold text-gray-800">—</span>}</div>
              <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" /><span className="font-semibold text-gray-800">{[viewAccount.location, viewAccount.country].filter(Boolean).join(', ') || '—'}</span></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Contacts', value: viewStats.contacts.length },
                { label: 'Open leads', value: viewStats.openLeads.length },
                { label: 'Open deals', value: viewStats.openDeals.length },
                { label: 'Pipeline', value: formatCurrency(viewStats.pipeline), sub: `${formatCurrency(Math.round(viewStats.weighted))} weighted` },
                { label: 'Won', value: formatCurrency(viewStats.won), sub: `${formatCurrency(viewAccount.totalSpent || 0)} lifetime` },
              ].map(k => (
                <div key={k.label} className="rounded-lg border border-gray-100 p-2.5">
                  <p className="text-[11px] text-gray-500">{k.label}</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums truncate">{k.value}</p>
                  {k.sub && <p className="text-[10.5px] text-gray-400 truncate">{k.sub}</p>}
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-1 border-b border-gray-100" role="tablist" aria-label="Related records">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab.id === t.id}
                    onClick={() => setViewTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 -mb-px border-b-2 text-xs font-semibold transition-colors ${activeTab.id === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                  >
                    <t.icon size={13} aria-hidden="true" /> {t.label}
                    <span className="min-w-[18px] px-1 rounded-full bg-gray-100 text-gray-600 text-[10px] leading-[16px]">{t.items.length}</span>
                  </button>
                ))}
              </div>
              <div role="tabpanel" className="pt-3">
                {activeTab.items.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">{activeTab.empty}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {activeTab.items.slice(0, 8).map(item => {
                      const r = activeTab.render(item);
                      return (
                        <li key={item.id}>
                          <Link to={r.to} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-xs">
                            <span className="min-w-0">
                              <span className="block font-semibold text-gray-800 truncate">{r.title}</span>
                              <span className="block text-gray-500 truncate">{r.meta}</span>
                            </span>
                            {r.status && <StatusBadge status={r.status} />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {activeTab.items.length > 0 && (
                  <Link to={activeTab.allTo} className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-strong group">
                    Open {activeTab.items.length > 8 ? `all ${activeTab.items.length} ` : ''}in {activeTab.label} <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Delete "${deleteConfirm?.name}"? Its contacts, leads and deals are kept, but will no longer be grouped under an account.`}
      />
    </div>
  );
}
