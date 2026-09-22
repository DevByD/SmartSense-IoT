import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Activity, Cpu } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

/**
 * Professional Split-Layout Login Screen
 * Left: SmartSense IoT Platform brand panel
 * Right: Clean, elegant credential authentication form
 */
export function Login() {
  const [email, setEmail] = useState('admin@smartsense.iot');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="login-page-container">
      <div className="login-split-card">
        {/* Left: Brand Presentation Panel */}
        <div className="login-brand-panel">
          <div>
            <BrandLogo size={42} subtitle="Surveillance & Telemetry" />
            <h2 style={{ fontSize: '1.65rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2rem', lineHeight: 1.25 }}>
              Monitor your environment intelligently.
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.85rem', lineHeight: 1.6 }}>
              Enterprise environmental surveillance, real-time threshold detection, and instant perimeter security dispatch.
            </p>
          </div>

          <div style={{ margin: '2rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 107, 255, 0.1)', color: '#146BFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={13} />
                </div>
                <span>Real-time environmental telemetry</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={13} />
                </div>
                <span>Perimeter security breach defense</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(47, 128, 237, 0.1)', color: '#2F80ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={13} />
                </div>
                <span>Direct SmartRoom-01 hardware gateway link</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            <span>IoT</span> • <span>Analytics</span> • <span>Security</span>
          </div>
        </div>

        {/* Right: Authentication Form Panel */}
        <div className="login-form-panel">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Enter your credentials to access the SmartSense console.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem 0.7rem 2.4rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', cursor: 'pointer' }}>
                  Forgot password?
                </span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem 0.7rem 2.4rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem',
                justifyContent: 'center',
                marginTop: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Operator Demo: <strong style={{ color: 'var(--text-secondary)' }}>admin@smartsense.iot</strong> (Any password accepted)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
