import React, { useState, useId } from 'react';
import { Info } from 'lucide-react';

/** Small accessible tooltip: shows on hover and keyboard focus. */
export default function InfoTip({ text, className = '' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className={`relative inline-flex normal-case tracking-normal ${className}`}>
      <span
        role="button"
        tabIndex={0}
        aria-describedby={id}
        aria-label="More information"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        className="inline-grid place-items-center text-gray-400 hover:text-primary cursor-help rounded-full"
      >
        <Info size={12} aria-hidden="true" />
      </span>
      <span
        id={id}
        role="tooltip"
        className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 px-2.5 py-2 rounded-lg bg-secondary-800 text-white text-[11px] font-normal leading-snug shadow-dropdown z-40 transition-opacity duration-150 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {text}
      </span>
    </span>
  );
}
