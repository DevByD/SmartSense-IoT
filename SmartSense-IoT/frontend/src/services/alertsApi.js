/**
 * SmartSense IoT Alerts API Service
 * Interacts with /api/alerts endpoints.
 */

import { get, patch } from './api.js';

/**
 * Fetch all alerts, with optional filtering.
 * @param {object} [filters={}] - { severity, acknowledged, deviceId, limit }
 * @returns {Promise<Array<object>>}
 */
export async function getAlerts(filters = {}) {
  return get('/alerts', filters);
}

/**
 * Fetch a single alert by its ID.
 * @param {string} alertId 
 * @returns {Promise<object>}
 */
export async function getAlertById(alertId) {
  if (!alertId) throw new Error('alertId is required');
  return get(`/alerts/${alertId}`);
}

/**
 * Acknowledge an alert by ID.
 * @param {string} alertId 
 * @returns {Promise<object>} - Updated alert payload
 */
export async function acknowledgeAlert(alertId) {
  if (!alertId) throw new Error('alertId is required');
  return patch(`/alerts/${alertId}/acknowledge`);
}

export default {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
};
