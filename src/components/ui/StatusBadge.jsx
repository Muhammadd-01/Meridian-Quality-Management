import React from 'react';

const statusStyles = {
  active: 'bg-success-50 text-success-600',
  completed: 'bg-success-50 text-success-600',
  won: 'bg-success-50 text-success-600',
  closed: 'bg-success-50 text-success-600',
  pending: 'bg-warning-50 text-warning-600',
  'in-progress': 'bg-info-50 text-info-600',
  'in progress': 'bg-info-50 text-info-600',
  contacted: 'bg-info-50 text-info-600',
  new: 'bg-primary-100 text-brand-strong',
  qualified: 'bg-teal-50 text-teal-700',
  proposal: 'bg-primary-100 text-brand-strong',
  overdue: 'bg-danger-50 text-danger-600',
  lost: 'bg-danger-50 text-danger-600',
  cancelled: 'bg-danger-50 text-danger-600',
  high: 'bg-danger-50 text-danger-600',
  medium: 'bg-warning-50 text-warning-600',
  low: 'bg-success-50 text-success-600',
  critical: 'bg-danger-50 text-danger-600',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status, className = '' }) {
  const key = status?.toLowerCase() || '';
  const style = statusStyles[key] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${style} ${className}`}>
      {status}
    </span>
  );
}
