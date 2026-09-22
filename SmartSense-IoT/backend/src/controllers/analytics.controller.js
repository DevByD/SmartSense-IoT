import analyticsService from '../services/analytics.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { range = '24h' } = req.query;

    const data = await analyticsService.getAnalytics(deviceId, { range });
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export default {
  getAnalytics,
};
