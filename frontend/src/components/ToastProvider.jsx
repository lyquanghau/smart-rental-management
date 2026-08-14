import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, RotateCcw, X } from 'lucide-react';

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
    ({
      actionLabel = '',
      message = '',
      onAction,
      title,
      type = 'info',
      duration = 5000,
    }) => {
      const id = `${Date.now()}-${toastIdRef.current}`;
      toastIdRef.current += 1;

      setToasts((currentToasts) => [
        ...currentToasts.slice(-3),
        { actionLabel, duration, id, message, onAction, title, type },
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
      showError: (message, title = 'Không thực hiện được') =>
        showToast({ message, title, type: 'error', duration: 5600 }),
      showSuccess: (message, title = 'Đã cập nhật') =>
        showToast({ message, title, type: 'success' }),
      showUndo: ({ message, onUndo, title = 'Đã lên lịch xóa' }) =>
        showToast({
          actionLabel: 'Hoàn tác',
          message,
          onAction: onUndo,
          title,
          type: 'info',
        }),
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
            <article
              className={`toast toast-${toast.type}`}
              key={toast.id}
              style={{ '--toast-duration': `${toast.duration}ms` }}
            >
              <ToastIcon className="toast-icon" size={18} strokeWidth={2.5} />
              <div className="toast-copy">
                <strong>{toast.title}</strong>
                {toast.message ? <span>{toast.message}</span> : null}
                {toast.actionLabel ? (
                  <button
                    className="toast-action"
                    type="button"
                    onClick={() => {
                      toast.onAction?.();
                      dismissToast(toast.id);
                    }}
                  >
                    <RotateCcw size={14} strokeWidth={2.5} />
                    {toast.actionLabel}
                  </button>
                ) : null}
              </div>
              <button
                aria-label="Dong thong bao"
                className="toast-close"
                type="button"
                onClick={() => dismissToast(toast.id)}
              >
                <X size={15} strokeWidth={2.5} />
              </button>
              {toast.duration > 0 ? (
                <span aria-hidden="true" className="toast-progress" />
              ) : null}
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
