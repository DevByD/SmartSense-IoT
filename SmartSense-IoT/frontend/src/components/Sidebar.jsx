import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  LineChart,
  Bell,
  Cpu,
  Settings,
  X,
} from 'lucide-react';
import BrandLogo from './BrandLogo';

/**
 * White Sidebar Component
 * Specifications:
 * - White sidebar with subtle right border
 * - Logo: SmartSense / IoT Surveillance
 * - Navigation: Dashboard, Live Monitoring, Analytics, Alerts, Devices, Settings
 * - Active item: soft blue background, blue icon, blue text
 * - Inactive: navy/gray
 * - Bottom: System Status ● All Systems Operational
 */
export function Sidebar({ mobileOpen, onCloseMobile, unreadAlertCount = 0, device }) {
  const isOnline = device?.status === 'ONLINE';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live', label: 'Live Monitoring', icon: Activity },
    { to: '/analytics', label: 'Analytics', icon: LineChart },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: unreadAlertCount },
    { to: '/device', label: 'Devices', icon: Cpu },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <BrandLogo size={32} subtitle="IoT Surveillance" />
          <button
            className="mobile-menu-btn"
            onClick={onCloseMobile}
            style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: System Status ● All Systems Operational */}
        <div className="sidebar-footer">
          <div
            style={{
              padding: '0.85rem 1rem',
              background: '#F9FBFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
              System Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.35rem' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#16A34A' : '#DC2626',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: isOnline ? '#16A34A' : '#DC2626',
                }}
              >
                {isOnline ? 'All Systems Operational' : 'Node Offline'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
