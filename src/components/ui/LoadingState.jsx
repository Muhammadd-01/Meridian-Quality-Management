import React from 'react';
import MeridianLoader, { LoadingDots } from './MeridianLoader';

/** Inline loading block for pages, cards and tables, in the Meridian style. */
export default function LoadingState({ text = 'Loading' }) {
  const label = String(text).replace(/[.…]+$/, '');
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3.5 animate-fade-in">
      <MeridianLoader size={56} label={label} />
      <p className="text-sm font-medium text-gray-500">{label}<LoadingDots /></p>
    </div>
  );
}
