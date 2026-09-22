/**
 * SmartSense IoT Mobile - API Types & Constants
 * Defines status enums, metric thresholds, time-range options, and sensor metadata.
 */

export const SEVERITIES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
};

export const SECURITY_MODES = {
  ARMED: 'ARMED',
  DISARMED: 'DISARMED',
};

export const DEVICE_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

export const TIME_RANGES = ['1h', '6h', '24h', '7d'];

export const SENSOR_DEFINITIONS = {
  temperature: {
    id: 'temperature',
    label: 'Temperature',
    unit: '°C',
    icon: 'thermometer',
    iconFamily: 'Feather',
    warningThreshold: 32.0,
    criticalThreshold: 35.0,
  },
  humidity: {
    id: 'humidity',
    label: 'Humidity',
    unit: '%',
    icon: 'droplet',
    iconFamily: 'Feather',
    warningThreshold: 75.0,
    criticalThreshold: 85.0,
  },
  distance: {
    id: 'distance',
    label: 'Distance',
    unit: 'cm',
    icon: 'minimize-2',
    iconFamily: 'Feather',
    warningThreshold: 15.0,
    criticalThreshold: 5.0,
  },
  motion: {
    id: 'motion',
    label: 'PIR Motion',
    unit: '',
    icon: 'activity',
    iconFamily: 'Feather',
    booleanType: true,
  },
  sound: {
    id: 'sound',
    label: 'Sound Sensor',
    unit: '',
    icon: 'volume-2',
    iconFamily: 'Feather',
    booleanType: true,
  },
  touch: {
    id: 'touch',
    label: 'Touch / SOS',
    unit: '',
    icon: 'alert-octagon',
    iconFamily: 'Feather',
    booleanType: true,
  },
};
