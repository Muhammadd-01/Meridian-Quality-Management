import { useState, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '../lib/storage';

export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() =>
    getStorageItem(key, initialValue)
  );

  const setValue = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    setStorageItem(key, valueToStore);
  }, [key, storedValue]);

  return [storedValue, setValue];
}
