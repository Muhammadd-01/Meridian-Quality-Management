import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const TYPES = {
  success: { title: 'Success', icon: CheckCircle2, tile: 'bg-success-50 text-success-600', bar: 'from-primary-400 to-success-500' },
  error: { title: 'Something went wrong', icon: AlertCircle, tile: 'bg-danger-50 text-danger-600', bar: 'from-danger-400 to-danger-600' },
  warning: { title: 'Heads up', icon: AlertTriangle, tile: 'bg-warning-50 text-warning-600', bar: 'from-warning-400 to-accent-500' },
  info: { title: 'Notice', icon: Info, tile: 'bg-primary-50 text-primary-600', bar: 'from-primary-300 to-accent-400' },
};

/**
 * Toasts appear top-right under the header. A themed progress bar counts down
 * the time left; hovering a toast pauses it. Usage: addToast(message, type, durationMs).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3800) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-[78px] right-4 z-[100] flex flex-col gap-2.5 w-[min(23rem,calc(100vw-2rem))] pointer-events-none" role="status" aria-live="polite">
        {toasts.map(t => {
          const cfg = TYPES[t.type] || TYPES.info;
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={`toast-card pointer-events-auto ${t.leaving ? 'is-leaving' : ''}`}
              style={{ '--toast-duration': `${t.duration}ms` }}
            >
              <div className="flex items-start gap-3 p-3.5 pr-10">
                <span className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${cfg.tile}`}><Icon size={18} aria-hidden="true" /></span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[13px] font-bold text-gray-900">{cfg.title}</p>
                  <p className="text-[12.5px] text-gray-600 mt-0.5 leading-snug">{t.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="absolute top-2.5 right-2.5 grid place-items-center w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 hover:rotate-90 transition-all duration-200"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
              <div className="h-1 bg-gray-100">
                <div
                  className={`toast-progress h-full bg-gradient-to-r ${cfg.bar}`}
                  onAnimationEnd={() => removeToast(t.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
