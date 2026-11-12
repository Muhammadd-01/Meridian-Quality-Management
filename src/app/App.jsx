import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ToastProvider, useToast } from '../components/ui/Toast';
import { AuthProvider } from '../lib/auth';
import { REMOTE_SYNC_ERROR_EVENT } from '../lib/remoteCollections';
import { friendlyError, isChunkLoadError } from '../lib/errors';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import AppRouter from './router';

// Surfaces API save/load failures for server-backed collections (a failed save is rolled back),
// plus any request or app-update failure nobody else handled — always in plain words.
function GlobalErrorNotices() {
  const addToast = useToast();
  useEffect(() => {
    const onSyncError = (e) => {
      const d = e.detail || {};
      const f = friendlyError({ status: d.status, message: d.message });
      if (d.kind === 'load') {
        // One toast for all collections (merged with a count) instead of one per list.
        addToast({ title: 'Couldn’t load your data', message: f.message, action: { label: 'Try again', onClick: () => window.dispatchEvent(new Event('focus')) } }, 'error');
      } else {
        addToast({ title: `Your ${String(d.singular || 'record').toLowerCase()} change wasn’t saved`, message: `${f.message} The change has been undone.` }, 'error');
      }
    };
    const onUnhandled = (e) => {
      const reason = e.reason;
      if (isChunkLoadError(reason)) {
        e.preventDefault();
        addToast({ title: 'Update available', message: 'A newer version of the app is ready.', action: { label: 'Reload now', onClick: () => window.location.reload() } }, 'info', 15000);
      } else if (reason?.name === 'ApiError' && reason.status !== 401) {
        e.preventDefault();
        addToast(reason, 'error');
      }
    };
    window.addEventListener(REMOTE_SYNC_ERROR_EVENT, onSyncError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener(REMOTE_SYNC_ERROR_EVENT, onSyncError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, [addToast]);
  return null;
}

function ScrollToTopOnRoute() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll layout main container
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainEl.scrollTop = 0;
    }
    // Scroll window and root elements
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRoute />
      <ToastProvider>
        <AuthProvider>
          <GlobalErrorNotices />
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
