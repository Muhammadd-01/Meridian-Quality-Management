import React from 'react';

export default function ProgressBar({ value = 0, size = 'md', color = 'bg-primary', showLabel = true, className = '' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${color} ${heights[size]} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-500 w-10 text-right">{clamped}%</span>}
    </div>
  );
}
