import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { allPages, pageGroup } from '../../app/navigation';

/**
 * Page heading banner: section eyebrow, the page's icon (from the navigation
 * map), title, accent bar, subtitle and actions. The default `variant="brand"`
 * is the deep-teal Meridian band with primrose accents (the palette's header);
 * `variant="soft"` is a light primrose-tinted card.
 * The breadcrumb trail is shown once, in the layout's page bar, so the
 * `breadcrumbs` prop is accepted for compatibility but not rendered.
 */
// eslint-disable-next-line no-unused-vars
export default function PageHeader({ title, subtitle, breadcrumbs, actions, icon, variant }) {
  const { pathname } = useLocation();
  const page = allPages.find(p => p.path === pathname);
  const Icon = icon || page?.icon || LayoutDashboard;
  const group = pageGroup(pathname);
  const brand = (variant || 'brand') === 'brand';

  return (
    <div className={`page-hero mb-6${brand ? ' is-brand' : ''}`} data-no-reveal>
      <Icon className="page-hero-watermark" aria-hidden="true" />
      {brand && <span className="hero-rings hidden md:block" aria-hidden="true" />}
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span className="page-hero-icon hidden sm:grid">
            <Icon size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            {group && group !== 'Main' && (
              brand
                ? <p className="hero-eyebrow mb-1.5">Meridian / {group}</p>
                : <p className="kicker !text-[10.5px] !tracking-[0.16em] mb-1">{group}</p>
            )}
            <h1 className={`font-display text-[24px] leading-tight font-extrabold tracking-tight ${brand ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
            <span className="page-heading-accent" aria-hidden="true" />
            {subtitle && <p className={`text-[13.5px] mt-2 max-w-3xl ${brand ? 'text-white/70' : 'text-gray-500'}`}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="relative flex items-center gap-2 flex-wrap [&>div]:flex-wrap [&>div]:gap-2">{actions}</div>}
      </div>
    </div>
  );
}
