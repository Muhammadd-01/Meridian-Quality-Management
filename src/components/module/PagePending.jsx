import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hammer, ArrowRight } from 'lucide-react';
import { CATALOG_PAGES } from '../../modules/catalog';
import { DashboardHero } from './DashboardKit';

/** Shown on catalogue pages that have not been built yet. */
export default function PagePending() {
  const { pathname } = useLocation();
  const page = CATALOG_PAGES.find(p => p.path === pathname);
  const siblings = page ? CATALOG_PAGES.filter(p => p.section.id === page.section.id && p.path !== pathname) : [];
  const Icon = page?.icon || Hammer;

  return (
    <div className="space-y-4">
      <DashboardHero
        eyebrow={page?.section.title || 'Module'}
        title={page?.label || 'Page'}
        subtitle={page?.blurb || 'This page is part of the module catalogue and is being built.'}
        icon={Icon}
        tone="spruce"
      />
      <section className="card card-body flex items-start gap-4">
        <span className="icon-tile w-11 h-11 bg-accent-50 text-accent-600"><Hammer size={18} aria-hidden="true" /></span>
        <div>
          <h2 className="text-[15px] font-bold text-gray-900">Being built</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            The route, navigation and data plumbing for this page are in place. Its screens are being implemented now
            and will appear here automatically — nothing else needs to change.
          </p>
        </div>
      </section>
      {siblings.length > 0 && (
        <section className="card card-body">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">More in {page.section.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {siblings.map(s => (
              <Link key={s.path} to={s.path} className="group flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:border-primary-200 hover:bg-gray-50 transition-colors">
                <span className="icon-tile w-9 h-9 bg-primary-50 text-primary-600"><s.icon size={16} aria-hidden="true" /></span>
                <span className="flex-1 min-w-0 text-sm font-semibold text-gray-800 truncate">{s.label}</span>
                <ArrowRight size={14} className="text-gray-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
