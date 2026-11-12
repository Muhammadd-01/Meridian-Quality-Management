import { useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import { loadRemoteCollection, syncRemoteCollection } from '../lib/remoteCollections';

const EMPTY = [];

/**
 * Same contract as useLocalStorage — `[records, setRecords]` — for a collection
 * stored on the server. Reads come from the local cache (refreshed from the API
 * on mount and when the window regains focus); writes are saved to the API.
 */
export default function useRemoteCollection(entity) {
  const [records, setCached] = useLocalStorage(entity.key, EMPTY);

  useEffect(() => {
    loadRemoteCollection(entity);
    const onFocus = () => loadRemoteCollection(entity);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [entity]);

  const setRecords = useCallback((value) => {
    // useLocalStorage runs the updater exactly once with the latest value.
    setCached((prev) => {
      const next = value instanceof Function ? value(prev) : value;
      syncRemoteCollection(entity, prev, next);
      return next;
    });
  }, [entity, setCached]);

  return [Array.isArray(records) ? records : EMPTY, setRecords];
}
