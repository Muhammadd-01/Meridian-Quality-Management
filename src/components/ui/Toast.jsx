import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle size={18} className="text-success shrink-0" />,
    error: <AlertCircle size={18} className="text-danger shrink-0" />,
    info: <Info size={18} className="text-info shrink-0" />,
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl shadow-dropdown border border-gray-200 animate-fade-in">
            {icons[t.type]}
            <p className="text-sm text-gray-700 flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
