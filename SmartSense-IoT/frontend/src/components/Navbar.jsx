import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

/**
 * Top Header Navigation bar
 * Specifications:
 * - Header should be white with subtle bottom border. Do NOT make header dark.
 * - Left: SmartSense IoT / Page Title
 * - Top right:
 *   ● System Online
 *   DISARMED / ARMED
 *   🔔 (Notification Bell)
 *   Admin ▼
 */
export function Navbar({
  pageTitle,
  securityMode = 'DISARMED',
  onToggleSecurityMode,
  unreadAlertCount = 0,
  backendStatus = 'OFFLINE',
  onToggleMobileSidebar,
}) {
  const isOnline = backendStatus === 'CONNECTED';
  const isArmed = securityMode === 'ARMED';

  return (
    <header className="navbar">
      {/* Left: Mobile Toggle & Title */}
      <div className="navbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {pageTitle || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right: System Online, Security status, Alerts, Admin */}
      <div className="navbar-right">
        {/* Connection status: ● System Online */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            background: isOnline ? '#ECFDF5' : '#FEF2F2',
            borderRadius: 'var(--radius-full)',
            border: isOnline ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid rgba(220, 38, 38, 0.25)',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: isOnline ? '#16A34A' : '#DC2626',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#16A34A' : '#DC2626',
            }}
          />
          <span className="desktop-only">{isOnline ? 'System Online' : 'System Offline'}</span>
        </div>

        {/* Security Quick Status: ARMED / DISARMED */}
        {onToggleSecurityMode && (
          <button
            onClick={onToggleSecurityMode}
            className={`security-mode-toggle ${isArmed ? 'armed' : 'disarmed'}`}
            title={isArmed ? 'Click to Disarm' : 'Click to Arm'}
            style={{ cursor: 'pointer' }}
          >
            {isArmed ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            <span>{isArmed ? 'ARMED' : 'DISARMED'}</span>
          </button>
        )}

        {/* Notification Bell 🔔 */}
        <NavLink
          to="/alerts"
          style={{
            position: 'relative',
            padding: '0.45rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="Security Alerts"
          aria-label="Security Alerts"
        >
          <Bell size={18} />
          {unreadAlertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#DC2626',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '700',
                borderRadius: '999px',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              {unreadAlertCount}
            </span>
          )}
        </NavLink>

        {/* Admin ▼ */}
        <Link
          to="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--dark-navy)',
            textDecoration: 'none',
            fontSize: '0.825rem',
            fontWeight: '600',
            transition: 'border-color 0.15s ease',
          }}
          title="Operator Profile & Settings"
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#EFF6FF',
              color: '#146BFF',
              fontSize: '0.7rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(20, 107, 255, 0.2)',
            }}
          >
            AD
          </div>
          <span className="desktop-only">Admin</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
