import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Thermometer,
  Droplets,
  Ruler,
  Activity,
  Calendar,
  Filter,
  TrendingUp,
  BarChart3,
  Layers,
} from 'lucide-react';

import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatTimestamp } from '../utils/formatters';
import analyticsApi from '../services/analyticsApi';

export function Analytics() {
  const { device } = useOutletContext();
  const deviceId = device?.deviceId || 'smartsense-pi-01';

  const [timeRange, setTimeRange] = useState('24h');
  const [selectedSensor, setSelectedSensor] = useState('ALL'); // 'ALL' | 'TEMPERATURE' | 'HUMIDITY' | 'DISTANCE'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timeRanges = [
    { key: '1h', label: '1H' },
    { key: '6h', label: '6H' },
    { key: '24h', label: '24H' },
    { key: '7d', label: '7D' },
  ];

  const sensorFilters = [
    { key: 'ALL', label: 'All Sensors', icon: Layers },
    { key: 'TEMPERATURE', label: 'Temperature', icon: Thermometer },
    { key: 'HUMIDITY', label: 'Humidity', icon: Droplets },
    { key: 'DISTANCE', label: 'Distance', icon: Ruler },
  ];

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getAnalytics(deviceId, timeRange);
      setData(result);
    } catch (err) {
      console.error('[Analytics] Fetch failed:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [deviceId, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stats = data?.statistics || {};
  const tempStats = stats.temperature || { min: null, max: null, average: null };
  const humStats = stats.humidity || { min: null, max: null, average: null };
  const distStats = stats.distance || { min: null, max: null, average: null };

  const tempSeries = Array.isArray(data?.temperature) ? data.temperature : [];
  const humSeries = Array.isArray(data?.humidity) ? data.humidity : [];
  const distSeries = Array.isArray(data?.distance) ? data.distance : [];

  const tempLabels = tempSeries.map((d) => formatTimestamp(d.timestamp));
  const humLabels = humSeries.map((d) => formatTimestamp(d.timestamp));
  const distLabels = distSeries.map((d) => formatTimestamp(d.timestamp));

  // Consistent blue theme chart options
  const professionalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#6B7A99',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#14213D',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#DCE6F5',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(20, 107, 255, 0.05)' },
        ticks: { color: '#6B7A99', font: { family: 'Inter', size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(20, 107, 255, 0.05)' },
        ticks: { color: '#6B7A99', font: { family: 'Inter', size: 10 } },
      },
    },
  };

  // 1. Temperature Chart Data
  const tempChartData = {
    labels: tempLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: tempSeries.map((h) => h.value),
        borderColor: '#146BFF',
        backgroundColor: 'rgba(20, 107, 255, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: tempSeries.length > 40 ? 0 : 2.5,
        pointHoverRadius: 6,
      },
    ],
  };

  // 2. Humidity Chart Data
  const humChartData = {
    labels: humLabels,
    datasets: [
      {
        label: 'Humidity (%)',
        data: humSeries.map((h) => h.value),
        borderColor: '#2F80ED',
        backgroundColor: 'rgba(47, 128, 237, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: humSeries.length > 40 ? 0 : 2.5,
        pointHoverRadius: 6,
      },
    ],
  };

  // 3. Proximity / Distance Chart Data
  const distanceChartData = {
    labels: distLabels,
    datasets: [
      {
        label: 'Ultrasonic Distance (cm)',
        data: distSeries.map((h) => h.value),
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.08)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: distSeries.length > 40 ? 0 : 2.5,
        pointHoverRadius: 6,
      },
    ],
  };

  // 4. Events Summary Bar Chart
  const eventsChartData = {
    labels: ['Motion Detected', 'Sound Triggered', 'SOS Panic Touches'],
    datasets: [
      {
        label: 'Total Incidents in Range',
        data: [data?.motionEvents || 0, data?.soundEvents || 0, data?.touchEvents || 0],
        backgroundColor: [
          'rgba(239, 68, 68, 0.65)',
          'rgba(245, 158, 11, 0.65)',
          'rgba(168, 85, 247, 0.65)',
        ],
        borderColor: ['#ef4444', '#f59e0b', '#a855f7'],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* 1. Header: Analytics */}
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
            <h1 className="page-title" style={{ margin: 0 }}>Analytics</h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Historical trends, statistical distributions, and event analytics for <strong style={{ color: 'var(--accent-blue)' }}>SmartRoom-01</strong> <span style={{ color: 'var(--text-muted)' }}>({deviceId})</span>
          </p>
        </div>

        {/* Controls Strip: Time Range & Sensor Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Time range selector: 1H, 6H, 24H, 7D */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-main)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              gap: '0.25rem',
            }}
          >
            {timeRanges.map((r) => (
              <button
                key={r.key}
                onClick={() => setTimeRange(r.key)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: timeRange === r.key ? '#FFFFFF' : 'var(--text-secondary)',
                  background: timeRange === r.key ? 'var(--accent-blue)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  border: timeRange === r.key ? '1px solid var(--accent-blue)' : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Sensor selector: All, Temperature, Humidity, Distance */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-main)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              gap: '0.25rem',
            }}
          >
            {sensorFilters.map((sf) => {
              const Icon = sf.icon;
              return (
                <button
                  key={sf.key}
                  onClick={() => setSelectedSensor(sf.key)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: selectedSensor === sf.key ? '#FFFFFF' : 'var(--text-secondary)',
                    background: selectedSensor === sf.key ? 'var(--accent-blue)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    border: selectedSensor === sf.key ? '1px solid var(--accent-blue)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} />
                  <span>{sf.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Loading & Error States */}
      {loading && !data && <LoadingState message="Loading telemetry aggregates and time series..." />}
      {error && !data && <ErrorState message={error} onRetry={fetchAnalytics} />}

      {!loading && !error && (
        <>
          {/* 2. Statistical Highlights Cards: Average, Minimum, Maximum */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="section-title">Statistical Summary</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aggregate range: {timeRange.toUpperCase()}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Temperature Stats */}
              {(selectedSensor === 'ALL' || selectedSensor === 'TEMPERATURE') && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.4rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Thermometer size={18} color="#146BFF" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Temperature
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#146BFF', fontWeight: '600' }}>DHT22</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0.5rem 0 1rem 0' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {tempStats.average !== null ? `${tempStats.average}°C` : '--'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Average</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Minimum</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {tempStats.min !== null ? `${tempStats.min}°C` : '--'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Maximum</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {tempStats.max !== null ? `${tempStats.max}°C` : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Humidity Stats */}
              {(selectedSensor === 'ALL' || selectedSensor === 'HUMIDITY') && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.4rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Droplets size={18} color="#2F80ED" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Humidity
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#2F80ED', fontWeight: '600' }}>DHT22</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0.5rem 0 1rem 0' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {humStats.average !== null ? `${humStats.average}%` : '--'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Average</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Minimum</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {humStats.min !== null ? `${humStats.min}%` : '--'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Maximum</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {humStats.max !== null ? `${humStats.max}%` : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Distance Stats */}
              {(selectedSensor === 'ALL' || selectedSensor === 'DISTANCE') && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.4rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Ruler size={18} color="#16A34A" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Distance
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '600' }}>HC-SR04</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0.5rem 0 1rem 0' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {distStats.average !== null ? `${distStats.average} cm` : '--'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Average</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Minimum</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {distStats.min !== null ? `${distStats.min} cm` : '--'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Maximum</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {distStats.max !== null ? `${distStats.max} cm` : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Counts Summary */}
              {selectedSensor === 'ALL' && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.4rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} color="#f59e0b" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Events / Readings
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '600' }}>Telemetry</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0.5rem 0 1rem 0' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {data?.totalReadings ?? 0}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Total Ingested</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div>
                      <span>Motion</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {data?.motionEvents ?? 0}
                      </div>
                    </div>
                    <div>
                      <span>Sound</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {data?.soundEvents ?? 0}
                      </div>
                    </div>
                    <div>
                      <span>SOS Key</span>
                      <div className="font-mono" style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {data?.touchEvents ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. Large Professional Charts Grid */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="section-title">Telemetry Time Series</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consistent Blue Theme Visuals</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
              {/* Temperature Chart */}
              {(selectedSensor === 'ALL' || selectedSensor === 'TEMPERATURE') && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Temperature History
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Thermal drift curve in °C across {timeRange}
                      </p>
                    </div>
                  </div>

                  <div style={{ height: '280px', width: '100%' }}>
                    <Line data={tempChartData} options={professionalChartOptions} />
                  </div>
                </div>
              )}

              {/* Humidity Chart */}
              {(selectedSensor === 'ALL' || selectedSensor === 'HUMIDITY') && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Relative Humidity History
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Atmospheric moisture percentage across {timeRange}
                      </p>
                    </div>
                  </div>

                  <div style={{ height: '280px', width: '100%' }}>
                    <Line data={humChartData} options={professionalChartOptions} />
                  </div>
                </div>
              )}

              {/* Ultrasonic Distance Chart */}
              {(selectedSensor === 'ALL' || selectedSensor === 'DISTANCE') && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Proximity / Distance Range
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        HC-SR04 ultrasonic echo range (cm) across {timeRange}
                      </p>
                    </div>
                  </div>

                  <div style={{ height: '280px', width: '100%' }}>
                    <Line data={distanceChartData} options={professionalChartOptions} />
                  </div>
                </div>
              )}

              {/* Event Distribution Bar Chart */}
              {selectedSensor === 'ALL' && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Incident & Event Distribution
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Motion, acoustic sound, and SOS panic triggers
                      </p>
                    </div>
                  </div>

                  <div style={{ height: '280px', width: '100%' }}>
                    <Bar
                      data={eventsChartData}
                      options={{
                        ...professionalChartOptions,
                        plugins: {
                          ...professionalChartOptions.plugins,
                          legend: { display: false },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Analytics;
