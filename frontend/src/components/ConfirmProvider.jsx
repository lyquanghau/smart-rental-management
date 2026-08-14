import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences.js';

const ConfirmContext = createContext(null);

const copy = {
  en: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    title: 'Confirm action',
  },
  vi: {
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    title: 'Xác nhận thao tác',
  },
};

export function ConfirmProvider({ children }) {
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;
  const resolverRef = useRef(null);
  const [confirmState, setConfirmState] = useState(null);

  const closeConfirm = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setConfirmState(null);
  }, []);

  const confirm = useCallback(
    ({
      cancelLabel = text.cancel,
      confirmLabel = text.confirm,
      message,
      title = text.title,
      tone = 'danger',
    }) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setConfirmState({
          cancelLabel,
          confirmLabel,
          message,
          title,
          tone,
        });
      });
    },
    [text.cancel, text.confirm, text.title],
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {confirmState
        ? createPortal(
            <div
              aria-labelledby="confirm-title"
              aria-modal="true"
              className="modal-backdrop confirm-backdrop"
              role="dialog"
            >
              <div className="confirm-panel">
                <div className="confirm-icon" aria-hidden="true">
                  <AlertTriangle size={22} strokeWidth={2.5} />
                </div>
                <div className="confirm-copy">
                  <h2 id="confirm-title">{confirmState.title}</h2>
                  <p>{confirmState.message}</p>
                </div>
                <button
                  aria-label={text.cancel}
                  className="confirm-close"
                  type="button"
                  onClick={() => closeConfirm(false)}
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
                <div className="confirm-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => closeConfirm(false)}
                  >
                    {confirmState.cancelLabel}
                  </button>
                  <button
                    className={
                      confirmState.tone === 'danger' ? 'danger-button' : ''
                    }
                    type="button"
                    onClick={() => closeConfirm(true)}
                  >
                    {confirmState.confirmLabel}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error('useConfirm must be used inside ConfirmProvider');
  }

  return context;
}
