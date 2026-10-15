import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description = 'Try adjusting your filters or search query.', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 grid place-items-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
