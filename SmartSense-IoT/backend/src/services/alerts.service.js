import firebaseService from './firebase.service.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];

class AlertsService {
  async getAlerts({ limit = 50, severity = null, acknowledged = null, deviceId = null } = {}) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
      throw new AppError('INVALID_LIMIT', 'Limit parameter must be an integer between 1 and 200', 400);
    }

    if (severity) {
      const upper = severity.toUpperCase();
      if (!ALLOWED_SEVERITIES.includes(upper)) {
        throw new AppError(
          'INVALID_SEVERITY',
          `Severity must be one of: ${ALLOWED_SEVERITIES.join(', ')}`,
          400
        );
      }
    }

    if (acknowledged !== null && acknowledged !== undefined) {
      const ackStr = String(acknowledged).toLowerCase();
      if (ackStr !== 'true' && ackStr !== 'false') {
        throw new AppError('INVALID_ACKNOWLEDGED', "Acknowledged parameter must be 'true' or 'false'", 400);
      }
    }

    return await firebaseService.getAlerts({
      limit: parsedLimit,
      severity,
      acknowledged,
      deviceId,
    });
  }

  async getAlertById(alertId) {
    if (!alertId || typeof alertId !== 'string') {
      throw new AppError('INVALID_ALERT_ID', 'Alert ID parameter is required', 400);
    }

    const alert = await firebaseService.getAlertById(alertId);
    if (!alert) {
      throw new AppError('ALERT_NOT_FOUND', `Alert not found with ID: ${alertId}`, 404);
    }

    return alert;
  }

  async acknowledgeAlert(alertId) {
    if (!alertId || typeof alertId !== 'string') {
      throw new AppError('INVALID_ALERT_ID', 'Alert ID parameter is required', 400);
    }

    const updated = await firebaseService.acknowledgeAlert(alertId);
    if (!updated) {
      throw new AppError('ALERT_NOT_FOUND', `Alert not found with ID: ${alertId}`, 404);
    }

    return updated;
  }
}

export const alertsService = new AlertsService();
export default alertsService;
