import React from 'react';

/**
 * Modern IoT-inspired logo mark for SmartSense IoT.
 * Clean geometric sensor-node icon with vibrant blue accent.
 * Professional white and blue visual language.
 */
export function BrandLogo({ size = 32, showText = true, subtitle = 'IoT Surveillance', textClassName = '' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Outer squircle frame with subtle border */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          fill="#EFF6FF"
          stroke="#146BFF"
          strokeWidth="1.5"
          strokeOpacity="0.85"
        />
        {/* Central IoT Node Core */}
        <circle cx="16" cy="16" r="3.5" fill="#146BFF" />
        {/* Telemetry signal rings */}
        <path
          d="M10.5 11.5C12 10 14 9.2 16 9.2C18 9.2 20 10 21.5 11.5"
          stroke="#2F80ED"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M8 8.5C10.2 6.5 13 5.5 16 5.5C19 5.5 21.8 6.5 24 8.5"
          stroke="#2F80ED"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        {/* Lower signal reflection */}
        <path
          d="M10.5 20.5C12 22 14 22.8 16 22.8C18 22.8 20 22 21.5 20.5"
          stroke="#2F80ED"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: size >= 36 ? '1.25rem' : '1.05rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                color: 'var(--dark-navy)',
              }}
            >
              SmartSense
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                background: '#EFF6FF',
                color: '#146BFF',
                letterSpacing: '0.05em',
                border: '1px solid rgba(20, 107, 255, 0.25)',
              }}
            >
              IoT
            </span>
          </div>
          {subtitle && (
            <span
              style={{
                fontSize: '0.725rem',
                color: 'var(--text-muted)',
                fontWeight: '500',
                marginTop: '0.15rem',
              }}
              className={textClassName}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
