import React from 'react';
import StatusBadge from './StatusBadge';

/**
 * Premium SensorCard component for SmartSense IoT telemetry
 * Structure:
 * - Header: [Icon] [Metric Title] ... [● LIVE] / [StatusBadge]
 * - Value & Unit: Large and bold tabular-nums
 * - Status row: Clean status label (Normal / Optimal / etc.)
 * - Footer: Last updated information (Updated 2 seconds ago)
 * - Supports selection in carousel and click interactions
 */
export function SensorCard({
  title,
  subtitle,
  value,
  unit,
  icon: Icon,
  iconBg = '#EFF6FF',
  iconColor = '#146BFF',
  status,
  statusLabel,
  stateType = 'normal', // 'normal' | 'active' | 'warning' | 'alert'
  footerInfo,
  lastUpdated,
  isLive = true,
  isSelected = false,
  selected = false,
  onClick,
  className = '',
}) {
  const isCardSelected = Boolean(isSelected || selected);
  const displayUpdated = lastUpdated || footerInfo || 'Updated 2 seconds ago';

  return (
    <div
      className={`sensor-card state-${stateType} ${isCardSelected ? 'selected' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? isCardSelected : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header: Icon + Title on left, Status / LIVE pill on right */}
      <div className="sensor-card-header">
        <div className="sensor-info">
          <div
            className="sensor-icon-box"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {Icon && <Icon size={20} strokeWidth={2} />}
          </div>
          <div>
            <div className="sensor-name">{title}</div>
            {subtitle && <div className="sensor-type">{subtitle}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isLive && (
            <span className="live-indicator-pill">
              <span className="live-dot" />
              <span>LIVE</span>
            </span>
          )}
          {status && <StatusBadge status={status} label={statusLabel} />}
        </div>
      </div>

      {/* Main Metric Value and Unit */}
      <div className="sensor-value-area">
        <span className="sensor-value">{value}</span>
        {unit && <span className="sensor-unit">{unit}</span>}
      </div>

      {/* Status indicator row */}
      <div className="sensor-status-row">
        <span className={`sensor-status-label status-label-${(status || 'normal').toLowerCase()}`}>
          {statusLabel || (status === 'NORMAL' ? 'Normal' : status || 'Active')}
        </span>
      </div>

      {/* Footer: Last updated information */}
      <div className="sensor-card-footer">
        <span className="sensor-updated-info">{displayUpdated}</span>
      </div>
    </div>
  );
}

export default SensorCard;
