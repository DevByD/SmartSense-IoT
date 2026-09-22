/**
 * SmartSense IoT Sensors API Service
 * Interacts with /api/sensors endpoints.
 */

import { get } from './api.js';
import { DEFAULT_DEVICE_ID } from '../config/api.config.js';

/**
 * Fetch the latest real-time sensor reading for a device or default device.
 * @param {string} [deviceId] 
 * @returns {Promise<object>}
 */
export async function getLatest(deviceId) {
  const targetId = deviceId || DEFAULT_DEVICE_ID;
  return get(`/sensors/latest/${targetId}`);
}

/**
 * Fetch historical sensor telemetry readings for a device.
 * @param {string} [deviceId] 
 * @param {object} [options={}] - { limit, start, end }
 * @returns {Promise<Array<object>>}
 */
export async function getHistory(deviceId, options = {}) {
  const targetId = deviceId || DEFAULT_DEVICE_ID;
  return get(`/sensors/history/${targetId}`, options);
}

export default {
  getLatest,
  getHistory,
};
