import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Ruler,
  Activity,
  Volume2,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

import SensorCard from '../components/SensorCard';
import StatusBadge from '../components/StatusBadge';
import AlertCard from '../components/AlertCard';
import ChartCard from '../components/ChartCard';
import DeviceStatus from '../components/DeviceStatus';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatRelativeTime, formatTimestamp } from '../utils/formatters';
import analyticsApi from '../services/analyticsApi';

import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';

export function Dashboard() {
  const {
    sensors,
    device,
    securityMode,
    alerts = [],
    setSecurityMode,
    acknowledgeAlert,
    markAlertAsRead,
    loading,
    error,
    backendStatus,
    refetch,
  } = useOutletContext();

  const [tempRange, setTempRange] = useState('24h');
  const [humRange, setHumRange] = useState('24h');
  const [tempAnalytics, setTempAnalytics] = useState(null);
  const [humAnalytics, setHumAnalytics] = useState(null);
  const [isTogglingSecurity, setIsTogglingSecurity] = useState(false);
  const [showSecurityConfirm, setShowSecurityConfirm] = useState(false);

  const deviceId = device?.deviceId || 'smartsense-pi-01';

  // Dynamic greeting based on operator's local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Fetch real analytics for the temperature chart
  useEffect(() => {
    let active = true;
    analyticsApi
      .getAnalytics(deviceId, tempRange)
      .then((res) => {
        if (active) setTempAnalytics(res);
      })
      .catch((err) => console.warn('[Dashboard] Failed to fetch temp analytics:', err.message));
    return () => {
      active = false;
    };
  }, [deviceId, tempRange]);

  // Fetch real analytics for the humidity chart
  useEffect(() => {
    let active = true;
    analyticsApi
      .getAnalytics(deviceId, humRange)
      .then((res) => {
        if (active) setHumAnalytics(res);
      })
      .catch((err) => console.warn('[Dashboard] Failed to fetch hum analytics:', err.message));
    return () => {
      active = false;
    };
  }, [deviceId, humRange]);

  if (loading && !sensors) {
    return <LoadingState message="Loading sensor data..." />;
  }

  if (error && !sensors) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const isArmed = securityMode === 'ARMED';
  const handleAcknowledge = acknowledgeAlert || markAlertAsRead;

  const handleOpenSecurityConfirm = () => {
    setShowSecurityConfirm(true);
  };

  const handleConfirmSecurityToggle = async () => {
    setIsTogglingSecurity(true);
    try {
      await setSecurityMode(isArmed ? 'DISARMED' : 'ARMED');
      setShowSecurityConfirm(false);
    } catch (err) {
      console.error('[Dashboard] Security toggle failed:', err);
    } finally {
      setIsTogglingSecurity(false);
    }
  };

  // Temperature chart config
  const tempSeries = tempAnalytics?.temperature || [];
  const tempChartConfig = {
    labels: tempSeries.map((d) => formatTimestamp(d.timestamp)),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: tempSeries.map((d) => d.value),
        borderColor: '#146BFF',
        backgroundColor: 'rgba(20, 107, 255, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      },
    ],
  };

  // Humidity chart config
  const humSeries = humAnalytics?.humidity || [];
  const humChartConfig = {
    labels: humSeries.map((d) => formatTimestamp(d.timestamp)),
    datasets: [
      {
        label: 'Humidity (%)',
        data: humSeries.map((d) => d.value),
        borderColor: '#2F80ED',
        backgroundColor: 'rgba(47, 128, 237, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#14213D',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#DCE6F5',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(20, 107, 255, 0.05)' },
        ticks: { color: '#6B7A99', font: { size: 10 }, maxTicksLimit: 7 },
      },
      y: {
        grid: { color: 'rgba(20, 107, 255, 0.05)' },
        ticks: { color: '#6B7A99', font: { size: 10 } },
      },
    },
  };

  // Telemetry status mapping
  const tempVal = sensors?.temperature;
  const tempStatus = sensors?.temperatureStatus || (tempVal > 32 ? 'WARNING' : 'NORMAL');
  const tempStatusLabel = tempStatus === 'CRITICAL' ? 'CRITICAL' : tempStatus === 'WARNING' || tempVal > 32 ? 'ELEVATED' : 'OPTIMAL';
  const tempStateType = tempStatus === 'CRITICAL' ? 'alert' : tempStatus === 'WARNING' || tempVal > 32 ? 'warning' : 'normal';

  const humVal = sensors?.humidity;
  const humStatus = sensors?.humidityStatus || (humVal > 70 ? 'WARNING' : 'NORMAL');
  const humStatusLabel = humStatus === 'WARNING' || humVal > 70 ? 'ELEVATED' : 'BALANCED';
  const humStateType = humStatus === 'WARNING' || humVal > 70 ? 'warning' : 'normal';

  const distVal = sensors?.distance;
  const distStatus = sensors?.distanceStatus || (distVal < 15 ? 'WARNING' : 'NORMAL');
  const distStatusLabel = distStatus === 'OBSTACLE_WARNING' || distVal < 15 ? 'CLOSE OBJECT' : 'CLEAR';
  const distStateType = distStatus === 'OBSTACLE_WARNING' || distVal < 15 ? 'warning' : 'normal';

  const motionVal = Boolean(sensors?.motion);
  const motionStatus = sensors?.motionStatus === 'MOTION_DETECTED' || motionVal ? (isArmed ? 'CRITICAL' : 'WARNING') : 'NORMAL';
  const motionStatusLabel = motionVal ? (isArmed ? 'BREACH DETECTED' : 'ACTIVE') : 'SECURE';
  const motionStateType = motionVal ? (isArmed ? 'alert' : 'active') : 'normal';

  const soundVal = Boolean(sensors?.sound);
  const soundStatus = sensors?.soundStatus === 'SOUND_DETECTED' || soundVal ? 'WARNING' : 'NORMAL';
  const soundStatusLabel = soundVal ? 'NOISE PEAK' : 'QUIET';
  const soundStateType = soundVal ? 'warning' : 'normal';

  const touchVal = Boolean(sensors?.touch);
  const touchStatus = sensors?.touchStatus === 'SOS_ACTIVATED' || touchVal ? 'CRITICAL' : 'NORMAL';
  const touchStatusLabel = touchVal ? 'SOS ACTIVATED' : 'IDLE';
  const touchStateType = touchVal ? 'alert' : 'normal';

  const hasCriticalAlert = alerts.some((a) => a.severity === 'CRITICAL' && !a.acknowledged && !a.read);
  const systemStatusText = hasCriticalAlert ? 'Attention Required' : 'All Systems Operational';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* 1. Header: Greeting / SmartSense Overview */}
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
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            SmartSense Overview
          </div>
          <h1 className="page-title" style={{ marginTop: '0.2rem' }}>
            {greeting}, Operator
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Device: <strong style={{ color: 'var(--accent-blue)' }}>SmartRoom-01</strong> <span style={{ color: 'var(--text-muted)' }}>({deviceId})</span> • Zone: <strong style={{ color: 'var(--text-primary)' }}>{device?.room || 'Room 1'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* System Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: hasCriticalAlert ? '#ef4444' : '#10b981',
                boxShadow: hasCriticalAlert ? '0 0 6px #ef4444' : '0 0 6px #10b981',
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: hasCriticalAlert ? '#f87171' : '#10b981' }}>
              {systemStatusText}
            </span>
          </div>

          {/* Last Updated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Clock size={14} color="var(--accent-blue)" />
            <span>Updated {formatRelativeTime(sensors?.timestamp)}</span>
          </div>

          {/* Current Security Mode Badge */}
          <StatusBadge
            status={isArmed ? 'CRITICAL' : 'ONLINE'}
            label={isArmed ? 'ARMED' : 'DISARMED'}
          />
        </div>
      </section>

      {/* 2. KEY METRICS */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="section-title">Key Metrics</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time telemetry stream</span>
        </div>

        <div className="sensors-grid">
          {/* Temperature */}
          <SensorCard
            title="Temperature"
            subtitle="DHT22 Sensor"
            value={tempVal !== undefined && tempVal !== null ? tempVal : '--'}
            unit="°C"
            icon={Thermometer}
            iconBg="rgba(20, 107, 255, 0.1)"
            iconColor="#146BFF"
            status={tempStatus}
            statusLabel={tempStatusLabel}
            stateType={tempStateType}
            lastUpdated={`Updated ${formatRelativeTime(sensors?.timestamp)}`}
          />

          {/* Humidity */}
          <SensorCard
            title="Humidity"
            subtitle="DHT22 Sensor"
            value={humVal !== undefined && humVal !== null ? humVal : '--'}
            unit="%"
            icon={Droplets}
            iconBg="rgba(47, 128, 237, 0.1)"
            iconColor="#2F80ED"
            status={humStatus}
            statusLabel={humStatusLabel}
            stateType={humStateType}
            lastUpdated={`Updated ${formatRelativeTime(sensors?.timestamp)}`}
          />

          {/* Distance */}
          <SensorCard
            title="Distance"
            subtitle="HC-SR04 Ultrasonic"
            value={distVal !== undefined && distVal !== null ? distVal : '--'}
            unit="cm"
            icon={Ruler}
            iconBg="rgba(22, 163, 74, 0.1)"
            iconColor="#16A34A"
            status={distStatus}
            statusLabel={distStatusLabel}
            stateType={distStateType}
            lastUpdated={`Updated ${formatRelativeTime(sensors?.timestamp)}`}
          />

          {/* Motion */}
          <SensorCard
            title="Motion"
            subtitle="HC-SR501 PIR"
            value={motionVal ? 'DETECTED' : 'CLEAR'}
            unit=""
            icon={Activity}
            iconBg={motionVal ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.12)'}
            iconColor={motionVal ? '#ef4444' : '#94a3b8'}
            status={motionStatus}
            statusLabel={motionStatusLabel}
            stateType={motionStateType}
            lastUpdated={`Updated ${formatRelativeTime(sensors?.timestamp)}`}
          />
        </div>
      </section>

      {/* 3. ENVIRONMENT OVERVIEW */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="section-title">Environment Overview</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Atmospheric drift telemetry</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
          <ChartCard
            title="Temperature Chart"
            subtitle="Thermal drift history"
            timeRange={tempRange}
            onTimeRangeChange={setTempRange}
          >
            <div style={{ height: '240px' }}>
              <Line data={tempChartConfig} options={chartOptions} />
            </div>
          </ChartCard>

          <ChartCard
            title="Humidity Chart"
            subtitle="Relative humidity history"
            timeRange={humRange}
            onTimeRangeChange={setHumRange}
          >
            <div style={{ height: '240px' }}>
              <Line data={humChartConfig} options={chartOptions} />
            </div>
          </ChartCard>
        </div>
      </section>

      {/* 4. SECURITY & ACTIVITY */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="section-title">Security & Activity</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Perimeter & sensor triggers</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Prominent Security Control Card */}
          <div className="security-panel-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Security System
                </span>
                <span className={`security-status-indicator ${isArmed ? 'armed' : 'disarmed'}`}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isArmed ? '#ef4444' : '#10b981',
                      boxShadow: isArmed ? '0 0 6px #ef4444' : '0 0 6px #10b981',
                    }}
                  />
                  {isArmed ? 'ARMED' : 'DISARMED'}
                </span>
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {isArmed ? 'System is monitoring' : 'Perimeter standby mode'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {isArmed
                  ? 'Active intrusion monitoring enabled. Any PIR motion will trigger a critical breach alarm.'
                  : 'System in disarmed state. Ambient sensors reporting without security alerts.'}
              </p>
            </div>

            <button
              onClick={handleOpenSecurityConfirm}
              disabled={isTogglingSecurity}
              className={`security-toggle-btn ${isArmed ? 'btn-disarm' : 'btn-arm'}`}
            >
              {isArmed ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
              <span>{isArmed ? 'DISARM' : 'ARM SYSTEM'}</span>
            </button>
          </div>

          {/* Activity Sensor 1: Motion */}
          <SensorCard
            title="Motion (PIR)"
            subtitle="HC-SR501 Passive Infrared"
            value={motionVal ? 'DETECTED' : 'SECURE'}
            unit=""
            icon={Activity}
            iconBg={motionVal ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.12)'}
            iconColor={motionVal ? '#ef4444' : '#94a3b8'}
            status={motionStatus}
            statusLabel={motionVal ? 'MOTION ACTIVE' : 'NO MOTION'}
            stateType={motionStateType}
            lastUpdated="Human Presence Monitor"
          />

          {/* Activity Sensor 2: Sound */}
          <SensorCard
            title="Sound"
            subtitle="Microphone Sensor"
            value={soundVal ? 'DETECTED' : 'NORMAL'}
            unit=""
            icon={Volume2}
            iconBg={soundVal ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.12)'}
            iconColor={soundVal ? '#f59e0b' : '#94a3b8'}
            status={soundStatus}
            statusLabel={soundStatusLabel}
            stateType={soundStateType}
            lastUpdated="Acoustic Baseline Detection"
          />

          {/* Activity Sensor 3: Touch / SOS */}
          <SensorCard
            title="Touch / SOS"
            subtitle="TTP223 Capacitive Key"
            value={touchVal ? 'ACTIVATED' : 'STANDBY'}
            unit=""
            icon={Fingerprint}
            iconBg={touchVal ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.12)'}
            iconColor={touchVal ? '#ef4444' : '#94a3b8'}
            status={touchStatus}
            statusLabel={touchStatusLabel}
            stateType={touchStateType}
            lastUpdated="Emergency Panic Trigger"
          />
        </div>
      </section>

      {/* 5. RECENT ALERTS */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="section-title">Recent Alerts</h2>
          <Link
            to="/alerts"
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '600',
            }}
          >
            View All Alerts <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.slice(0, 3).map((alert) => (
            <AlertCard
              key={alert.alertId || alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
            />
          ))}
          {alerts.length === 0 && (
            <EmptyState
              title="No Alerts"
              message="Everything looks good. No security or environmental alerts recorded."
            />
          )}
        </div>
      </section>

      {/* 6. DEVICE STATUS */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="section-title">Device Status</h2>
          <Link
            to="/device"
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '600',
            }}
          >
            Full Hardware Vitals <ArrowRight size={14} />
          </Link>
        </div>

        <DeviceStatus device={device} />
      </section>

      {/* Confirmation Dialog for Security Mode Changes */}
      <ConfirmationModal
        isOpen={showSecurityConfirm}
        title={isArmed ? 'Disarm Security Perimeter?' : 'Arm Security Perimeter?'}
        message={
          isArmed
            ? 'Disarming will switch the surveillance perimeter into standby mode. Intrusion alarms will be paused, although environmental telemetry logging will continue.'
            : 'Arming will enable active PIR intrusion detection. Any detected motion in the monitored zone will immediately trigger a critical security breach alarm.'
        }
        confirmLabel={isArmed ? 'Disarm System' : 'Arm System'}
        cancelLabel="Cancel"
        isDestructive={isArmed}
        isLoading={isTogglingSecurity}
        onConfirm={handleConfirmSecurityToggle}
        onCancel={() => setShowSecurityConfirm(false)}
      />
    </div>
  );
}

export default Dashboard;
