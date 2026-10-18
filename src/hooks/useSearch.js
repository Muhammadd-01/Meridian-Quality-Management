import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useSearch(data, searchKeys) {
  // Global search links open pages with ?q=<term>; use it as the initial query.
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') || '');

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
