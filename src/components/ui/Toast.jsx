import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { friendlyError, isTechnical } from '../../lib/errors';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const TYPES = {
  success: { title: 'Done', icon: CheckCircle2, tile: 'bg-success-50 text-success-600', bar: 'from-success-600 to-success-300', accent: 'before:bg-success-500', duration: 3800 },
  error: { title: 'Something went wrong', icon: AlertCircle, tile: 'bg-danger-50 text-danger-600', bar: 'from-danger-600 to-danger-400', accent: 'before:bg-danger-500', duration: 6500 },
  warning: { title: 'Heads up', icon: AlertTriangle, tile: 'bg-warning-50 text-warning-600', bar: 'from-warning-600 to-accent-500', accent: 'before:bg-warning-500', duration: 5500 },
  info: { title: 'Notice', icon: Info, tile: 'bg-primary-100 text-brand', bar: 'from-primary-300 to-accent-500', accent: 'before:bg-primary-400', duration: 4200 },
};

const MAX_VISIBLE = 4;

/**
 * Normalises what callers pass — a string, an Error/ApiError, or
 * { title, message, action } — into safe, friendly text. Error and warning
 * text that looks technical is replaced, so people never see code errors.
 */
function toContent(input, type) {
  const isObject = input && typeof input === 'object';
  if (type === 'error' || type === 'warning') {
    if (input instanceof Error || (isObject && 'status' in input)) {
      const f = friendlyError(input, isObject && input.fallback ? input.fallback : undefined);
      return { title: input.toastTitle || f.title, message: f.message, action: input.action };
    }
    const title = isObject ? input.title : undefined;
    const message = isObject ? input.message : input;
    const safeMessage = isTechnical(message) ? friendlyError(null).message : message;
    return { title: title && !isTechnical(title) ? title : TYPES[type].title, message: safeMessage, action: isObject ? input.action : undefined };
  }
  if (isObject && !(input instanceof Error)) return { title: input.title || TYPES[type]?.title, message: input.message, action: input.action };
  return { title: TYPES[type]?.title || TYPES.info.title, message: String(input ?? '') };
}

/**
 * Toasts appear top-right under the header. A themed bar counts down the time
 * left; hovering pauses it. The same message twice is merged (with a count)
 * instead of stacking. Usage:
 *   addToast('Saved', 'success')
 *   addToast(err, 'error')                                   // any error → friendly text
 *   addToast({ title, message, action: { label, onClick } }, 'info', 8000)
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    const handle = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timers.current.delete(id);
    }, 280);
    timers.current.set(id, handle);
  }, []);

  const addToast = useCallback((input, type = 'success', duration) => {
    const kind = TYPES[type] ? type : 'info';
    const content = toContent(input, kind);
    const key = `${kind}|${content.title}|${content.message}`;
    setToasts(prev => {
      const existing = prev.find(t => t.key === key && !t.leaving);
      if (existing) {
        return prev.map(t => (t === existing ? { ...t, count: t.count + 1, nonce: t.nonce + 1 } : t));
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return [...prev.slice(-(MAX_VISIBLE - 1)), { id, key, type: kind, ...content, duration: duration || TYPES[kind].duration, count: 1, nonce: 0 }];
    });
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-[86px] right-4 z-[100] flex flex-col gap-2.5 w-[min(23rem,calc(100vw-2rem))] pointer-events-none" aria-live="polite">
        {toasts.map(t => {
          const cfg = TYPES[t.type];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`toast-card pointer-events-auto relative before:absolute before:inset-y-0 before:left-0 before:w-1 ${cfg.accent} ${t.leaving ? 'is-leaving' : ''}`}
              style={{ '--toast-duration': `${t.duration}ms` }}
            >
              <div className="flex items-start gap-3 p-3.5 pl-4 pr-10">
                <span className={`grid place-items-center w-10 h-10 rounded-lg shrink-0 ${cfg.tile}`}><Icon size={18} aria-hidden="true" /></span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                    {t.title}
                    {t.count > 1 && <span className="px-1.5 rounded-full bg-gray-100 text-gray-500 text-[10.5px] font-semibold tabular-nums">×{t.count}</span>}
                  </p>
                  {t.message && <p className="text-[12.5px] text-gray-600 mt-0.5 leading-snug break-words">{t.message}</p>}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => { t.action.onClick?.(); removeToast(t.id); }}
                      className="mt-2 text-[12px] font-bold text-brand hover:text-brand-strong underline-offset-2 hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
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
                  key={t.nonce}
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
