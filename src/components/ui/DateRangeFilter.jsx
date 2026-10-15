import React from 'react';
import { Calendar } from 'lucide-react';

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="form-input pl-9 text-sm w-36"
        />
      </div>
      <span className="text-gray-400 text-sm">to</span>
      <div className="relative">
        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="form-input pl-9 text-sm w-36"
        />
      </div>
    </div>
  );
}
