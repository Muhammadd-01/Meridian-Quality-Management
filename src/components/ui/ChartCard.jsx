import React from 'react';

export default function ChartCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
