import React from 'react';
import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <div className="mb-6">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
