import { useState, useMemo } from 'react';

export default function useSearch(data, searchKeys) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(item =>
      searchKeys.some(key => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, query, searchKeys]);

  return { query, setQuery, filtered };
}
