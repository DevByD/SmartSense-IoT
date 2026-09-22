/**
 * SmartSense IoT Mobile - Analytics API Service
 * Interacts with /api/analytics endpoints.
 */

import { get } from './api.js';
import { DEFAULT_DEVICE_ID } from '../config/api.config.js';

/**
 * Fetch aggregated analytics and time-series for a device.
 * @param {string} [deviceId] 
 * @param {'1h'|'6h'|'24h'|'7d'} [range='24h'] 
 * @returns {Promise<object>}
 */
export async function getAnalytics(deviceId, range = '24h') {
  const targetId = deviceId || (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEVICE_ID ? process.env.EXPO_PUBLIC_DEVICE_ID : DEFAULT_DEVICE_ID);
  return get(`/analytics/${targetId}`, { range });
}

export default {
  getAnalytics,
};
