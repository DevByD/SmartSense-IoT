/**
 * Formatting utility functions for SmartSense IoT Telemetry & Alerts
 */

export function formatTimestamp(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
}

export function formatRelativeTime(isoString) {
  if (!isoString) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  } catch (e) {
    return 'Just now';
  }
}

export function getSeverityStyle(severity) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        text: '#f87171',
        border: 'rgba(239, 68, 68, 0.4)',
        badgeClass: 'badge-critical',
      };
    case 'WARNING':
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        text: '#fbbf24',
        border: 'rgba(245, 158, 11, 0.4)',
        badgeClass: 'badge-warning',
      };
    case 'INFO':
    default:
      return {
        bg: 'rgba(59, 130, 246, 0.15)',
        text: '#60a5fa',
        border: 'rgba(59, 130, 246, 0.4)',
        badgeClass: 'badge-info',
      };
  }
}
