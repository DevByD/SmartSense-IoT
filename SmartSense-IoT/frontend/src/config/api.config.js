/**
 * SmartSense IoT Frontend API Configuration
 * Centralized settings for API endpoints, default hardware identifiers, and polling cadences.
 */

// Read environment variables from Vite or process.env (for tests)
const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

export const API_BASE_URL = (metaEnv.VITE_API_BASE_URL || procEnv.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

export const DEFAULT_DEVICE_ID = metaEnv.VITE_DEVICE_ID || procEnv.VITE_DEVICE_ID || 'smartsense-pi-01';

export const POLLING_INTERVAL_MS = 2500; // 2.5 seconds (in the specified 2000-3000 ms range)
