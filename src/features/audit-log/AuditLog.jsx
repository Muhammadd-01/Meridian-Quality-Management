import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Info } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import DataTable from '../../components/tables/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import ExportDialog from '../../components/data-transfer/ExportDialog';
import useLocalStorage from '../../hooks/useLocalStorage';
import usePagination from '../../hooks/usePagination';
import { AUDIT_LOG_KEY, ACTION_LABELS } from '../../lib/auditLog';
import { ENTITY_LIST } from '../../data/entities';
import { formatRelative } from '../../utils/format';

const actionBadge = {
  created: 'badge-success',
  imported: 'badge-success',
  updated: 'badge-info',
  status_changed: 'badge-warning',
  assigned: 'badge-accent',
  deleted: 'badge-danger',
  exported: 'badge-secondary',
};

export default function AuditLog() {
  const [log] = useLocalStorage(AUDIT_LOG_KEY, []);
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  const entries = Array.isArray(log) ? log : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(e => {
      if (entityFilter !== 'All' && e.entityType !== entityFilter) return false;
      if (actionFilter !== 'All' && e.action !== actionFilter) return false;
      const day = String(e.at).slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (!q) return true;
      return [e.recordName, e.details, e.entityLabel, e.actor].some(v => v && String(v).toLowerCase().includes(q));
    });
  }, [entries, query, entityFilter, actionFilter, from, to]);

  const pagination = usePagination(filtered, 15);

  const columns = [
    {
      key: 'at',
      label: 'When',
      render: e => (
        <span title={new Date(e.at).toLocaleString()} className="text-xs text-gray-600">
          {new Date(e.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          <span className="block text-[11px] text-gray-400">{formatRelative(e.at)}</span>
        </span>
      ),
    },
    { key: 'action', label: 'Action', render: e => <span className={actionBadge[e.action] || 'badge-secondary'}>{ACTION_LABELS[e.action] || e.action}</span> },
    { key: 'entityLabel', label: 'Type', render: e => <span className="text-xs">{e.entityLabel}</span> },
    {
      key: 'recordName',
      label: 'Record',
      render: e => (e.path && e.recordName
        ? <Link to={`${e.path}?q=${encodeURIComponent(e.recordName)}`} className="text-brand font-medium hover:underline">{e.recordName}</Link>
        : <span className="text-gray-500">{e.recordName || '—'}</span>),
    },
    { key: 'details', label: 'Details', render: e => <span className="text-xs text-gray-600 whitespace-normal">{e.details || '—'}</span> },
    { key: 'actor', label: 'By', render: e => <span className="text-xs">{e.actor}</span> },
  ];

  const exportFields = [
    { key: 'at', label: 'Timestamp' },
    { key: 'action', label: 'Action', accessor: e => ACTION_LABELS[e.action] || e.action },
    { key: 'entityLabel', label: 'Type' },
    { key: 'recordName', label: 'Record' },
    { key: 'details', label: 'Details' },
    { key: 'actor', label: 'By' },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Every create, update, status change, assignment, import and export made in this workspace."
        breadcrumbs={[{ label: 'Workspace' }, { label: 'Audit Log' }]}
        actions={<button type="button" className="btn-outline btn-sm" onClick={() => setExportOpen(true)} disabled={!entries.length}>Export</button>}
      />

      <div className="flex items-start gap-3 p-3.5 mb-5 rounded-xl border border-info-100 bg-info-50 text-sm text-secondary-700" role="note">
        <Info size={16} className="text-info shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Entries are recorded automatically when records change in this browser. They are stored locally (last 500 events) and are not a
          server-side, tamper-proof audit trail — that requires a backend.
        </p>
      </div>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <SearchInput value={query} onChange={setQuery} placeholder="Search records, details…" className="lg:col-span-2" />
          <FilterDropdown
            value={entityFilter}
            onChange={setEntityFilter}
            options={[{ value: 'All', label: 'All types' }, ...ENTITY_LIST.map(e => ({ value: e.type, label: e.label })), { value: 'traffic', label: 'Traffic data' }]}
          />
          <FilterDropdown
            value={actionFilter}
            onChange={setActionFilter}
            options={[{ value: 'All', label: 'All actions' }, ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))]}
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} className="form-input text-sm" />
            <input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} className="form-input text-sm" />
          </div>
        </div>
      </div>

      <div className="card p-2">
        {entries.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity recorded yet"
            description="Create, edit, import or export records in any module and the events will appear here."
          />
        ) : (
          <DataTable
            caption="Audit log entries"
            columns={columns}
            data={pagination.paginatedData}
            pagination={pagination}
            emptyTitle="No matching events"
            emptyDescription="Adjust the filters or date range."
          />
        )}
      </div>

      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Audit Log"
        filename="meridian_audit_log"
        fields={exportFields}
        allRecords={entries}
        filteredRecords={filtered}
        entityType="audit"
      />
    </div>
  );
}
