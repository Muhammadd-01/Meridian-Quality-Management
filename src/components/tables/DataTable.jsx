import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';

export default function DataTable({ columns, data, sortKey, sortDir, onSort, pagination, emptyTitle, emptyDescription, actions }) {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        : <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="w-20">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && <td>{actions(row)}</td>}
              </tr>
            ))}
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
        />
      )}
    </div>
  );
}
