import { useEffect } from 'react';
import { ROUTE_META, SITE_NAME, SITE_DESCRIPTION } from './seoRoutes';

/** Public site address: set VITE_SITE_URL at build time; falls back to the current origin. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

function setMeta(selector, attr, key, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Keeps <title>, description, canonical URL and social-preview tags in sync
 * with the current route (the app is a single-page app, so this runs on navigation).
 */
export function useDocumentMeta(pathname) {
  useEffect(() => {
    const meta = ROUTE_META[pathname];
    const title = meta ? `${meta.title} · ${SITE_NAME}` : SITE_NAME;
    const description = meta?.description || SITE_DESCRIPTION;
    const url = `${SITE_URL}${pathname}`;

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setCanonical(url);
  }, [pathname]);
}
