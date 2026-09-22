import sensorsService from '../services/sensors.service.js';
import config from '../config/env.js';
import { sendSuccess } from '../utils/response.js';

export const getLatestSensorReading = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId || req.query.deviceId || config.defaultDeviceId;
    const reading = await sensorsService.getLatest(deviceId);
    return sendSuccess(res, reading);
  } catch (err) {
    next(err);
  }
};

export const getSensorHistory = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId;
    const { limit, start, end } = req.query;

    const history = await sensorsService.getHistory(deviceId, { limit, start, end });
    return sendSuccess(res, history, 200, { count: history.length });
  } catch (err) {
    next(err);
  }
};

export default {
  getLatestSensorReading,
  getSensorHistory,
};
