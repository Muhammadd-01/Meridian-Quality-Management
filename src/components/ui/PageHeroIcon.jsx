import React from 'react';

/** Large faded icon in the corner of a `.page-hero` banner (for pages with a custom header). */
export default function PageHeroIcon({ icon: Icon }) {
  return Icon ? <Icon className="page-hero-watermark" aria-hidden="true" /> : null;
}
