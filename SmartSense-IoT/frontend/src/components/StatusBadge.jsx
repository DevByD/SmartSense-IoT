import React from 'react';

/**
 * Reusable StatusBadge component
 * Supports: 'ONLINE', 'OFFLINE', 'ARMED', 'DISARMED', 'INFO', 'WARNING', 'CRITICAL', 'DETECTED', 'NORMAL'
 */
export function StatusBadge({ status, label, className = '' }) {
  const normalized = (status || label || '').toUpperCase();

  let badgeClass = 'badge-info';
  let displayLabel = label || status;

  if (normalized === 'ONLINE' || normalized === 'CONNECTED' || normalized === 'ACTIVE' || normalized === 'NORMAL') {
    badgeClass = 'badge-online';
  } else if (normalized === 'OFFLINE' || normalized === 'DISCONNECTED') {
    badgeClass = 'badge-offline';
  } else if (normalized === 'CRITICAL' || normalized === 'SOS' || normalized === 'BREACH' || normalized === 'ARMED') {
    badgeClass = 'badge-critical';
  } else if (normalized === 'WARNING' || normalized === 'DETECTED' || normalized === 'HIGH') {
    badgeClass = 'badge-warning';
  } else if (normalized === 'DISARMED') {
    badgeClass = 'badge-info';
  }

  return (
    <span className={`status-badge ${badgeClass} ${className}`}>
      <span className="status-dot"></span>
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
