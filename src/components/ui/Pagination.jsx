import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_SIZES = [5, 10, 25, 50];

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, startIndex, endIndex, pageSize, onPageSizeChange, pageSizeOptions = DEFAULT_SIZES }) {
  const showSizer = typeof onPageSizeChange === 'function' && totalItems > Math.min(...pageSizeOptions);
  if (totalPages <= 1 && !showSizer) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <p className="text-sm text-gray-500" aria-live="polite">
          Showing <span className="font-medium">{startIndex}</span> to{' '}
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{totalItems}</span> entries
        </p>
        {showSizer && (
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            Rows
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="form-select !py-1 !text-xs !w-auto"
            >
              {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="btn-outline btn-sm !px-2 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={`btn-sm !px-3 ${p === currentPage ? 'btn-primary' : 'btn-outline'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="btn-outline btn-sm !px-2 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </nav>
  );
}
