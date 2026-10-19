import { useEffect, useState } from 'react';
import { ENTITIES } from '../data/entities';
import { getStorageItem, STORAGE_CHANGE_EVENT } from '../lib/storage';

const read = (types) => Object.fromEntries(types.map(t => {
  const e = ENTITIES[t];
  if (!e) throw new Error(`useCollections: unknown entity type "${t}"`);
  const v = getStorageItem(e.key, e.seed);
  return [t, Array.isArray(v) ? v : []];
}));

/**
 * Read-only, live access to several registered collections at once
 * (e.g. for reports and dashboards): { leads: [...], deals: [...] }.
 * Re-reads when any of them changes in this tab or another tab.
 */
export default function useCollections(types) {
  const signature = types.join('|');
  const [data, setData] = useState(() => read(types));

  useEffect(() => {
    const list = signature ? signature.split('|') : [];
    const keys = new Set(list.map(t => ENTITIES[t].key));
    setData(read(list));
    const sync = (e) => {
      const key = e.type === 'storage' ? e.key : e.detail?.key;
      if (keys.has(key)) setData(read(list));
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [signature]);

  return data;
}
