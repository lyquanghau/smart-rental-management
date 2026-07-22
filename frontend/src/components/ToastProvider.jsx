import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const iconByType = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const dismissToast = useCallback((toastId) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }, []);

  const showToast = useCallback(
    ({ title, message = '', type = 'info', duration = 4200 }) => {
      const id = `${Date.now()}-${toastIdRef.current}`;
      toastIdRef.current += 1;

      setToasts((currentToasts) => [
        ...currentToasts.slice(-3),
        { duration, id, message, title, type },
      ]);

      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      dismissToast,
      showToast,
      showError: (message, title = 'Khong thuc hien duoc') =>
        showToast({ message, title, type: 'error', duration: 5600 }),
      showSuccess: (message, title = 'Da cap nhat') =>
        showToast({ message, title, type: 'success' }),
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="toast-viewport"
        role="status"
      >
        {toasts.map((toast) => {
          const ToastIcon = iconByType[toast.type] || Info;

          return (
            <article className={`toast toast-${toast.type}`} key={toast.id}>
              <ToastIcon className="toast-icon" size={18} strokeWidth={2.5} />
              <div className="toast-copy">
                <strong>{toast.title}</strong>
                {toast.message ? <span>{toast.message}</span> : null}
              </div>
              <button
                aria-label="Dong thong bao"
                className="toast-close"
                type="button"
                onClick={() => dismissToast(toast.id)}
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
