/**
 * Record collections contributed by module folders. Each group declares its
 * collections in src/modules/<group>/entities.js as `export const ENTITIES = {…}`
 * using the same shape as src/data/entities.js. They are merged into the main
 * registry, so search, audit log, notifications and import/export see them.
 *
 * Module entity files must only import their own seed data — never
 * src/data/entities.js (that would create a circular import).
 */
const groups = import.meta.glob('./*/entities.js', { eager: true });

export const MODULE_ENTITIES = Object.assign({}, ...Object.values(groups).map(m => m.ENTITIES || {}));
