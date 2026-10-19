import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const MARGIN = 8;

/**
 * Positions a floating panel (rendered in a portal with `position: fixed`)
 * next to its trigger. Flips to the opposite side when there is no room and
 * clamps to the viewport, so panels never cause horizontal overflow.
 *
 * placement: 'top' | 'bottom' | 'left' | 'right', align: 'start' | 'center' | 'end'
 */
export function useFloating({ open, triggerRef, floatRef, placement = 'bottom', align = 'center', offset = 8 }) {
  const [state, setState] = useState({ top: -9999, left: -9999, placement, ready: false });

  const update = useCallback(() => {
    const t = triggerRef.current;
    const f = floatRef.current;
    if (!t || !f) return;
    const r = t.getBoundingClientRect();
    const fw = f.offsetWidth;
    const fh = f.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;

    let side = placement;
    if (side === 'bottom' && r.bottom + offset + fh > vh - MARGIN && r.top - offset - fh > MARGIN) side = 'top';
    else if (side === 'top' && r.top - offset - fh < MARGIN && r.bottom + offset + fh < vh - MARGIN) side = 'bottom';
    else if (side === 'right' && r.right + offset + fw > vw - MARGIN) side = r.left - offset - fw > MARGIN ? 'left' : 'bottom';
    else if (side === 'left' && r.left - offset - fw < MARGIN) side = r.right + offset + fw < vw - MARGIN ? 'right' : 'bottom';

    let top;
    let left;
    if (side === 'top' || side === 'bottom') {
      top = side === 'bottom' ? r.bottom + offset : r.top - offset - fh;
      left = align === 'start' ? r.left : align === 'end' ? r.right - fw : r.left + r.width / 2 - fw / 2;
    } else {
      left = side === 'right' ? r.right + offset : r.left - offset - fw;
      top = align === 'start' ? r.top : align === 'end' ? r.bottom - fh : r.top + r.height / 2 - fh / 2;
    }
    left = Math.max(MARGIN, Math.min(left, vw - fw - MARGIN));
    top = Math.max(MARGIN, Math.min(top, vh - fh - MARGIN));
    // Arrow offset along the panel edge, pointing at the trigger's centre.
    const arrow = side === 'top' || side === 'bottom'
      ? Math.max(10, Math.min(fw - 10, r.left + r.width / 2 - left))
      : Math.max(10, Math.min(fh - 10, r.top + r.height / 2 - top));
    setState({ top, left, placement: side, arrow, ready: true });
  }, [triggerRef, floatRef, placement, align, offset]);

  useLayoutEffect(() => {
    if (!open) {
      setState(s => ({ ...s, ready: false }));
      return undefined;
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update]);

  return {
    style: { position: 'fixed', top: state.top, left: state.left, visibility: state.ready ? 'visible' : 'hidden', zIndex: 70 },
    placement: state.placement,
    arrow: state.arrow,
    update,
  };
}

/** Calls onDismiss on outside pointer-down or Escape while `open`. */
export function useDismiss(open, refs, onDismiss) {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (refs.some(r => r.current && r.current.contains(e.target))) return;
      onDismiss('outside');
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss('escape');
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, refs, onDismiss]);
}
