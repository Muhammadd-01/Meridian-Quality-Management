import React from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';
import { HOME_PATH } from '../../app/features';
import { isChunkLoadError } from '../../lib/errors';

/**
 * Catches errors while a page renders and shows a friendly card instead of a
 * blank screen or a code error. Details go to the browser console only (and
 * are shown in a collapsed panel during development).
 *
 * `resetKey`: when it changes (e.g. the route), the boundary tries again.
 * `variant="page"` fits inside the app layout; the default fills the screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Meridian] Page error', error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const update = isChunkLoadError(error);
    const page = this.props.variant === 'page';

    return (
      <div className={`grid place-items-center px-4 ${page ? 'py-16' : 'min-h-screen bg-surface-canvas'}`} role="alert">
        <div className="card max-w-md w-full p-7 text-center animate-scale-in">
          <span className={`mx-auto grid place-items-center w-14 h-14 rounded-2xl ${update ? 'bg-primary-100 text-brand' : 'bg-danger-50 text-danger-600'}`}>
            {update ? <RefreshCw size={24} aria-hidden="true" /> : <AlertTriangle size={24} aria-hidden="true" />}
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-gray-900">
            {update ? 'A new version is available' : 'This page ran into a problem'}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            {update
              ? 'The app was updated while this tab was open. Reload to continue.'
              : 'Don’t worry — your data is safe. Try again, or go back to the start.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {update ? (
              <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
                <RefreshCw size={15} aria-hidden="true" /> Reload
              </button>
            ) : (
              <>
                <button type="button" className="btn-primary" onClick={() => this.setState({ error: null })}>
                  <RotateCcw size={15} aria-hidden="true" /> Try again
                </button>
                <a href={HOME_PATH} className="btn-secondary">
                  <Home size={15} aria-hidden="true" /> Go to start
                </a>
              </>
            )}
          </div>
          {import.meta.env.DEV && !update && (
            <details className="mt-5 text-left">
              <summary className="text-2xs text-gray-400 cursor-pointer">Developer details (only shown in development)</summary>
              <pre className="mt-2 text-2xs text-gray-500 whitespace-pre-wrap break-words max-h-40 overflow-auto">{String(error?.stack || error)}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
