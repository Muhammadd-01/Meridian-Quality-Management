/**
 * Commerce copy of src/components/module/ModuleListPage (that kit is frozen).
 * Same props, plus:
 *   onCreate()            — replaces the generic add form (e.g. order line-item editor)
 *   onEdit(record)        — replaces the generic edit form
 *   bulkActions(selected, clear) — extra buttons in the bulk-selection bar
 *
 * Config-driven record page for any collection registered in the entity
 * registry (src/data/entities.js or a module's entities.js).
 *
 * Gives every module the same behaviour: KPI cards, search (also from ?q=),
 * filters, sortable + paginated table or card grid, view / add / edit / delete,
 * bulk delete, duplicate checks, import/export and Quick Create (?action=new).
 *
 *   <ModuleListPage
 *     entityType="customers"
 *     title="Customers" subtitle="…"
 *     kpis={(records) => [{ title, value, icon, tone, subtitle, spark }]}
 *     columns={[{ key, label, sortable, align, render: (r) => node }]}   // default: first 6 entity fields
 *     filters={[{ key: 'status', label: 'All statuses' }]}             // options from the field or the data
 *     tabs={[{ id: 'open', label: 'Open', filter: (r) => … }]}          // optional quick tabs
 *     renderCard={(r, actions) => node}                                 // enables a grid view toggle
 *     rowActions={(r) => [{ label, icon, onClick, tone }]}              // extra per-row buttons
 *     detail={(r, update) => node}                                      // extra content in the detail dialog
 *     createLabel="Add customer"  headerActions={node}  beforeTable={node}
 *     formFields={[…]}   // default: entity fields (type: text|number|date|email|enum|list|textarea)
 *   />
 */
import React, { useMemo, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import SearchInput from '../../../components/ui/SearchInput';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';
import DataTable from '../../../components/tables/DataTable';
import { useToast } from '../../../components/ui/Toast';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useCollection from '../../../hooks/useCollection';
import useQuickAction from '../../../hooks/useQuickAction';
import useSearch from '../../../hooks/useSearch';
import useSort from '../../../hooks/useSort';
import usePagination from '../../../hooks/usePagination';
import { ENTITIES } from '../../../data/entities';
import { dedupeSignature } from '../../../utils/dataTransfer';
import { formatCurrency, formatDate, generateId } from '../../../utils/format';
import { KpiGrid } from '../../../components/module/DashboardKit';

const isMoney = (f) => /\b(PKR|amount|price|value|total|balance|salary|revenue|cost|fee)\b/i.test(f.label);

/** Default cell rendering by field type. */
export function renderValue(field, value) {
  if (value === undefined || value === null || value === '') return <span className="text-gray-400">—</span>;
  if (field.type === 'enum') return <StatusBadge status={String(value)} />;
  if (field.type === 'date') return formatDate(value);
  if (field.type === 'number') return isMoney(field) ? formatCurrency(Number(value)) : Number(value).toLocaleString();
  if (field.type === 'list') return (Array.isArray(value) ? value : [value]).join(', ');
  return String(value);
}

const toFormValue = (field, v) => {
  if (v === undefined || v === null) return '';
  if (field.type === 'list') return Array.isArray(v) ? v.join(', ') : String(v);
  return String(v);
};

function coerce(field, raw) {
  const v = typeof raw === 'string' ? raw.trim() : raw;
  if (v === '' || v === undefined) return undefined;
  if (field.type === 'number') return Number(v);
  if (field.type === 'list') return String(v).split(',').map(s => s.trim()).filter(Boolean);
  return v;
}

export default function ModuleListPage({
  entityType, title, subtitle, kpis, columns, filters = [], tabs, renderCard, rowActions, detail,
  createLabel, headerActions, beforeTable, formFields, pageSize = 10, emptyTitle, defaultSort,
  onCreate, onEdit, bulkActions,
}) {
  const entity = ENTITIES[entityType];
  if (!entity) throw new Error(`ModuleListPage: unknown entity type "${entityType}". Register it in an entities.js file.`);
  const [records, setRecords] = useCollection(entityType);
  const addToast = useToast();
  const fields = formFields || entity.fields.filter(f => !f.accessor && f.form !== false);

  const [view, setView] = useState('table');
  const [tab, setTab] = useState(tabs?.[0]?.id);
  const [filterValues, setFilterValues] = useState({});
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  const { query, setQuery, filtered: searched } = useSearch(records, entity.searchFields);

  const filterDefs = filters.map(f => {
    const field = entity.fields.find(x => x.key === f.key) || { key: f.key, label: f.label };
    const options = f.options || field.options || [...new Set(records.map(r => r[f.key]).filter(Boolean))].sort();
    return { ...f, field, options };
  });

  const visible = useMemo(() => {
    const tabDef = tabs?.find(t => t.id === tab);
    return searched.filter(r =>
      (!tabDef?.filter || tabDef.filter(r)) &&
      filterDefs.every(f => !filterValues[f.key] || filterValues[f.key] === 'All' || String(r[f.key]) === filterValues[f.key]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, tab, filterValues, tabs]);

  const { sorted, sortKey, sortDir, toggleSort } = useSort(visible, defaultSort?.key || '', defaultSort?.dir || 'asc');
  const pagination = usePagination(sorted, pageSize);

  // ── Form ──
  const openCreate = () => {
    if (onCreate) { onCreate(); return; }
    setEditing(null);
    setForm(Object.fromEntries(fields.map(f => [f.key, f.type === 'enum' ? (f.options?.[0] ?? '') : ''])));
    setErrors({});
    setFormOpen(true);
  };
  useQuickAction('new', openCreate);

  const openEdit = (r) => {
    if (onEdit) { onEdit(r); return; }
    setEditing(r);
    setForm(Object.fromEntries(fields.map(f => [f.key, toFormValue(f, r[f.key])])));
    setErrors({});
    setFormOpen(true);
  };

  const submit = (e) => {
    e.preventDefault();
    const data = {};
    const errs = {};
    fields.forEach(f => {
      const value = coerce(f, form[f.key]);
      if (f.required && (value === undefined || value === '')) errs[f.key] = `${f.label} is required`;
      else if (f.type === 'number' && value !== undefined && Number.isNaN(value)) errs[f.key] = `${f.label} must be a number`;
      else if (f.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errs[f.key] = 'Enter a valid email address';
      else if (f.type === 'number' && value !== undefined && f.min !== undefined && value < f.min) errs[f.key] = `${f.label} must be at least ${f.min}`;
      if (value !== undefined) data[f.key] = value;
    });
    if (!errs.__dupe) {
      const dupe = (entity.dedupeKeys || []).map(keys => {
        const sig = dedupeSignature({ ...editing, ...data }, keys);
        return sig && records.find(r => r.id !== editing?.id && dedupeSignature(r, keys) === sig);
      }).find(Boolean);
      if (dupe) errs.__dupe = `A ${entity.singular.toLowerCase()} matching "${entity.title(dupe)}" already exists.`;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      setRecords(prev => prev.map(r => (r.id === editing.id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)));
      addToast(`${entity.singular} updated.`, 'success');
    } else {
      const base = entity.defaults ? entity.defaults(data) : {};
      setRecords(prev => [{ ...base, ...data, id: `${entityType}-${generateId()}`, createdAt: new Date().toISOString() }, ...prev]);
      addToast(`${entity.singular} added.`, 'success');
    }
    setFormOpen(false);
  };

  const updateRecord = (id, patch) => setRecords(prev => prev.map(r => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)));

  const confirmDelete = () => {
    if (!deleting) return;
    setRecords(prev => prev.filter(r => r.id !== deleting.id));
    addToast(`${entity.singular} deleted.`, 'success');
    setDeleting(null);
  };

  // ── Table ──
  const actionsFor = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewing(r), tone: 'primary' },
    { label: 'Edit', icon: Pencil, onClick: () => openEdit(r), tone: 'info' },
    ...(rowActions ? rowActions(r) : []),
    { label: 'Delete', icon: Trash2, onClick: () => setDeleting(r), tone: 'danger' },
  ];
  const toneHover = { primary: 'hover:text-primary', info: 'hover:text-info', danger: 'hover:text-danger', success: 'hover:text-success', warning: 'hover:text-warning' };
  const ActionButtons = ({ r }) => (
    <div className="flex items-center gap-0.5">
      {actionsFor(r).map(a => (
        <button key={a.label} type="button" onClick={a.onClick} title={a.label} aria-label={`${a.label} ${entity.title(r)}`}
          className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${toneHover[a.tone] || 'hover:text-gray-900'}`}>
          <a.icon size={14} />
        </button>
      ))}
    </div>
  );

  const baseColumns = columns || entity.fields.filter(f => !f.accessor).slice(0, 6).map((f, i) => ({
    key: f.key,
    label: f.label,
    sortable: true,
    align: f.type === 'number' ? 'right' : undefined,
    render: i === 0
      ? (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold text-gray-900">{renderValue(f, r[f.key])}</span>
          {r.isDemo && <span className="badge-warning text-2xs" title="Seeded demo record">Demo</span>}
        </span>
      )
      : (r) => renderValue(f, r[f.key]),
  }));
  const tableColumns = [...baseColumns, { key: '__actions', label: 'Actions', render: (r) => <ActionButtons r={r} /> }];

  const kpiItems = kpis ? kpis(records) : null;
  const singular = entity.singular;

  return (
    <div className="space-y-5">
      <PageHeader
        title={title || entity.label}
        subtitle={subtitle}
        actions={(
          <>
            {headerActions}
            <DataTransferActions entityType={entityType} records={records} setRecords={setRecords} filtered={sorted} selected={records.filter(r => selectedIds.has(r.id))} />
            {renderCard && (
              <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                {[['table', List, 'Table view'], ['grid', LayoutGrid, 'Card view']].map(([v, Icon, label]) => (
                  <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} title={label}
                    className={`p-2 transition-colors ${view === v ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={openCreate} className="btn-primary">
              <Plus size={16} aria-hidden="true" /> {createLabel || `Add ${singular}`}
            </button>
          </>
        )}
      />

      {kpiItems && <KpiGrid items={kpiItems} cols={Math.min(kpiItems.length, 4)} />}
      {beforeTable}

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            <div className="w-full sm:w-72"><SearchInput value={query} onChange={setQuery} placeholder={`Search ${entity.label.toLowerCase()}…`} /></div>
            {tabs && (
              <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label={`${entity.label} views`}>
                {tabs.map(t => {
                  const count = searched.filter(r => !t.filter || t.filter(r)).length;
                  return (
                    <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${tab === t.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {t.label} <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {filterDefs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {filterDefs.map(f => (
                <FilterDropdown
                  key={f.key}
                  value={filterValues[f.key] || 'All'}
                  onChange={(v) => setFilterValues(prev => ({ ...prev, [f.key]: v }))}
                  options={[{ value: 'All', label: f.label || `All ${f.field.label}` }, ...f.options.map(o => ({ value: String(o), label: String(o) }))]}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="card px-4 py-3 flex flex-wrap items-center gap-3 bg-primary-50 border-primary-100 animate-fade-in" role="region" aria-label="Bulk actions">
          <span className="text-sm font-semibold text-primary">{selectedIds.size} selected</span>
          {bulkActions && bulkActions(records.filter(r => selectedIds.has(r.id)), () => setSelectedIds(new Set()))}
          <button type="button" className="btn-outline btn-sm text-danger" onClick={() => setBulkDelete(true)}><Trash2 size={13} aria-hidden="true" /> Delete</button>
          <button type="button" className="text-xs text-gray-500 hover:underline ml-auto" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
        </div>
      )}

      {view === 'grid' && renderCard ? (
        <>
          {pagination.paginatedData.length === 0 ? (
            <div className="card card-body text-center text-sm text-gray-500">{emptyTitle || `No ${entity.label.toLowerCase()} match your filters.`}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pagination.paginatedData.map(r => (
                <div key={r.id} className="card card-lift overflow-hidden flex flex-col">
                  <div className="flex-1">{renderCard(r)}</div>
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex justify-end"><ActionButtons r={r} /></div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.goToPage}
            totalItems={pagination.totalItems} startIndex={pagination.startIndex} endIndex={pagination.endIndex}
          />
        </>
      ) : (
        <div className="card overflow-hidden">
          <DataTable
            caption={entity.label}
            columns={tableColumns}
            data={pagination.paginatedData}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            pagination={pagination}
            selectable
            selectedIds={selectedIds}
            onToggleRow={(id) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
            onToggleAll={(ids, select) => setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => (select ? n.add(id) : n.delete(id))); return n; })}
            emptyTitle={emptyTitle || `No ${entity.label.toLowerCase()} found`}
            emptyDescription={records.length ? 'Try adjusting your search or filters.' : `Add a ${singular.toLowerCase()} or import a file to get started.`}
          />
        </div>
      )}

      {/* Add / edit */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${singular}` : `Add ${singular}`}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" form={`${entityType}-form`} className="btn-primary">{editing ? 'Save changes' : `Save ${singular}`}</button>
          </>
        )}
      >
        <form id={`${entityType}-form`} onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
          {errors.__dupe && <p role="alert" className="sm:col-span-2 text-xs text-danger-700 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2">{errors.__dupe}</p>}
          {fields.map(f => {
            const id = `${entityType}-field-${f.key}`;
            const err = errors[f.key];
            const common = {
              id, value: form[f.key] ?? '', 'aria-invalid': !!err, 'aria-describedby': err ? `${id}-error` : undefined,
              onChange: (e) => { setForm(prev => ({ ...prev, [f.key]: e.target.value })); setErrors(prev => ({ ...prev, [f.key]: undefined, __dupe: undefined })); },
            };
            const wide = f.type === 'textarea' || f.wide;
            return (
              <div key={f.key} className={wide ? 'sm:col-span-2' : ''}>
                <label htmlFor={id} className="form-label">{f.label}{f.required && <span className="text-danger"> *</span>}</label>
                {f.type === 'enum' ? (
                  <select {...common} className="form-select">
                    {!f.required && <option value="">—</option>}
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea {...common} rows={3} className="form-input" placeholder={f.placeholder} />
                ) : (
                  <input
                    {...common}
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
                    min={f.min} max={f.max} step={f.step || (f.type === 'number' ? 'any' : undefined)}
                    className="form-input"
                    placeholder={f.placeholder || (f.type === 'list' ? 'Comma separated' : undefined)}
                  />
                )}
                {err && <p id={`${id}-error`} className="form-error">{err}</p>}
              </div>
            );
          })}
        </form>
      </Modal>

      {/* Detail */}
      {viewing && (() => {
        const live = records.find(r => r.id === viewing.id) || viewing;
        return (
          <Modal
            isOpen
            onClose={() => setViewing(null)}
            title={entity.title(live)}
            size="lg"
            footer={(
              <>
                <button type="button" className="btn-outline" onClick={() => { setViewing(null); openEdit(live); }}><Pencil size={14} aria-hidden="true" /> Edit</button>
                <button type="button" className="btn-secondary" onClick={() => setViewing(null)}>Close</button>
              </>
            )}
          >
            <div className="space-y-4">
              {live.isDemo && <span className="badge-warning">Demo record</span>}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {entity.fields.filter(f => !f.accessor).map(f => (
                  <div key={f.key} className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{f.label}</dt>
                    <dd className="text-gray-900 mt-0.5 break-words">{renderValue(f, live[f.key])}</dd>
                  </div>
                ))}
              </dl>
              {detail && <div className="pt-3 border-t border-gray-100">{detail(live, (patch) => updateRecord(live.id, patch))}</div>}
            </div>
          </Modal>
        );
      })()}

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Delete ${singular.toLowerCase()}`}
        message={deleting ? `Delete "${entity.title(deleting)}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={bulkDelete}
        onClose={() => setBulkDelete(false)}
        onConfirm={() => {
          const n = selectedIds.size;
          setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
          setSelectedIds(new Set());
          setBulkDelete(false);
          addToast(`${n} ${entity.label.toLowerCase()} deleted.`, 'success');
        }}
        title={`Delete selected ${entity.label.toLowerCase()}`}
        message={`Permanently delete ${selectedIds.size} selected record(s)? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
