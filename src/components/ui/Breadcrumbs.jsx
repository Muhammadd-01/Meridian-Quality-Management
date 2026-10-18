import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-1 flex-wrap">
      <Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors" aria-label="Home">
        <Home size={14} aria-hidden="true" />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} className="text-gray-300" aria-hidden="true" />
          {item.href ? (
            <Link to={item.href} className="text-gray-400 hover:text-primary transition-colors">
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
