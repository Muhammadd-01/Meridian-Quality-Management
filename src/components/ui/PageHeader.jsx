import React from 'react';

/**
 * Page heading. The breadcrumb trail is shown once, in the layout's page bar,
 * so the `breadcrumbs` prop is accepted for compatibility but not rendered.
 */
// eslint-disable-next-line no-unused-vars
export default function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-rise-in">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] leading-tight font-extrabold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-gray-500 mt-1 max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
