import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatRelativeTime, formatTimestamp } from '../utils/formatters';

/**
 * Clean White AlertCard component with subtle severity indicators.
 * Critical -> Red indicator (#DC2626)
 * Warning -> Amber indicator (#F59E0B)
 * Info -> Blue indicator (#146BFF)
 * Keeps cards clean and mostly white.
 */
export function AlertCard({ alert, onAcknowledge, onMarkAsRead }) {
  const [isPending, setIsPending] = useState(false);
  const [actionError, setActionError] = useState(null);

  if (!alert) return null;

  const alertId = alert.alertId || alert.id;
  const { type, severity = 'INFO', message, room, deviceId, timestamp } = alert;
  const isAcknowledged = Boolean(alert.acknowledged !== undefined ? alert.acknowledged : alert.read);

  const handleAcknowledge = async () => {
    const handler = onAcknowledge || onMarkAsRead;
    if (!handler || !alertId || isPending) return;

    setIsPending(true);
    setActionError(null);
    try {
      await handler(alertId);
    } catch (err) {
      console.error('Acknowledgement failed:', err);
      setActionError(err.message || 'Failed to acknowledge');
    } finally {
      setIsPending(false);
    }
  };

  const getSeverityAccent = () => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return {
          dotColor: '#DC2626',
          textColor: '#DC2626',
          icon: <ShieldAlert size={18} color="#DC2626" />,
          label: 'Critical',
        };
      case 'WARNING':
        return {
          dotColor: '#F59E0B',
          textColor: '#D97706',
          icon: <AlertTriangle size={18} color="#F59E0B" />,
          label: 'Warning',
        };
      case 'INFO':
      default:
        return {
          dotColor: '#146BFF',
          textColor: '#146BFF',
          icon: <Info size={18} color="#146BFF" />,
          label: 'Info',
        };
    }
  };

  const accent = getSeverityAccent();
  const readableTitle = (type || 'ALERT')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      className={`alert-card ${!isAcknowledged ? 'unread' : 'read'}`}
      style={{
        borderLeft: `3px solid ${accent.dotColor}`,
      }}
    >
      {/* Header: Severity Indicator + Title + Meta */}
      <div className="alert-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            className="alert-severity-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: accent.dotColor,
              flexShrink: 0,
            }}
          />
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--dark-navy)',
              margin: 0,
            }}
          >
            {readableTitle}
          </h4>
          <StatusBadge status={severity} label={accent.label} />
        </div>

        {/* Timestamp */}
        <span
          className="font-mono"
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          {formatTimestamp(timestamp) || formatRelativeTime(timestamp)}
        </span>
      </div>

      {/* Alert Body Message */}
      <p className="alert-message">{message}</p>

      {/* Footer: Room, Device info & Acknowledgment Action */}
      <div className="alert-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {room && <span>Zone: <strong style={{ color: 'var(--text-secondary)' }}>{room}</strong></span>}
          {deviceId && (
            <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
              • {deviceId === 'smartsense-pi-01' ? 'SmartRoom-01' : deviceId}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAcknowledged ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#16A34A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#ECFDF5',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
              }}
            >
              <CheckCheck size={14} /> Acknowledged
            </span>
          ) : (
            (onAcknowledge || onMarkAsRead) && (
              <button
                className="alert-action-btn"
                onClick={handleAcknowledge}
                disabled={isPending}
                title="Acknowledge Alert"
              >
                {isPending ? (
                  <Loader2 size={13} className="spin" />
                ) : (
                  <CheckCheck size={13} />
                )}
                <span>Acknowledge</span>
              </button>
            )
          )}
        </div>
      </div>

      {actionError && (
        <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.4rem', display: 'block' }}>
          Error: {actionError}
        </span>
      )}
    </div>
  );
}

export default AlertCard;
