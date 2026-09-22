import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCheck,
  Filter,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export function Alerts() {
  const {
    alerts = [],
    acknowledgeAlert,
    markAlertAsRead,
    loading,
    error,
    refetch,
  } = useOutletContext();

  const [activeFilter, setActiveFilter] = useState('ALL');

  if (loading && (!alerts || alerts.length === 0)) {
    return <LoadingState message="Loading security & telemetry alerts..." />;
  }

  if (error && (!alerts || alerts.length === 0)) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const handleAcknowledge = acknowledgeAlert || markAlertAsRead;

  // Filter options as explicitly specified:
  // All, Critical, Warning, Info, Acknowledged, Unacknowledged
  const filterTabs = [
    { key: 'ALL', label: 'All' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'WARNING', label: 'Warning' },
    { key: 'INFO', label: 'Info' },
    { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { key: 'UNACKNOWLEDGED', label: 'Unacknowledged' },
  ];

  const criticalCount = alerts.filter((a) => a.severity?.toUpperCase() === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity?.toUpperCase() === 'WARNING').length;
  const infoCount = alerts.filter((a) => a.severity?.toUpperCase() === 'INFO').length;
  const unackedCount = alerts.filter((a) => !a.acknowledged && !a.read).length;

  const filteredAlerts = alerts.filter((alert) => {
    const isAck = Boolean(alert.acknowledged !== undefined ? alert.acknowledged : alert.read);
    const sev = alert.severity?.toUpperCase();

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRITICAL') return sev === 'CRITICAL';
    if (activeFilter === 'WARNING') return sev === 'WARNING';
    if (activeFilter === 'INFO') return sev === 'INFO';
    if (activeFilter === 'ACKNOWLEDGED') return isAck;
    if (activeFilter === 'UNACKNOWLEDGED') return !isAck;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* 1. Header: Security Alerts */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Security Alerts</h1>
            {unackedCount > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: '#DC2626',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                }}
              >
                {unackedCount} Unacknowledged
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Real-time security incidents, sensor anomalies, and alarm dispatch history
          </p>
        </div>

        {/* Global Acknowledge / Action Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Bell size={16} color="var(--accent-blue)" />
          <span>Total Incidents: <strong style={{ color: 'var(--text-primary)' }}>{alerts.length}</strong></span>
        </div>
      </section>

      {/* 2. Summary KPI Cards: Critical, Warning, Info */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="section-title">Incident Summary</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Severity Classification</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {/* Critical Summary Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid #DC2626',
              borderRadius: 'var(--radius-lg)',
              padding: '1.4rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Critical
              </span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#DC2626',
                  boxShadow: '0 0 6px #DC2626',
                }}
              />
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Breach alarms & SOS triggers
            </div>
          </div>

          {/* Warning Summary Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid #F59E0B',
              borderRadius: 'var(--radius-lg)',
              padding: '1.4rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Warning
              </span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#F59E0B',
                  boxShadow: '0 0 6px #F59E0B',
                }}
              />
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>
              {warningCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Thermal drift & proximity events
            </div>
          </div>

          {/* Info Summary Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid #146BFF',
              borderRadius: 'var(--radius-lg)',
              padding: '1.4rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Info
              </span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#146BFF',
                  boxShadow: '0 0 6px #146BFF',
                }}
              />
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#146BFF', fontVariantNumeric: 'tabular-nums' }}>
              {infoCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Heartbeat & system notifications
            </div>
          </div>
        </div>
      </section>

      {/* 3. Filters Strip: All, Critical, Warning, Info, Acknowledged, Unacknowledged */}
      <section>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter size={14} /> Filter:
            </span>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: activeFilter === tab.key ? '#FFFFFF' : 'var(--text-secondary)',
                  background: activeFilter === tab.key ? 'var(--accent-blue)' : 'transparent',
                  border: activeFilter === tab.key ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
        </div>
      </section>

      {/* 4. Alert Cards Feed */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.alertId || alert.id}
            alert={alert}
            onAcknowledge={handleAcknowledge}
          />
        ))}

        {filteredAlerts.length === 0 && (
          <EmptyState
            title="No Alerts"
            message="Everything looks good. All telemetry metrics are within nominal limits."
          />
        )}
      </section>
    </div>
  );
}

export default Alerts;
