import React from 'react';
import { SkeletonCard } from './SkeletonLoader';

/**
 * LoadingState combining skeleton placeholders with a clean spinner
 */
export function LoadingState({ message = 'Connecting to IoT Gateway & telemetry stream...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
          {message}
        </p>
      </div>

      <div className="sensors-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default LoadingState;
