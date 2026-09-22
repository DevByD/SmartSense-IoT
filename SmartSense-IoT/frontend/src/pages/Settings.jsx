import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Cpu,
  Bell,
  Shield,
  Palette,
  Terminal,
  Save,
  CheckCircle2,
  RefreshCw,
  Download,
} from 'lucide-react';

/**
 * Settings Page organized into 6 distinct sections:
 * 1. Profile
 * 2. Device Configuration
 * 3. Notification Settings
 * 4. Security
 * 5. Appearance
 * 6. System
 */
export function Settings() {
  const context = useOutletContext();
  const { settings = {}, updateSettings = () => {}, securityMode, setSecurityMode, device } = context || {};

  // Form states
  const [operatorName, setOperatorName] = useState('Chief Surveillance Operator');
  const [operatorEmail, setOperatorEmail] = useState('admin@smartsense.iot');
  const [deviceId, setDeviceId] = useState(device?.deviceId || 'smartsense-pi-01');
  const [room, setRoom] = useState(device?.room || 'Room 1');
  const [tempThreshold, setTempThreshold] = useState(settings.tempThreshold || 32.0);
  const [distanceThreshold, setDistanceThreshold] = useState(settings.distanceThreshold || 15.0);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [themeMode, setThemeMode] = useState('white');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (updateSettings) {
      updateSettings({
        tempThreshold: Number(tempThreshold),
        distanceThreshold: Number(distanceThreshold),
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>System Settings</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Configure operator profile, hardware node parameters, alerts, and system security
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn-primary"
          style={{ cursor: 'pointer' }}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{saved ? 'Changes Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* SECTION 1: Profile */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <User size={20} color="#146BFF" />
            <h2 className="section-title" style={{ margin: 0 }}>Operator Profile</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Operator Email
              </label>
              <input
                type="email"
                value={operatorEmail}
                onChange={(e) => setOperatorEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: Device Configuration */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Cpu size={20} color="#146BFF" />
            <h2 className="section-title" style={{ margin: 0 }}>Device Configuration</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Assigned Device ID
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="font-mono text-blue"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Monitored Zone / Room
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: Notification Settings */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Bell size={20} color="#F59E0B" />
            <h2 className="section-title" style={{ margin: 0 }}>Notification Settings</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Temperature Warning Threshold (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Triggers WARNING alert when temperature exceeds this value.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Proximity Obstacle Threshold (cm)
              </label>
              <input
                type="number"
                step="1"
                value={distanceThreshold}
                onChange={(e) => setDistanceThreshold(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Triggers WARNING alert when distance drops below this distance.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ accentColor: 'var(--accent-blue)' }}
              />
              <span>Send immediate email dispatch on CRITICAL security alarms</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                style={{ accentColor: 'var(--accent-blue)' }}
              />
              <span>Enable audio alarm chime for emergency SOS and breach alerts</span>
            </label>
          </div>
        </section>

        {/* SECTION 4: Security */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Shield size={20} color="#DC2626" />
            <h2 className="section-title" style={{ margin: 0 }}>Security Controls</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={requireConfirmation}
                onChange={(e) => setRequireConfirmation(e.target.checked)}
                style={{ accentColor: 'var(--accent-blue)' }}
              />
              <span>Require confirmation dialog before Arming or Disarming security mode</span>
            </label>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Console Inactivity Lock Timeout
              </label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  maxWidth: '300px',
                  width: '100%',
                }}
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="never">Never (Persistent Console)</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 5: Appearance */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Palette size={20} color="#16A34A" />
            <h2 className="section-title" style={{ margin: 0 }}>Appearance & Layout</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Color Theme
              </label>
              <select
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="white">Professional White & Blue (Default)</option>
                <option value="contrast">High Contrast White</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Font Family
              </label>
              <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Inter (Clean Modern Sans-Serif)
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: System */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Terminal size={20} color="#146BFF" />
            <h2 className="section-title" style={{ margin: 0 }}>System & Diagnostics</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-main)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backend REST API</span>
              <div className="font-mono text-blue" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                http://localhost:5000/api
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gateway Firmware</span>
              <div className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                SmartSense Pi 4B v1.2.0
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pipeline Ingestion</span>
              <div className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                MQTT → Node-RED → RTDB
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => alert('Diagnostic log archive generated.')}
              className="btn-secondary"
              style={{ cursor: 'pointer' }}
            >
              <Download size={15} />
              <span>Export System Logs</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default Settings;
