import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  Radio,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Loader2,
  Check,
  CheckCircle2,
  Activity,
  Ruler,
  Thermometer,
  Volume2,
  Fingerprint,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';
import devicesApi from '../services/devicesApi';
import ConfirmationModal from '../components/ConfirmationModal';

export function DeviceStatusPage() {
  const {
    device,
    securityMode,
    setSecurityMode,
    loading,
    error,
    refetch,
  } = useOutletContext();

  const [deviceList, setDeviceList] = useState([]);
  const [isToggling, setIsToggling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let active = true;
    devicesApi
      .getDevices()
      .then((devices) => {
        if (active && Array.isArray(devices)) {
          setDeviceList(devices);
        }
      })
      .catch((err) => console.warn('[DeviceStatusPage] Failed to fetch device list:', err.message));
    return () => {
      active = false;
    };
  }, []);

  if (loading && !device) {
    return <LoadingState message="Loading device status and hardware gateway..." />;
  }

  if (error && !device) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const isArmed = securityMode === 'ARMED';
  const isOnline = device?.status === 'ONLINE';

  const handleOpenConfirm = () => {
    setShowConfirm(true);
  };

  const handleConfirmToggle = async () => {
    setIsToggling(true);
    setActionError(null);
    try {
      const nextMode = isArmed ? 'DISARMED' : 'ARMED';
      await setSecurityMode(nextMode);
      setShowConfirm(false);
    } catch (err) {
      console.error('Failed to change security mode:', err);
      setActionError(err.message || 'Failed to update security mode');
    } finally {
      setIsToggling(false);
    }
  };

  const attachedSensors = [
    { name: 'DHT22', desc: 'Digital Temperature & Relative Humidity', pin: 'GPIO 4', status: 'Online' },
    { name: 'HC-SR04', desc: 'Ultrasonic Distance Transducer', pin: 'GPIO 23/24', status: 'Online' },
    { name: 'PIR', desc: 'Passive Infrared Human Motion (HC-SR501)', pin: 'GPIO 27', status: 'Online' },
    { name: 'Sound', desc: 'Acoustic Microphone Threshold Sensor', pin: 'GPIO 22', status: 'Online' },
    { name: 'Touch', desc: 'Capacitive Emergency / SOS Key (TTP223)', pin: 'GPIO 18', status: 'Online' },
  ];

  const gpioPinouts = [
    { pin: 'GPIO 4 (Pin 7)', sensor: 'DHT22 Temp & Humidity', type: 'Digital I/O', status: 'Active' },
    { pin: 'GPIO 23 (Pin 16)', sensor: 'HC-SR04 Trigger', type: 'Digital Out', status: 'Active' },
    { pin: 'GPIO 24 (Pin 18)', sensor: 'HC-SR04 Echo (Divider)', type: 'Digital In', status: 'Active' },
    { pin: 'GPIO 27 (Pin 13)', sensor: 'HC-SR501 PIR Motion', type: 'Digital In', status: 'Active' },
    { pin: 'GPIO 22 (Pin 15)', sensor: 'Sound Sensor', type: 'Digital In', status: 'Active' },
    { pin: 'GPIO 18 (Pin 12)', sensor: 'TTP223 Touch / SOS', type: 'Digital In', status: 'Active' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* 1. Header: Device Management */}
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
          <h1 className="page-title" style={{ margin: 0 }}>Device Status</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Smart environmental monitoring gateway, network connectivity, and sensor telemetry mapping
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StatusBadge
            status={device?.status || 'OFFLINE'}
            label={isOnline ? 'GATEWAY ONLINE' : 'GATEWAY OFFLINE'}
          />
          <button
            onClick={handleOpenConfirm}
            disabled={isToggling}
            className={`security-mode-toggle ${isArmed ? 'armed' : 'disarmed'}`}
            style={{ padding: '0.45rem 0.95rem' }}
          >
            {isToggling ? (
              <Loader2 size={16} className="spin" />
            ) : isArmed ? (
              <ShieldAlert size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
            <span>{isArmed ? 'ARMED' : 'DISARMED'}</span>
          </button>
        </div>
      </section>

      {/* 2. Primary Device Card */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Main Device Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(20, 107, 255, 0.1)',
                border: '1px solid rgba(20, 107, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#146BFF',
                flexShrink: 0,
              }}
            >
              <Server size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  SmartRoom-01
                </h2>
                {/* Clean status indicator: ● ONLINE */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: isOnline ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                    color: isOnline ? '#16A34A' : '#DC2626',
                    border: `1px solid ${isOnline ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
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
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Dedicated smart environmental monitoring gateway (Hardware: Raspberry Pi 4B)
              </p>
            </div>
          </div>
        </div>

        {/* Device Metadata Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            margin: '1.5rem 0',
            padding: '1.25rem',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Device ID
            </span>
            <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
              {device?.deviceId || 'smartsense-pi-01'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Room
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {device?.room || 'Room 1'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Last Seen
            </span>
            <div className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {device?.lastSeen ? formatDateTime(device.lastSeen) : 'Just now'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connection
            </span>
            <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
              MQTT
            </div>
          </div>
        </div>

        {/* Attached Sensors Checklist */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
            Integrated Physical Sensors
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {attachedSensors.map((s) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 0.9rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Check size={13} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {s.pin}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Hardware Vitals Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="section-title">Hardware Telemetry</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Broadcom BCM2711 Metrics</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="device-metric-item">
            <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={15} /> CPU Core Temperature
            </div>
            <div className="device-metric-val font-mono">
              {device?.cpuTemperature ? `${device.cpuTemperature} °C` : '--'}
            </div>
          </div>

          <div className="device-metric-item">
            <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HardDrive size={15} /> RAM Utilization
            </div>
            <div className="device-metric-val font-mono">
              {device?.memoryUsage ? `${device.memoryUsage}%` : '--'}
            </div>
          </div>

          <div className="device-metric-item">
            <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wifi size={15} /> Network IP
            </div>
            <div className="device-metric-val font-mono" style={{ fontSize: '1rem' }}>
              {device?.ipAddress || '192.168.1.100'}
            </div>
          </div>

          <div className="device-metric-item">
            <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} /> Last Seen Heartbeat
            </div>
            <div className="device-metric-val font-mono" style={{ fontSize: '0.85rem' }}>
              {device?.lastSeen ? formatRelativeTime(device.lastSeen) : 'Active now'}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Raspberry Pi GPIO Pinout Map */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Layers size={18} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Physical 40-Pin GPIO Header Mapping
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-muted)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>BCM / Physical Pin</th>
                <th style={{ padding: '0.75rem 1rem' }}>Attached Sensor Module</th>
                <th style={{ padding: '0.75rem 1rem' }}>Signal Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {gpioPinouts.map((row, idx) => (
                <tr
                  key={row.pin}
                  style={{
                    borderBottom: idx < gpioPinouts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    color: 'var(--text-primary)',
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem' }} className="font-mono text-blue">
                    {row.pin}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>
                    {row.sensor}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {row.type}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(22, 163, 74, 0.1)',
                        color: '#16A34A',
                        border: '1px solid rgba(22, 163, 74, 0.25)',
                        fontWeight: '600',
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Dialog for Security Mode Transitions */}
      <ConfirmationModal
        isOpen={showConfirm}
        title={isArmed ? 'Disarm SmartRoom-01 Security?' : 'Arm SmartRoom-01 Security?'}
        message={
          isArmed
            ? 'Disarming SmartRoom-01 will disable intrusion alarms on GPIO motion pins. Telemetry ingestion will remain active.'
            : 'Arming SmartRoom-01 will activate perimeter intrusion monitoring. Any motion detected by HC-SR501 will trigger immediate critical breach alerts.'
        }
        confirmLabel={isArmed ? 'Disarm System' : 'Arm System'}
        cancelLabel="Cancel"
        isDestructive={isArmed}
        isLoading={isToggling}
        onConfirm={handleConfirmToggle}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default DeviceStatusPage;
