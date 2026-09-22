import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js core components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Reusable ChartCard container with optional time-range filters
 */
export function ChartCard({
  title,
  subtitle,
  children,
  timeRange,
  onTimeRangeChange,
  showFilters = true,
  className = '',
}) {
  const filters = [
    { key: '1h', label: '1H' },
    { key: '6h', label: '6H' },
    { key: '24h', label: '24H' },
    { key: '7d', label: '7D' },
  ];

  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-header">
        <div className="chart-title-group">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {showFilters && onTimeRangeChange && (
          <div className="time-filter-buttons">
            {filters.map((f) => (
              <button
                key={f.key}
                className={`time-filter-btn ${timeRange === f.key ? 'active' : ''}`}
                onClick={() => onTimeRangeChange(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chart-body">{children}</div>
    </div>
  );
}

export default ChartCard;
