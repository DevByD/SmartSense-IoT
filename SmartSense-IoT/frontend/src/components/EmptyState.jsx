import React from 'react';
import { CheckCircle2, Check } from 'lucide-react';

/**
 * Professional, minimalist EmptyState component
 * Example:
 * No Alerts
 * ✓
 * Everything looks good.
 */
export function EmptyState({
  title = 'No Data',
  message = 'Everything looks good.',
  icon: Icon = CheckCircle2,
  action,
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-box">
        <Icon size={26} strokeWidth={2} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
}

export default EmptyState;
