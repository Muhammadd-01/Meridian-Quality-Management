import { useState, useCallback, useEffect, useRef } from 'react';
import { getStorageItem, setStorageItem, STORAGE_CHANGE_EVENT } from '../lib/storage';
import { recordCollectionChange } from '../lib/auditLog';

let instanceCounter = 0;

export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() =>
    getStorageItem(key, initialValue)
  );
  // Keep the latest value in a ref so functional updates never read a stale closure.
  const valueRef = useRef(storedValue);
  valueRef.current = storedValue;
  const instanceId = useRef(null);
  if (instanceId.current === null) instanceId.current = ++instanceCounter;
  const initialRef = useRef(initialValue);

  const setValue = useCallback((value) => {
    const prev = valueRef.current;
    const valueToStore = value instanceof Function ? value(prev) : value;
    valueRef.current = valueToStore;
    setStoredValue(valueToStore);
    setStorageItem(key, valueToStore, instanceId.current);
    recordCollectionChange(key, prev, valueToStore);
  }, [key]);

  // Stay in sync with writes from other components (same tab) and other tabs.
  useEffect(() => {
    const sync = (e) => {
      const changedKey = e.type === 'storage' ? e.key : e.detail?.key;
      if (changedKey !== key) return;
      if (e.type !== 'storage' && e.detail?.source === instanceId.current) return;
      const latest = getStorageItem(key, initialRef.current);
      valueRef.current = latest;
      setStoredValue(latest);
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [key]);

  return [storedValue, setValue];
}
