import React, { useState, useMemo } from 'react';
import {
  Building2, Users, Plus, Pencil, Trash2, Eye, Download,
  Mail, Phone, MapPin, Briefcase, DollarSign, LayoutGrid, List,
  ExternalLink, Globe, CheckCircle2, ShieldCheck
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
import CompanyRelations from './CompanyRelations';
import { initialCompanies } from '../../../data/crmData';
import { formatCurrency, formatNumber, generateId } from '../../../utils/format';


// Logo tiles use the Meridian palette, whatever colour class a stored record carries.
const LOGO_TONES = [
  'bg-teal-800 text-primrose',
  'bg-accent text-primary-ink',
  'bg-teal-500 text-white',
  'bg-primrose on-primrose',
  'bg-teal-950 text-primrose',
  'bg-rust text-white',
];
const logoTone = (company) => LOGO_TONES[[...String(company?.name || '')].reduce((h, ch) => h + ch.charCodeAt(0), 0) % LOGO_TONES.length];

export default function Companies() {
  const [companies, setCompanies] = useLocalStorage('meridian-companies', initialCompanies);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [viewCompany, setViewCompany] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [industryFilter, setIndustryFilter] = useState('All');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const addToast = useToast();

  // Search
  const { query, setQuery, filtered: searchFiltered } = useSearch(companies, ['name', 'industry', 'contactPerson', 'email', 'location']);

  // Filters
  const filteredCompanies = useMemo(() => {
    return searchFiltered.filter(c => {
      const matchInd = industryFilter === 'All' || c.industry.toLowerCase().includes(industryFilter.toLowerCase());
      const matchRel = relationshipFilter === 'All' || c.relationship.toLowerCase() === relationshipFilter.toLowerCase();
      return matchInd && matchRel;
    });
  }, [searchFiltered, industryFilter, relationshipFilter]);

  // Pagination
  const pagination = usePagination(filteredCompanies, viewMode === 'grid' ? 6 : 8);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Retail & Consumer Goods',
    category: 'Enterprise',
    relationship: 'Customer',
    email: '',
    phone: '',
    location: '',
    country: 'Pakistan',
    contactPerson: '',
    contactRole: '',
    activeDeals: 1,
    totalSpent: 1000000,
    logoText: 'QM',
    logoColor: 'bg-primary',
  });

  const handleOpenAdd = () => {
    setEditCompany(null);
    setFormData({
      name: '',
      industry: 'Manufacturing',
      category: 'Enterprise',
      relationship: 'Customer',
      email: '',
      phone: '',
      location: 'Karachi, Sindh',
      country: 'Pakistan',
      contactPerson: '',
      contactRole: 'Quality Director',
      activeDeals: 1,
      totalSpent: 1200000,
      logoText: 'QM',
      logoColor: 'bg-primary',
    });
    setModalOpen(true);
  };

  // Quick Create menu / command palette open this form via ?action=new
  useQuickAction('new', handleOpenAdd);

  const handleOpenEdit = (comp) => {
    setEditCompany(comp);
    setFormData({ ...comp });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const initials = formData.name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CO';

    if (editCompany) {
      setCompanies(prev =>
        prev.map(c =>
          c.id === editCompany.id
            ? {
                ...formData,
                logoText: initials,
                activeDeals: Number(formData.activeDeals),
                totalSpent: Number(formData.totalSpent),
              }
            : c
        )
      );
      addToast('Company updated successfully!', 'success');
    } else {
      const newComp = {
        id: `comp-${generateId()}`,
        ...formData,
        logoText: initials,
        activeDeals: Number(formData.activeDeals),
        totalSpent: Number(formData.totalSpent),
      };
      setCompanies(prev => [newComp, ...prev]);
      addToast('Company added successfully!', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setCompanies(prev => prev.filter(c => c.id !== deleteConfirm.id));
    addToast(`Company "${deleteConfirm.name}" removed.`, 'success');
    setDeleteConfirm(null);
  };

  // KPIs
  const totalSpend = companies.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const customerCount = companies.filter(c => c.relationship === 'Customer').length;
  const partnerCount = companies.filter(c => c.relationship === 'Partner').length;

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Maintain verified records of enterprise clients, accredited audit bodies, and supplier networks."
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Companies' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DataTransferActions entityType="companies" records={companies} setRecords={setCompanies} filtered={filteredCompanies} />
            <div className="hidden sm:flex items-center border border-white/25 rounded-lg overflow-hidden bg-white/[0.08]">
              <button
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`p-2 text-xs font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-primrose on-primrose' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                className={`p-2 text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-primrose on-primrose' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} /> Add Company
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Organizations"
          value={companies.length}
          subtitle="Directory records"
          icon={Building2}
          iconColor="bg-primary-100 text-brand"
        />
        <StatCard
          title="Active Clients"
          value={customerCount}
          subtitle="Enterprise buyers"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Industry Partners"
          value={partnerCount}
          subtitle="Accreditation bodies"
          icon={ShieldCheck}
          iconColor="primrose"
        />
        <StatCard
          title="Cumulative Portfolio"
          value={formatCurrency(totalSpend)}
          subtitle="Combined services value"
          icon={DollarSign}
          iconColor="bg-accent/10 text-accent"
        />
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search companies, contacts, city..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              value={relationshipFilter}
              onChange={setRelationshipFilter}
              options={[
                { value: 'All', label: 'All Relationships' },
                { value: 'Customer', label: 'Customer' },
                { value: 'Partner', label: 'Partner' },
                { value: 'Supplier', label: 'Supplier' },
                { value: 'Prospect', label: 'Prospect' },
              ]}
            />
            <FilterDropdown
              value={industryFilter}
              onChange={setIndustryFilter}
              options={[
                { value: 'All', label: 'All Industries' },
                { value: 'Retail', label: 'Retail' },
                { value: 'Industrial', label: 'Industrial' },
                { value: 'Biotechnology', label: 'Healthcare & Biotech' },
                { value: 'Energy', label: 'Energy & Utility' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {pagination.paginatedData.map(comp => (
            <div
              key={comp.id}
              className="card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${logoTone(comp)}`}>
                      {comp.logoText || 'CO'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-brand transition-colors">
                        {comp.name}
                      </h3>
                      <p className="text-xs text-gray-500">{comp.industry}</p>
                    </div>
                  </div>
                  <StatusBadge status={comp.relationship} />
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={14} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-800">{comp.contactPerson}</span>
                    <span className="text-gray-400">({comp.contactRole})</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate">{comp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <span>{comp.location}, {comp.country}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wide block">Deals</span>
                    <span className="text-sm font-bold text-gray-800">{comp.activeDeals} Active</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wide block">Contract Spend</span>
                    <span className="text-sm font-bold text-brand truncate block">
                      {formatCurrency(comp.totalSpent)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <span className="badge-secondary text-2xs uppercase">
                  {comp.category || 'Enterprise'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewCompany(comp)}
                    className="p-1.5 text-gray-500 hover:text-brand hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(comp)}
                    className="p-1.5 text-gray-500 hover:text-info hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Company"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(comp)}
                    className="p-1.5 text-gray-500 hover:text-danger hover:bg-gray-100 rounded-lg transition-colors"
                    title="Delete Company"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card mb-6 overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Industry</th>
                  <th>Relationship</th>
                  <th>Lead Contact</th>
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th>Spend</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedData.map(comp => (
                  <tr key={comp.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${logoTone(comp)}`}>
                          {comp.logoText || 'CO'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{comp.name}</p>
                          <span className="badge-secondary text-2xs">{comp.category}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-xs text-gray-700">{comp.industry}</span></td>
                    <td><StatusBadge status={comp.relationship} /></td>
                    <td>
                      <p className="text-xs font-semibold text-gray-900">{comp.contactPerson}</p>
                      <p className="text-2xs text-gray-400">{comp.contactRole}</p>
                    </td>
                    <td>
                      <p className="text-xs text-gray-700">{comp.email}</p>
                      <p className="text-2xs text-gray-400">{comp.phone}</p>
                    </td>
                    <td><span className="text-xs text-gray-600">{comp.location}</span></td>
                    <td>
                      <span className="text-xs font-bold text-brand">
                        {formatCurrency(comp.totalSpent)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewCompany(comp)}
                          className="p-1.5 text-gray-500 hover:text-brand rounded-lg hover:bg-gray-100"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(comp)}
                          className="p-1.5 text-gray-500 hover:text-info rounded-lg hover:bg-gray-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(comp)}
                          className="p-1.5 text-gray-500 hover:text-danger rounded-lg hover:bg-gray-100"
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
      )}

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
        title={editCompany ? 'Edit Company Profile' : 'Add New Company'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="companies-submit-form" className="btn-primary">
              {editCompany ? 'Update Company' : 'Save Organization'}
            </button>
          </>
        }
      >
        <form id="companies-submit-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="companies-field-1" className="form-label">Company Name *</label>
              <input id="companies-field-1"
                type="text"
                required
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Industrial Solutions"
              />
            </div>
            <div>
              <label htmlFor="companies-field-2" className="form-label">Industry *</label>
              <input id="companies-field-2"
                type="text"
                required
                className="form-input"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Industrial Equipment"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="companies-field-3" className="form-label">Relationship</label>
              <select id="companies-field-3"
                className="form-select"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              >
                <option value="Customer">Customer</option>
                <option value="Partner">Partner</option>
                <option value="Supplier">Supplier</option>
                <option value="Prospect">Prospect</option>
              </select>
            </div>
            <div>
              <label htmlFor="companies-field-4" className="form-label">Category</label>
              <select id="companies-field-4"
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Enterprise">Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="SMB">SMB</option>
              </select>
            </div>
            <div>
              <label htmlFor="companies-field-5" className="form-label">Total Spend (PKR)</label>
              <input id="companies-field-5"
                type="number"
                min="0"
                className="form-input"
                value={formData.totalSpent}
                onChange={(e) => setFormData({ ...formData, totalSpent: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="companies-field-6" className="form-label">Primary Contact Person</label>
              <input id="companies-field-6"
                type="text"
                className="form-input"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Dr. Kamran Hussain"
              />
            </div>
            <div>
              <label htmlFor="companies-field-7" className="form-label">Contact Role</label>
              <input id="companies-field-7"
                type="text"
                className="form-input"
                value={formData.contactRole}
                onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                placeholder="e.g. Quality Director"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="companies-field-8" className="form-label">Email</label>
              <input id="companies-field-8"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="quality@company.com"
              />
            </div>
            <div>
              <label htmlFor="companies-field-9" className="form-label">Phone</label>
              <input id="companies-field-9"
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 (21) 3456-7890"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="companies-field-10" className="form-label">Location (City, State/Province)</label>
              <input id="companies-field-10"
                type="text"
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Karachi, Sindh"
              />
            </div>
            <div>
              <label htmlFor="companies-field-11" className="form-label">Country</label>
              <input id="companies-field-11"
                type="text"
                className="form-input"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Pakistan"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Company Modal */}
      {viewCompany && (
        <Modal
          isOpen={!!viewCompany}
          onClose={() => setViewCompany(null)}
          title={viewCompany.name}
          size="lg"
          footer={
            <button className="btn-secondary" onClick={() => setViewCompany(null)}>Close</button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${logoTone(viewCompany)}`}>
                {viewCompany.logoText || 'CO'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewCompany.name}</h3>
                <p className="text-xs text-gray-500">{viewCompany.industry} • {viewCompany.category}</p>
                <div className="mt-1">
                  <StatusBadge status={viewCompany.relationship} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block mb-0.5">Contact Person</span>
                <span className="font-semibold text-gray-800">{viewCompany.contactPerson}</span>
                <span className="text-gray-500 block">{viewCompany.contactRole}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Location</span>
                <span className="font-semibold text-gray-800">{viewCompany.location}</span>
                <span className="text-gray-500 block">{viewCompany.country}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Email</span>
                <span className="font-semibold text-gray-800 break-all">{viewCompany.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Phone</span>
                <span className="font-semibold text-gray-800">{viewCompany.phone}</span>
              </div>
            </div>

            <div className="p-3 bg-primary-50 rounded-xl border border-primary-300/70 flex justify-between items-center">
              <div>
                <span className="text-2xs text-gray-500 uppercase tracking-wide block">Lifetime Spend</span>
                <span className="text-base font-bold text-brand">{formatCurrency(viewCompany.totalSpent)}</span>
              </div>
              <span className="badge-primary">{viewCompany.activeDeals} Active Deals</span>
            </div>

            <CompanyRelations company={viewCompany} />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove Company"
        message={`Are you sure you want to remove "${deleteConfirm?.name}"? Associated audit logs and contacts will be unlinked.`}
      />
    </div>
  );
}
