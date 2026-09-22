import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';

/**
 * Reusable ConfirmationModal for critical state transitions
 * (e.g. Arming/Disarming security systems, clearing alerts, rebooting nodes).
 */
export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: isDestructive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                color: isDestructive ? '#ef4444' : '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isDestructive ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
            </div>
            <h3 id="modal-title" className="modal-title">
              {title}
            </h3>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="modal-close-btn"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-modal-cancel"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn-modal-confirm ${isDestructive ? 'destructive' : 'primary'}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
