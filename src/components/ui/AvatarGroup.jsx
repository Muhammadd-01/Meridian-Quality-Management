import React from 'react';

const colors = [
  'bg-primary/20 text-primary',
  'bg-info/20 text-info',
  'bg-accent/20 text-accent',
  'bg-warning/20 text-warning',
  'bg-success/20 text-success',
  'bg-danger/20 text-danger',
];

export default function AvatarGroup({ names = [], max = 3, size = 'sm' }) {
  const shown = names.slice(0, max);
  const extra = names.length - max;
  const sizes = { xs: 'w-6 h-6 text-2xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };

  return (
    <div className="flex -space-x-2">
      {shown.map((name, i) => (
        <div
          key={i}
          className={`${sizes[size]} rounded-full border-2 border-white flex items-center justify-center font-medium ${colors[i % colors.length]}`}
          title={name}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className={`${sizes[size]} rounded-full border-2 border-white flex items-center justify-center font-medium bg-gray-100 text-gray-500`}>
          +{extra}
        </div>
      )}
    </div>
  );
}
