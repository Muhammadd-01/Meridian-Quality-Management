import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description = 'Try adjusting your filters or search query.', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center animate-fade-in">
      <div className="relative mb-5">
        <span className="absolute inset-0 rounded-3xl bg-primary-400/20 blur-xl" aria-hidden="true" />
        <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-50 to-gray-100 border border-gray-200 grid place-items-center animate-float">
          <Icon size={28} className="text-primary-500" />
        </div>
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
