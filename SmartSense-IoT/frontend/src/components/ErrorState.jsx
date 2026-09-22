import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Clear, user-friendly ErrorState component.
 * Does not expose technical stack traces to users.
 * Example:
 * Unable to load sensor data
 * Please check the connection and try again.
 * [ Retry / Reconnect ]
 */
export function ErrorState({
  title = 'Unable to load sensor data',
  message = 'Please check the connection and try again.',
  onRetry,
}) {
  return (
    <div className="error-container">
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={26} strokeWidth={2} />
      </div>

      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '0.4rem',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          maxWidth: '420px',
          lineHeight: 1.5,
          marginBottom: '1.5rem',
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          className="btn-primary"
          onClick={onRetry}
          style={{ cursor: 'pointer' }}
        >
          <RefreshCw size={15} />
          <span>Retry / Reconnect</span>
        </button>
      )}
    </div>
  );
}

export default ErrorState;
