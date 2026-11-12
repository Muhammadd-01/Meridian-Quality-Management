/**
 * One-time removal of demo records from this browser.
 *
 * Earlier versions filled every browser-stored collection with demo records
 * (src/data/*). With SEED_DEMO_DATA off, this removes exactly those records —
 * matched by their demo id — and keeps everything people added or imported.
 * Server-backed collections (accounts, contacts, leads, deals) are not touched
 * here: they are reloaded from the API. Their demo rows are removed in the
 * database with supabase/remove-dummy-data.sql.
 */
import { ENTITY_LIST, SEED_DEMO_DATA } from '../data/entities';
import { getStorageItem, setStorageItem } from './storage';

const DONE_KEY = 'meridian-demo-data-removed';

export function purgeDemoData() {
  if (SEED_DEMO_DATA) return;
  try {
    if (localStorage.getItem(DONE_KEY)) return;
  } catch {
    return; // storage unavailable: nothing stored to clean
  }

  ENTITY_LIST.forEach((entity) => {
    if (entity.remote || !Array.isArray(entity.demoSeed) || !entity.demoSeed.length) return;
    const stored = getStorageItem(entity.key, null);
    if (!Array.isArray(stored)) return;
    const demoIds = new Set(entity.demoSeed.map((r) => r?.id).filter(Boolean));
    const kept = stored.filter((r) => !demoIds.has(r?.id));
    if (kept.length !== stored.length) setStorageItem(entity.key, kept);
  });

  try {
    localStorage.setItem(DONE_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}
