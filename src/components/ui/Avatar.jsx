import React, { useEffect, useState } from 'react';

export const initialsOf = (name = '') =>
  String(name).replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

/**
 * A person's photo, or their initials when there is none (or it fails to load).
 * The photo fades in once loaded, so there is no flash of a broken image.
 */
export default function Avatar({ name, src, size = 36, className = '', fallbackClassName = 'bg-primrose-fill', children }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setFailed(false); setLoaded(false); }, [src]);

  const showImage = src && !failed;
  return (
    <span
      className={`relative inline-grid place-items-center shrink-0 rounded-full overflow-hidden font-extrabold select-none ${showImage && loaded ? '' : fallbackClassName} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) }}
      aria-hidden="true"
    >
      {(!showImage || !loaded) && initialsOf(name)}
      {showImage && (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {children}
    </span>
  );
}
