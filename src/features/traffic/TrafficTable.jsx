import React, { useMemo, useState } from 'react';
import { Download, ArrowRight } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import SearchInput from '../../components/ui/SearchInput';
import ExportDialog from '../../components/data-transfer/ExportDialog';
import useSort from '../../hooks/useSort';
import usePagination from '../../hooks/usePagination';
import { formatDuration } from '../../services/traffic/trafficMetrics';
import { TrendBadge, Sparkline } from './TrafficWidgets';

/**
 * Searchable, sortable, paginated table for grouped traffic (landing pages or
 * referrers) with row selection and export of all / filtered / selected rows.
 */
export default function TrafficTable({
  title, subtitle, nameLabel, rows, loading, showConversions = false, filters, onViewDetails, exportName,
}) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'sessions', 'desc');
  const pagination = usePagination(sorted, 5);

  const columns = [
    {
      key: 'name',
      label: nameLabel,
      sortable: true,
      render: r => <span className="font-medium text-gray-800 truncate inline-block max-w-[240px] align-middle" title={r.name}>{r.name}</span>,
    },
    { key: 'sessions', label: 'Sessions', sortable: true, align: 'right', render: r => r.sessions.toLocaleString() },
    { key: 'bounceRate', label: 'Bounce Rate', sortable: true, align: 'right', render: r => (r.bounceRate === null ? '—' : `${r.bounceRate.toFixed(1)}%`) },
    showConversions
      ? { key: 'conversions', label: 'Conversions', sortable: true, align: 'right', render: r => r.conversions.toLocaleString() }
      : { key: 'avgSessionSec', label: 'Avg. Session', sortable: true, align: 'right', render: r => formatDuration(r.avgSessionSec) },
    {
      key: 'trend',
      label: 'Trend',
      sortable: true,
      render: r => (
        <div className="flex items-center gap-2">
          <Sparkline values={r.spark} width={72} height={22} color={r.trend !== null && r.trend < 0 ? '#d0504c' : '#1e9e6b'} />
          <TrendBadge value={r.trend} />
        </div>
      ),
    },
  ];

  const exportFields = [
    { key: 'name', label: nameLabel },
    { key: 'sessions', label: 'Sessions' },
    { key: 'users', label: 'Users' },
    { key: 'bounceRate', label: 'Bounce Rate (%)', accessor: r => (r.bounceRate === null ? '' : r.bounceRate.toFixed(2)) },
    { key: 'avgSessionSec', label: 'Avg. Session (sec)', accessor: r => (r.avgSessionSec === null ? '' : Math.round(r.avgSessionSec)) },
    { key: 'conversions', label: 'Conversions' },
    { key: 'prevSessions', label: 'Previous Period Sessions' },
    { key: 'trend', label: 'Trend (%)', accessor: r => (r.trend === null ? '' : r.trend.toFixed(1)) },
  ];

  const toggleRow = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = (ids, select) => setSelectedIds(prev => {
    const next = new Set(prev);
    ids.forEach(id => (select ? next.add(id) : next.delete(id)));
    return next;
  });

  return (
    <section className="card scroll-mt-24" id={`traffic-${exportName}`} aria-labelledby={`${exportName}-title`}>
      <div className="card-header flex-wrap gap-3">
        <div>
          <h3 id={`${exportName}-title`} className="text-[15px] font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filters}
          <SearchInput value={query} onChange={setQuery} placeholder="Search…" className="w-40 sm:w-48" />
          {onViewDetails && (
            <button type="button" onClick={onViewDetails} className="btn-outline btn-sm">View all <ArrowRight size={13} aria-hidden="true" /></button>
          )}
          <button type="button" onClick={() => setExportOpen(true)} className="btn-outline btn-sm" disabled={loading || rows.length === 0}>
            <Download size={14} aria-hidden="true" /> Export
          </button>
        </div>
      </div>
      <div className="px-2 pb-4">
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-3 py-2 text-xs text-primary bg-primary-50 rounded-lg mt-3">
            <span>{selectedIds.size} selected</span>
            <button type="button" className="font-semibold hover:underline" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
          </div>
        )}
        <DataTable
          caption={title}
          columns={columns}
          data={pagination.paginatedData}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          pagination={pagination}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          emptyTitle={query ? 'No matches' : 'No traffic in this period'}
          emptyDescription={query ? 'Try a different search term.' : 'Pick a different date range or import traffic data.'}
        />
      </div>
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title={title}
        filename={`meridian_${exportName}`}
        fields={exportFields}
        allRecords={rows}
        filteredRecords={sorted}
        selectedRecords={rows.filter(r => selectedIds.has(r.id))}
        entityType="traffic"
      />
    </section>
  );
}
