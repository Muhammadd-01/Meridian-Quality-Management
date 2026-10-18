import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      // Keep keyboard focus inside the dialog.
      if (e.key === 'Tab' && dialogRef.current) {
        const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog: first form field if present, else the dialog itself.
    const t = setTimeout(() => {
      const root = dialogRef.current;
      if (!root || root.contains(document.activeElement)) return;
      const field = root.querySelector('input:not([type="hidden"]):not([type="file"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      (field || root).focus();
    }, 0);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0c1210]/55 backdrop-blur-[3px] animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative bg-white border border-gray-200 rounded-lg shadow-modal w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-scale-in outline-none`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 id={titleId} className="text-[15px] font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 hover:rotate-90 transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
