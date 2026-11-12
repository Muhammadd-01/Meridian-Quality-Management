import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { HOME_PATH, visibleTarget } from '../../app/features';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-1 flex-wrap">
      <Link to={HOME_PATH} className="text-gray-400 hover:text-brand transition-colors" aria-label="Home">
        <Home size={14} aria-hidden="true" />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} className="text-gray-300" aria-hidden="true" />
          {visibleTarget(item.href) ? (
            <Link to={visibleTarget(item.href)} className="text-gray-400 hover:text-brand transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-600 font-medium" aria-current="page">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
