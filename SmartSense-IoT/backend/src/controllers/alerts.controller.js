import alertsService from '../services/alerts.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAlerts = async (req, res, next) => {
  try {
    const { limit, severity, acknowledged, deviceId } = req.query;
    const alerts = await alertsService.getAlerts({ limit, severity, acknowledged, deviceId });
    return sendSuccess(res, alerts, 200, { count: alerts.length });
  } catch (err) {
    next(err);
  }
};

export const getAlertById = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const alert = await alertsService.getAlertById(alertId);
    return sendSuccess(res, alert);
  } catch (err) {
    next(err);
  }
};

export const acknowledgeAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const updated = await alertsService.acknowledgeAlert(alertId);
    return sendSuccess(res, updated, 200, { message: 'Alert acknowledged successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
};
