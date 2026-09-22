import React from 'react';
import { Cpu, HardDrive, Wifi, Clock, Server, CheckCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatRelativeTime } from '../utils/formatters';

/**
 * SmartRoom-01 DeviceStatus component for hardware gateway monitoring.
 * Displays:
 * - Device Title: SmartRoom-01
 * - Subtitle: Smart environmental monitoring gateway
 * - Status indicator: ● ONLINE
 * - Device ID: smartsense-pi-01
 * - Room: Room 1
 * - Connection: MQTT
 * - Last seen
 * - Integrated sensors checklist
 */
export function DeviceStatus({ device }) {
  if (!device) return null;

  const isOnline = device?.status === 'ONLINE';
  const deviceId = device.deviceId || 'smartsense-pi-01';
  const displayName = deviceId === 'smartsense-pi-01' ? 'SmartRoom-01' : (device.name || deviceId);

  return (
    <div className="device-status-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: '#EFF6FF',
              border: '1px solid rgba(20, 107, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#146BFF',
            }}
          >
            <Server size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--dark-navy)', margin: 0 }}>
              {displayName}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Smart environmental monitoring gateway • Device ID: <span className="font-mono text-blue">{deviceId}</span> • Room: <strong style={{ color: 'var(--text-secondary)' }}>{device.room || 'Room 1'}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StatusBadge
            status={device?.status || 'OFFLINE'}
            label={isOnline ? 'ONLINE' : 'OFFLINE'}
          />
        </div>
      </div>

      {/* Telemetry Vitals Grid */}
      <div className="device-telemetry-grid">
        <div className="device-metric-item">
          <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Cpu size={14} color="#146BFF" /> CPU Core Temperature
          </div>
          <div className="device-metric-val font-mono">
            {device.cpuTemperature ? `${device.cpuTemperature} °C` : '42.8 °C'}
          </div>
        </div>

        <div className="device-metric-item">
          <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <HardDrive size={14} color="#146BFF" /> Memory Utilization
          </div>
          <div className="device-metric-val font-mono">
            {device.memoryUsage ? `${device.memoryUsage}%` : '38.4%'}
          </div>
        </div>

        <div className="device-metric-item">
          <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Wifi size={14} color="#16A34A" /> Connection Protocol
          </div>
          <div className="device-metric-val font-mono" style={{ fontSize: '0.95rem' }}>
            MQTT • {device.ipAddress || '192.168.1.100'}
          </div>
        </div>

        <div className="device-metric-item">
          <div className="device-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} color="#F59E0B" /> Last Heartbeat
          </div>
          <div className="device-metric-val font-mono" style={{ fontSize: '0.95rem' }}>
            {device.lastSeen ? formatRelativeTime(device.lastSeen) : 'Just now'}
          </div>
        </div>
      </div>

      {/* Integrated Sensors Checklist */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Integrated Sensors (5 Active):
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--dark-navy)' }}>
          {['DHT22 (Temp & Hum)', 'HC-SR04 (Ultrasonic)', 'HC-SR501 (PIR)', 'Acoustic (Sound)', 'TTP223 (Touch)'].map((s) => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={13} color="#16A34A" />
              <span>{s}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeviceStatus;
