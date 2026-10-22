import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import { TableSkeleton } from '../ui/Skeleton';

/**
 * Optional extras (all backwards compatible):
 *  - loading: show skeleton rows
 *  - selectable + selectedIds (Set) + onToggleRow(id) + onToggleAll(ids): row selection
 *  - pagination.setPageSize: shows a rows-per-page selector
 *  - caption: accessible table caption (visually hidden)
 */
export default function DataTable({
  columns, data, sortKey, sortDir, onSort, pagination, emptyTitle, emptyDescription, actions,
  loading = false, selectable = false, selectedIds, onToggleRow, onToggleAll, caption,
}) {
  if (loading) {
    return <TableSkeleton rows={5} cols={Math.min(columns.length, 6)} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const visibleIds = data.map(r => r.id);
  const allSelected = selectable && visibleIds.length > 0 && visibleIds.every(id => selectedIds?.has(id));

  return (
    <div>
      <div className="table-container">
        <table className="data-table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {selectable && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={allSelected}
                    onChange={() => onToggleAll?.(visibleIds, !allSelected)}
                    className="accent-[#2C5F6F]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={col.sortable && sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort?.(col.key)}
                      className={`inline-flex items-center gap-1 uppercase tracking-[0.05em] font-semibold ${col.align === 'right' ? 'ml-auto' : ''}`}
                    >
                      {col.label}
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />
                        : <ArrowUpDown size={12} className="text-gray-300" aria-hidden="true" />}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">{col.label}</div>
                  )}
                </th>
              ))}
              {actions && <th className="w-20">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const selected = selectable && selectedIds?.has(row.id);
              return (
                <tr key={row.id || idx} className={selected ? 'is-selected' : ''}>
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${idx + 1}`}
                        checked={!!selected}
                        onChange={() => onToggleRow?.(row.id)}
                        className="accent-[#2C5F6F]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={col.align === 'right' ? 'text-right tabular-nums' : ''}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && (
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
      )}
    </div>
  );
}
