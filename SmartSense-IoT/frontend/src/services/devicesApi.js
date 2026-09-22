/**
 * SmartSense IoT Devices API Service
 * Interacts with /api/devices endpoints.
 */

import { get, patch } from './api.js';
import { DEFAULT_DEVICE_ID } from '../config/api.config.js';

/**
 * Fetch all registered IoT devices.
 * @returns {Promise<Array<object>>}
 */
export async function getDevices() {
  return get('/devices');
}

/**
 * Fetch device status and metadata by ID.
 * @param {string} [deviceId] 
 * @returns {Promise<object>}
 */
export async function getDeviceById(deviceId) {
  const targetId = deviceId || DEFAULT_DEVICE_ID;
  return get(`/devices/${targetId}`);
}

/**
 * Update the security surveillance mode for a device (ARMED / DISARMED).
 * @param {string} deviceId 
 * @param {'ARMED'|'DISARMED'} securityMode 
 * @returns {Promise<object>}
 */
export async function updateSecurityMode(deviceId, securityMode) {
  const targetId = deviceId || DEFAULT_DEVICE_ID;
  return patch(`/devices/${targetId}/security`, { securityMode });
}

export default {
  getDevices,
  getDeviceById,
  updateSecurityMode,
};
