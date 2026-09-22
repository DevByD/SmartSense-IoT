/**
 * SmartSense IoT Mobile - Configuration
 * Resolves API endpoints, target device identifier, and polling cadences.
 */

// Read Expo Public environment variables
const envApiUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL
  ? process.env.EXPO_PUBLIC_API_BASE_URL
  : 'http://localhost:5000/api';

const envDeviceId = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEVICE_ID
  ? process.env.EXPO_PUBLIC_DEVICE_ID
  : 'smartsense-pi-01';

export const API_BASE_URL = envApiUrl.replace(/\/+$/, '');
export const DEFAULT_DEVICE_ID = envDeviceId.trim();

// Polling intervals in milliseconds
export const POLLING_INTERVALS = {
  LIVE_SENSORS: 2500, // 2.5 seconds (within 2-3s requirement)
  ALERTS: 5000,       // 5 seconds
  DEVICE_STATUS: 6000 // 6 seconds
};

export const REQUEST_TIMEOUT_MS = 10000; // 10s request abort timeout
