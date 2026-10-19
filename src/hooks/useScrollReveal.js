import { useEffect } from 'react';

const TARGETS = 'section, .card, [data-reveal]';
const SKIP = '[role="dialog"], [data-no-reveal]';
const STAGGER_MS = 70;
const MAX_STAGGER = 6;

/**
 * Reveals cards and sections inside `rootRef` as they scroll into view
 * (fade + rise, staggered among siblings). Only the outermost matching element
 * is animated, and the classes are removed afterwards so nothing keeps a
 * transform (fixed dialogs stay correct) and hover transitions are not delayed.
 * Re-scans when the route changes or new content is rendered.
 */
export default function useScrollReveal(rootRef, routeKey, enabled = true) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || typeof IntersectionObserver === 'undefined') return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.classList.contains('reduce-motion');
    if (reduce) return undefined;

    const timers = new Set();
    const finish = (el) => {
      el.classList.add('is-revealed');
      const delay = parseInt(el.style.getPropertyValue('--reveal-delay') || '0', 10);
      const t = setTimeout(() => {
        el.classList.remove('reveal', 'is-revealed');
        el.style.removeProperty('--reveal-delay');
        timers.delete(t);
      }, 850 + delay);
      timers.add(t);
    };

    const io = new IntersectionObserver((entries) => {
      // Stagger the elements that become visible together, in document order.
      const visible = entries.filter(e => e.isIntersecting).map(e => e.target);
      visible.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', `${Math.min(i, MAX_STAGGER) * STAGGER_MS}ms`);
        io.unobserve(el);
        finish(el); // .reveal was applied at scan time, so the transition still runs
      });
    }, { root, threshold: 0.06, rootMargin: '0px 0px -4% 0px' });

    const scan = () => {
      const rootBox = root.getBoundingClientRect();
      let onScreen = 0;
      root.querySelectorAll(TARGETS).forEach(el => {
        if (el.dataset.revealDone || el.closest(SKIP)) return;
        el.dataset.revealDone = '1';
        // Animate only the outermost target; nested cards ride along.
        const parent = el.parentElement?.closest(TARGETS);
        if (parent && root.contains(parent)) return;
        el.classList.add('reveal');
        // Already on screen: reveal straight away (staggered) without waiting for the observer.
        const box = el.getBoundingClientRect();
        if (box.top < rootBox.bottom && box.bottom > rootBox.top) {
          el.style.setProperty('--reveal-delay', `${Math.min(onScreen, MAX_STAGGER) * STAGGER_MS}ms`);
          onScreen += 1;
          void el.offsetWidth; // commit the hidden state so the transition runs
          finish(el);
          return;
        }
        io.observe(el);
      });
    };

    scan();
    let pending = false;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      setTimeout(() => { pending = false; scan(); }, 40);
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      timers.forEach(clearTimeout);
      root.querySelectorAll('.reveal').forEach(el => el.classList.remove('reveal', 'is-revealed'));
    };
  }, [rootRef, routeKey, enabled]);
}
