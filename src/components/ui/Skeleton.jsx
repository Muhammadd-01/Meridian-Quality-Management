import React from 'react';

/** Loading placeholder that respects reduced-motion (pulse disabled in CSS). */
export default function Skeleton({ className = '', lines = 1 }) {
  if (lines > 1) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`skeleton h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'} ${className}`} />
        ))}
      </div>
    );
  }
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="p-4 space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, c) => <div key={c} className="skeleton h-4" />)}
        </div>
      ))}
    </div>
  );
}
