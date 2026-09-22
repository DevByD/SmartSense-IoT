import React from 'react';

/**
 * Reusable Skeleton Line primitive with shimmer animation
 */
export function SkeletonLine({ width = '100%', height = '1rem', style = {}, className = '' }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius: 'var(--radius-sm)',
        ...style,
      }}
    />
  );
}

/**
 * Skeleton Card for sensor and telemetry card placeholders
 */
export function SkeletonCard() {
  return (
    <div className="sensor-card skeleton-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SkeletonLine width="38px" height="38px" style={{ borderRadius: 'var(--radius-md)' }} />
          <div>
            <SkeletonLine width="110px" height="1rem" style={{ marginBottom: '0.35rem' }} />
            <SkeletonLine width="80px" height="0.75rem" />
          </div>
        </div>
        <SkeletonLine width="50px" height="20px" style={{ borderRadius: '999px' }} />
      </div>

      <div style={{ margin: '1rem 0' }}>
        <SkeletonLine width="140px" height="2.25rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonLine width="70px" height="0.9rem" />
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <SkeletonLine width="120px" height="0.75rem" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for charts
 */
export function SkeletonChart({ height = '260px' }) {
  return (
    <div className="chart-card skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <SkeletonLine width="160px" height="1.2rem" style={{ marginBottom: '0.4rem' }} />
          <SkeletonLine width="220px" height="0.8rem" />
        </div>
        <SkeletonLine width="120px" height="30px" style={{ borderRadius: 'var(--radius-sm)' }} />
      </div>

      <div
        className="skeleton-shimmer"
        style={{
          height,
          width: '100%',
          borderRadius: 'var(--radius-md)',
        }}
      />
    </div>
  );
}

export default {
  SkeletonLine,
  SkeletonCard,
  SkeletonChart,
};
