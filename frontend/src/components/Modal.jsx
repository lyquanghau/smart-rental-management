import React from 'react';
import { X } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences.js';

export function Modal({
  children,
  isOpen,
  onClose,
  panelClassName = '',
  title,
}) {
  const { language } = usePreferences();
  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="modal-backdrop"
      role="dialog"
    >
      <div className={`modal-panel ${panelClassName}`.trim()}>
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            aria-label={language === 'en' ? 'Close popup' : 'Đóng popup'}
            className="icon-button"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
