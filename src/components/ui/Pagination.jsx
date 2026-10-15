import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, startIndex, endIndex }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{startIndex}</span> to{' '}
        <span className="font-medium">{endIndex}</span> of{' '}
        <span className="font-medium">{totalItems}</span> entries
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-outline btn-sm !px-2 disabled:opacity-40"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`btn-sm !px-3 ${p === currentPage ? 'btn-primary' : 'btn-outline'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-outline btn-sm !px-2 disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
