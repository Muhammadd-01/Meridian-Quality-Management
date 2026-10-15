import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-1">
      <Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors">
        <Home size={14} />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} className="text-gray-300" />
          {item.href ? (
            <Link to={item.href} className="text-gray-400 hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-600 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
