import { lazy } from 'react';
import { CATALOG_PAGES } from './catalog';

/**
 * Lazily-loaded routes for every catalogue page. Components are discovered by
 * file path, so a build group only edits files inside its own module folder.
 */
const loaders = import.meta.glob('./**/pages/**/*.jsx');
const byFile = new Map();

function componentFor(file) {
  if (!byFile.has(file)) {
    const load = loaders[`./${file}.jsx`];
    if (!load) throw new Error(`Module page missing: src/modules/${file}.jsx`);
    byFile.set(file, lazy(load));
  }
  return byFile.get(file);
}

const seen = new Set();
export const MODULE_ROUTES = CATALOG_PAGES
  .filter(p => (seen.has(p.path) ? false : seen.add(p.path)))
  .map(p => ({ path: p.path, bare: !!p.bare, Component: componentFor(p.file) }));
