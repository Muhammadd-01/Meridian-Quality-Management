import React from 'react';

/**
 * Brand loader: the Meridian mark with a primrose arc orbiting it on a teal
 * track and a soft breathing glow. `tone="dark"` is for the spruce brand
 * background (sign-out, first load); `tone="light"` for pages and cards.
 */
export default function MeridianLoader({ size = 64, tone = 'light', label }) {
  const stroke = Math.max(3, Math.round(size / 16));
  const r = 50 - stroke;
  return (
    <span className={`meridian-loader ${tone === 'dark' ? 'is-dark' : ''}`} style={{ width: size, height: size }} role="status" aria-label={label || 'Loading'}>
      <span className="meridian-loader-halo" aria-hidden="true" />
      <svg viewBox="0 0 100 100" className="meridian-loader-ring" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="meridian-loader-track" strokeWidth={stroke} fill="none" />
        <circle cx="50" cy="50" r={r} className="meridian-loader-arc" strokeWidth={stroke} fill="none" strokeLinecap="round" pathLength="100" />
      </svg>
      <img src="/brand/meridian-mark.png" alt="" className="meridian-loader-mark" width={size * 0.5} height={size * 0.5} />
    </span>
  );
}

/** Animated "…" after a label (static when motion is reduced). */
export function LoadingDots() {
  return (
    <span className="loading-dots" aria-hidden="true">
      <span>.</span><span>.</span><span>.</span>
    </span>
  );
}

/** Full-screen brand screen with the loader — first app load and other full-page waits. */
export function FullScreenLoader({ text = 'Loading' }) {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center hero-spruce hero-grid text-white animate-fade-in">
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <MeridianLoader size={88} tone="dark" label={text} />
        <p className="text-sm font-semibold tracking-wide text-white/85">{text}<LoadingDots /></p>
      </div>
    </div>
  );
}
