import React from 'react';

export default function ProgressBar({ value = 0, size = 'md', color = 'bg-primary', showLabel = true, className = '' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  // The default colour gets the theme gradient; custom colours are kept as passed.
  const fill = color === 'bg-primary' ? 'bg-gradient-to-r from-primary-300 to-primary-500' : color;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`progress-fill ${fill} ${heights[size]} rounded-full transition-[width] duration-700 ease-spring`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-semibold text-gray-600 w-10 text-right tabular-nums">{clamped}%</span>}
    </div>
  );
}
