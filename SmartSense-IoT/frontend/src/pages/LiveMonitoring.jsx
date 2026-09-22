import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Ruler,
  Activity,
  Volume2,
  Fingerprint,
  Clock,
  Radio,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

import SensorCard from '../components/SensorCard';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

const FILTER_OPTIONS = ['All Sensors', 'Environmental', 'Security', 'Activity'];

export function LiveMonitoring() {
  const {
    sensors,
    device,
    securityMode = 'DISARMED',
    loading,
    error,
    refetch,
  } = useOutletContext();

  const [activeFilter, setActiveFilter] = useState('All Sensors');
  const [selectedSensorId, setSelectedSensorId] = useState('temperature');
  const [isDetailExpanded, setIsDetailExpanded] = useState(true);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  const carouselRef = useRef(null);
  const lastProcessedTimeRef = useRef(null);

  // Rolling live buffer for telemetry chart
  const [telemetryHistory, setTelemetryHistory] = useState([
    { time: '14:40:00', temperature: 27.2, humidity: 62.0, distance: 46.2 },
    { time: '14:41:00', temperature: 27.8, humidity: 63.4, distance: 45.9 },
    { time: '14:42:00', temperature: 28.5, humidity: 64.2, distance: 45.6 },
  ]);

  // Real-time Event stream log buffer
  const [eventStream, setEventStream] = useState([
    {
      id: 'init-1',
      time: '14:42:10',
      title: 'Motion detected',
      detail: 'Room 1',
      color: '#DC2626',
    },
    {
      id: 'init-2',
      time: '14:42:08',
      title: 'Temperature updated (28.5°C)',
      detail: 'Room 1',
      color: '#146BFF',
    },
    {
      id: 'init-3',
      time: '14:42:06',
      title: 'Distance measured (45.6 cm)',
      detail: 'Room 1',
      color: '#16A34A',
    },
    {
      id: 'init-4',
      time: '14:41:55',
      title: 'Acoustic threshold normalized',
      detail: 'Room 1',
      color: '#F59E0B',
    },
    {
      id: 'init-5',
      time: '14:40:02',
      title: 'Telemetry heartbeat synced',
      detail: 'Room 1',
      color: '#146BFF',
    },
  ]);

  // Append new sensor data when arrived
  useEffect(() => {
    if (!sensors || !sensors.timestamp) return;
    if (lastProcessedTimeRef.current === sensors.timestamp) return;
    lastProcessedTimeRef.current = sensors.timestamp;

    const formattedTime = formatTimestamp(sensors.timestamp) || new Date().toLocaleTimeString();

    setTelemetryHistory((prev) => {
      const next = [
        ...prev,
        {
          time: formattedTime,
          temperature: sensors.temperature,
          humidity: sensors.humidity,
          distance: sensors.distance,
        },
      ];
      return next.slice(-20);
    });

    const newEvents = [];
    if (sensors.motion) {
      newEvents.push({
        id: `ev-motion-${Date.now()}`,
        time: formattedTime,
        title: 'Motion detected',
        detail: 'Room 1',
        color: '#DC2626',
      });
    }

    if (sensors.temperature !== undefined) {
      newEvents.push({
        id: `ev-temp-${Date.now()}`,
        time: formattedTime,
        title: `Temperature updated (${sensors.temperature}°C)`,
        detail: 'Room 1',
        color: '#146BFF',
      });
    }

    if (sensors.distance !== undefined) {
      newEvents.push({
        id: `ev-dist-${Date.now()}`,
        time: formattedTime,
        title: `Distance measured (${sensors.distance} cm)`,
        detail: 'Room 1',
        color: '#16A34A',
      });
    }

    if (sensors.sound) {
      newEvents.push({
        id: `ev-sound-${Date.now()}`,
        time: formattedTime,
        title: 'Acoustic noise peak',
        detail: 'Room 1',
        color: '#F59E0B',
      });
    }

    if (sensors.touch) {
      newEvents.push({
        id: `ev-touch-${Date.now()}`,
        time: formattedTime,
        title: 'Emergency SOS activated',
        detail: 'Room 1',
        color: '#DC2626',
      });
    }

    if (newEvents.length > 0) {
      setEventStream((prev) => [...newEvents, ...prev].slice(0, 30));
    }
  }, [sensors]);

  // Carousel scroll handler
  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleCarouselScroll = (e) => {
    const el = e.target;
    if (!el) return;
    const cardWidth = 300;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveCarouselIndex(index);
  };

  if (loading && !sensors) {
    return <LoadingState message="Connecting to real-time telemetry stream..." />;
  }

  if (error && !sensors) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const isArmed = securityMode === 'ARMED';

  // Sensor reading values
  const temp = sensors?.temperature;
  const hum = sensors?.humidity;
  const dist = sensors?.distance;
  const motion = Boolean(sensors?.motion);
  const sound = Boolean(sensors?.sound);
  const touch = Boolean(sensors?.touch);

  // Status mapping
  const tempStatus = sensors?.temperatureStatus || (temp >= 35 ? 'CRITICAL' : temp >= 32 ? 'WARNING' : 'NORMAL');
  const tempStatusLabel = tempStatus === 'CRITICAL' ? 'CRITICAL' : tempStatus === 'WARNING' || temp >= 32 ? 'ELEVATED' : 'OPTIMAL';

  const humStatus = sensors?.humidityStatus || (hum > 70 ? 'WARNING' : 'NORMAL');
  const humStatusLabel = humStatus === 'WARNING' || hum > 70 ? 'ELEVATED' : 'BALANCED';

  const distStatus = sensors?.distanceStatus || (dist < 15 ? 'WARNING' : 'NORMAL');
  const distStatusLabel = distStatus === 'OBSTACLE_WARNING' || dist < 15 ? 'CLOSE OBJECT' : 'CLEAR';

  const motionStatus = sensors?.motionStatus === 'MOTION_DETECTED' || motion ? (isArmed ? 'CRITICAL' : 'WARNING') : 'NORMAL';
  const motionStatusLabel = motion ? (isArmed ? 'BREACH DETECTED' : 'ACTIVE') : 'CLEAR';

  const soundStatus = sensors?.soundStatus === 'SOUND_DETECTED' || sound ? 'WARNING' : 'NORMAL';
  const soundStatusLabel = sound ? 'NOISE PEAK' : 'QUIET';

  const touchStatus = sensors?.touchStatus === 'SOS_ACTIVATED' || touch ? 'CRITICAL' : 'NORMAL';
  const touchStatusLabel = touch ? 'SOS ACTIVATED' : 'IDLE';

  const timestamp = sensors?.timestamp;

  // Sensor definitions
  const allSensorsList = [
    {
      id: 'temperature',
      title: 'Temperature',
      subtitle: 'DHT22 Digital Temperature Sensor',
      category: 'Environmental',
      icon: Thermometer,
      iconBg: '#EFF6FF',
      iconColor: '#146BFF',
      value: temp !== undefined && temp !== null ? temp : '--',
      unit: '°C',
      status: tempStatus,
      statusLabel: tempStatusLabel,
      stateType: tempStatus === 'CRITICAL' ? 'alert' : tempStatus === 'WARNING' || temp >= 32 ? 'warning' : 'normal',
      type: 'DHT22 High-Precision',
      gpio: 'GPIO 4',
      protocol: '1-Wire Digital',
      interval: '2.0 sec',
      normalRange: '18.0°C – 32.0°C',
      average: '27.4°C',
      minimum: '25.1°C',
      maximum: '30.2°C',
    },
    {
      id: 'humidity',
      title: 'Humidity',
      subtitle: 'DHT22 Relative Humidity Sensor',
      category: 'Environmental',
      icon: Droplets,
      iconBg: '#EFF6FF',
      iconColor: '#2F80ED',
      value: hum !== undefined && hum !== null ? hum : '--',
      unit: '%',
      status: humStatus,
      statusLabel: humStatusLabel,
      stateType: humStatus === 'WARNING' || hum > 70 ? 'warning' : 'normal',
      type: 'DHT22 Capacitive Moisture',
      gpio: 'GPIO 4',
      protocol: '1-Wire Digital',
      interval: '2.0 sec',
      normalRange: '30.0% – 70.0%',
      average: '62.8%',
      minimum: '55.0%',
      maximum: '68.5%',
    },
    {
      id: 'distance',
      title: 'Distance',
      subtitle: 'HC-SR04 Ultrasonic Distance Sensor',
      category: 'Activity',
      icon: Ruler,
      iconBg: '#ECFDF5',
      iconColor: '#16A34A',
      value: dist !== undefined && dist !== null ? dist : '--',
      unit: 'cm',
      status: distStatus,
      statusLabel: distStatusLabel,
      stateType: distStatus === 'OBSTACLE_WARNING' || dist < 15 ? 'warning' : 'normal',
      type: 'HC-SR04 Ultrasonic Transducer',
      gpio: 'GPIO 23 (Trig) / GPIO 24 (Echo)',
      protocol: 'Ultrasonic Pulse Timing',
      interval: '2.0 sec',
      normalRange: '15.0 cm – 400.0 cm',
      average: '46.2 cm',
      minimum: '42.0 cm',
      maximum: '48.5 cm',
    },
    {
      id: 'motion',
      title: 'PIR Motion',
      subtitle: 'HC-SR501 Passive Infrared Detector',
      category: 'Security',
      icon: Activity,
      iconBg: motion ? '#FEF2F2' : '#F8FAFC',
      iconColor: motion ? '#DC2626' : '#6B7A99',
      value: motion ? 'MOTION' : 'CLEAR',
      unit: '',
      status: motionStatus,
      statusLabel: motionStatusLabel,
      stateType: motion ? (isArmed ? 'alert' : 'warning') : 'normal',
      type: 'HC-SR501 Pyroelectric Sensor',
      gpio: 'GPIO 17',
      protocol: 'Digital High/Low Interrupt',
      interval: 'Real-time Event Interrupt',
      normalRange: 'Clear (Normal Monitoring)',
      average: 'State Toggle (0 / 1)',
      minimum: 'Low (0)',
      maximum: 'High (1)',
    },
    {
      id: 'sound',
      title: 'Sound Sensor',
      subtitle: 'Acoustic Sound Level Detector',
      category: 'Security',
      icon: Volume2,
      iconBg: sound ? '#FFFBEB' : '#F8FAFC',
      iconColor: sound ? '#F59E0B' : '#6B7A99',
      value: sound ? 'SOUND DETECTED' : 'QUIET',
      unit: '',
      status: soundStatus,
      statusLabel: soundStatusLabel,
      stateType: sound ? 'warning' : 'normal',
      type: 'LM393 Microphone Comparator',
      gpio: 'GPIO 27',
      protocol: 'Digital Threshold Interrupt',
      interval: 'Real-time Event Interrupt',
      normalRange: 'Quiet / Ambient Baseline',
      average: 'Baseline OK',
      minimum: 'Silent',
      maximum: 'Noise Spike',
    },
    {
      id: 'touch',
      title: 'Touch / SOS Key',
      subtitle: 'TTP223 Capacitive Emergency SOS',
      category: 'Security',
      icon: Fingerprint,
      iconBg: touch ? '#FEF2F2' : '#F8FAFC',
      iconColor: touch ? '#DC2626' : '#6B7A99',
      value: touch ? 'SOS ACTIVATED' : 'SAFE',
      unit: '',
      status: touchStatus,
      statusLabel: touchStatusLabel,
      stateType: touch ? 'alert' : 'normal',
      type: 'TTP223 Capacitive Touch Switch',
      gpio: 'GPIO 22',
      protocol: 'High-Priority Emergency Line',
      interval: 'Instantaneous Hardware IRQ',
      normalRange: 'Safe / Standby',
      average: 'Idle',
      minimum: 'Released',
      maximum: 'Triggered',
    },
  ];

  // Filtered sensors for carousel
  const filteredSensors = useMemo(() => {
    if (activeFilter === 'All Sensors') return allSensorsList;
    return allSensorsList.filter((s) => s.category.toLowerCase() === activeFilter.toLowerCase());
  }, [activeFilter, temp, hum, dist, motion, sound, touch, isArmed]);

  // Currently selected sensor object
  const selectedSensor = useMemo(() => {
    return allSensorsList.find((s) => s.id === selectedSensorId) || allSensorsList[0];
  }, [selectedSensorId, temp, hum, dist, motion, sound, touch, isArmed]);

  // Mini Chart data for the selected sensor
  const selectedChartData = useMemo(() => {
    const labels = telemetryHistory.map((h) => h.time);
    let values = [];
    let label = 'Value';

    if (selectedSensor.id === 'temperature') {
      label = 'Temperature (°C)';
      values = telemetryHistory.map((h) => h.temperature);
    } else if (selectedSensor.id === 'humidity') {
      label = 'Humidity (%)';
      values = telemetryHistory.map((h) => h.humidity);
    } else if (selectedSensor.id === 'distance') {
      label = 'Distance (cm)';
      values = telemetryHistory.map((h) => h.distance);
    } else {
      // Event based
      label = `${selectedSensor.title} State`;
      values = telemetryHistory.map((_, idx) => (idx % 2 === 0 ? 0 : 1));
    }

    return {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: '#146BFF',
          backgroundColor: 'rgba(20, 107, 255, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#146BFF',
        },
      ],
    };
  }, [selectedSensor.id, telemetryHistory]);

  const selectedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#14213D',
        bodyColor: '#17233C',
        borderColor: '#DCE6F5',
        borderWidth: 1,
        boxShadow: '0 4px 12px rgba(20, 33, 61, 0.08)',
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(220, 230, 245, 0.6)' },
        ticks: { color: '#6B7A99', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(220, 230, 245, 0.6)' },
        ticks: { color: '#6B7A99', font: { size: 10 } },
      },
    },
  };

  const SelectedIcon = selectedSensor.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* -------------------------------------------------------------
          1. HEADER & SYSTEM OVERVIEW BANNER
          ------------------------------------------------------------- */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1.75rem',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>LIVE MONITORING</h1>
            <span className="live-indicator-pill">
              <span className="live-dot" />
              <span>LIVE</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-time sensor data and environmental monitoring
          </p>
        </div>

        {/* System parameters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Device: <strong style={{ color: 'var(--dark-navy)' }}>SmartRoom-01</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Room: <strong style={{ color: 'var(--dark-navy)' }}>Room 1</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Clock size={14} color="#146BFF" />
            <span>Last updated: <strong>{formatRelativeTime(timestamp) || '2 seconds ago'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#16A34A', fontWeight: '600' }}>
            <Radio size={14} />
            <span>MQTT • Receiving data</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. SENSORS OVERVIEW (HORIZONTAL CAROUSEL)
          ------------------------------------------------------------- */}
      <section className="sensor-carousel-wrapper">
        <div className="carousel-controls-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>SENSORS OVERVIEW</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ({filteredSensors.length} active transducers)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Filter Control: All Sensors ▼ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Filter:</span>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                style={{
                  padding: '0.45rem 1.75rem 0.45rem 0.85rem',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  color: 'var(--dark-navy)',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  appearance: 'auto',
                }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Left / Right Arrow buttons */}
            <div className="carousel-nav-group">
              <button
                className="carousel-nav-btn"
                onClick={handleScrollLeft}
                title="Scroll Previous"
                aria-label="Previous sensor card"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="carousel-nav-btn"
                onClick={handleScrollRight}
                title="Scroll Next"
                aria-label="Next sensor card"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          className="carousel-track"
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          tabIndex={0}
          aria-label="Sensor overview carousel"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') handleScrollLeft();
            if (e.key === 'ArrowRight') handleScrollRight();
          }}
        >
          {filteredSensors.map((sensor) => {
            const isSelected = sensor.id === selectedSensorId;
            return (
              <div
                key={sensor.id}
                className="carousel-card-item"
                onClick={() => setSelectedSensorId(sensor.id)}
              >
                <SensorCard
                  title={sensor.title}
                  subtitle={sensor.subtitle}
                  value={sensor.value}
                  unit={sensor.unit}
                  icon={sensor.icon}
                  iconBg={sensor.iconBg}
                  iconColor={sensor.iconColor}
                  status={sensor.status}
                  statusLabel={sensor.statusLabel}
                  stateType={sensor.stateType}
                  isSelected={isSelected}
                  lastUpdated={`Updated ${formatRelativeTime(timestamp)}`}
                />
              </div>
            );
          })}
        </div>

        {/* Optional pagination dots */}
        <div className="carousel-dots">
          {filteredSensors.map((sensor, idx) => (
            <div
              key={sensor.id}
              className={`carousel-dot ${idx === activeCarouselIndex || sensor.id === selectedSensorId ? 'active' : ''}`}
              onClick={() => {
                setSelectedSensorId(sensor.id);
                if (carouselRef.current) {
                  carouselRef.current.scrollTo({ left: idx * 300, behavior: 'smooth' });
                }
              }}
              title={sensor.title}
              role="button"
              tabIndex={0}
              aria-label={`Select ${sensor.title}`}
            />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. SELECTED SENSOR DETAIL (ONE EXPANDED PANEL)
          ------------------------------------------------------------- */}
      <section className="sensor-detail-panel">
        {/* Panel Header */}
        <div className="sensor-detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: selectedSensor.iconBg,
                color: selectedSensor.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SelectedIcon size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--dark-navy)', margin: 0 }}>
                  {selectedSensor.title} Detail
                </h3>
                <span className="live-indicator-pill">
                  <span className="live-dot" />
                  <span>LIVE</span>
                </span>
                <StatusBadge status={selectedSensor.status} label={selectedSensor.statusLabel} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.15rem 0 0 0' }}>
                {selectedSensor.subtitle} • Room 1 (SmartRoom-01)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDetailExpanded(!isDetailExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
            aria-label="Toggle expanded details"
          >
            <span>{isDetailExpanded ? 'Collapse' : 'Expand'}</span>
            {isDetailExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Panel Body */}
        {isDetailExpanded && (
          <div className="sensor-detail-body">
            {/* Column 1: Current Metric & Statistical highlights */}
            <div className="detail-col-metric">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                  Live Telemetry Value
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--dark-navy)' }}>
                    {selectedSensor.value}
                  </span>
                  {selectedSensor.unit && (
                    <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                      {selectedSensor.unit}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#16A34A' }}>
                    Normal Operating Range ({selectedSensor.normalRange})
                  </span>
                </div>
              </div>

              {/* Statistics summary */}
              <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-sm)', padding: '0.85rem', border: '1px solid rgba(20, 107, 255, 0.15)', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Average:</span>
                  <strong style={{ color: 'var(--dark-navy)' }}>{selectedSensor.average}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Minimum:</span>
                  <strong style={{ color: 'var(--dark-navy)' }}>{selectedSensor.minimum}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Maximum:</span>
                  <strong style={{ color: 'var(--dark-navy)' }}>{selectedSensor.maximum}</strong>
                </div>
              </div>
            </div>

            {/* Column 2: Live Trend Chart */}
            <div className="detail-col-chart">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--dark-navy)', margin: 0 }}>
                  {selectedSensor.title} Real-Time Trend
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Continuous 2.0s Sampling
                </span>
              </div>
              <div style={{ height: '180px', width: '100%' }}>
                <Line data={selectedChartData} options={selectedChartOptions} />
              </div>
            </div>

            {/* Column 3: Hardware Sensor Information */}
            <div className="detail-col-info">
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--dark-navy)', margin: '0 0 0.5rem 0' }}>
                Sensor Hardware Info
              </h4>
              <div>
                <div className="sensor-info-item">
                  <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                  <strong style={{ color: 'var(--dark-navy)' }}>{selectedSensor.type}</strong>
                </div>
                <div className="sensor-info-item">
                  <span style={{ color: 'var(--text-muted)' }}>GPIO Pin:</span>
                  <strong className="font-mono" style={{ color: 'var(--primary-blue)' }}>{selectedSensor.gpio}</strong>
                </div>
                <div className="sensor-info-item">
                  <span style={{ color: 'var(--text-muted)' }}>Bus Protocol:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedSensor.protocol}</span>
                </div>
                <div className="sensor-info-item">
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{ color: '#16A34A', fontWeight: '600' }}>Online • Active</span>
                </div>
                <div className="sensor-info-item">
                  <span style={{ color: 'var(--text-muted)' }}>Interval:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedSensor.interval}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          4. COMPACT SENSOR LIST BELOW (EXPLORATION ROWS)
          ------------------------------------------------------------- */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>ALL SENSORS COMPACT LIST</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Click any row to display its expanded telemetry
          </span>
        </div>

        <div className="sensor-compact-list">
          {allSensorsList.map((sensor) => {
            const isSelected = sensor.id === selectedSensorId;
            const RowIcon = sensor.icon;
            return (
              <div
                key={sensor.id}
                className={`sensor-compact-row ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedSensorId(sensor.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedSensorId(sensor.id);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-sm)',
                      background: sensor.iconBg,
                      color: sensor.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RowIcon size={18} />
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--dark-navy)', fontSize: '0.9rem' }}>
                      {sensor.title}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.75rem' }}>
                      {sensor.subtitle}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--dark-navy)', fontSize: '0.95rem' }}>
                    {sensor.value} {sensor.unit}
                  </span>
                  <StatusBadge status={sensor.status} label={sensor.statusLabel} />
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. RECENT SENSOR EVENTS (COMPACT TIMELINE)
          ------------------------------------------------------------- */}
      <section className="event-stream-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>RECENT SENSOR EVENTS</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Real-time audit log of device events and sensory alerts
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing latest {eventStream.length} events
          </span>
        </div>

        <div className="event-stream-list">
          {eventStream.map((event) => (
            <div key={event.id} className="event-stream-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="event-stream-time">{event.time}</span>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: event.color,
                  }}
                />
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  {event.title}
                </span>
              </div>
              <span className="event-stream-badge font-mono">{event.detail}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default LiveMonitoring;
