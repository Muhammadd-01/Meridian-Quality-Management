import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Runs `handler` once when the page is opened with `?action=<name>` (used by
 * the global Quick Create menu and command palette), then removes the param so
 * a refresh or back-navigation does not reopen the form.
 */
export default function useQuickAction(name, handler) {
  const [params, setParams] = useSearchParams();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const action = params.get('action');

  useEffect(() => {
    if (action !== name) return;
    handlerRef.current?.();
    const next = new URLSearchParams(params);
    next.delete('action');
    setParams(next, { replace: true });
  }, [action, name, params, setParams]);
}
