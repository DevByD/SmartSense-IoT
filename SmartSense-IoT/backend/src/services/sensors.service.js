import firebaseService from './firebase.service.js';
import { AppError } from '../middleware/errorHandler.js';

class SensorsService {
  async getLatest(deviceId) {
    const reading = await firebaseService.getLatestSensorReading(deviceId);
    if (!reading) {
      throw new AppError('SENSOR_DATA_NOT_FOUND', `No latest sensor reading found for device: ${deviceId}`, 404);
    }
    return reading;
  }

  async getHistory(deviceId, { limit = 50, start = null, end = null } = {}) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
      throw new AppError('INVALID_LIMIT', 'Limit parameter must be an integer between 1 and 500', 400);
    }

    if (start && isNaN(new Date(start).getTime())) {
      throw new AppError('INVALID_START_DATE', 'Start parameter must be a valid ISO-8601 date string or timestamp', 400);
    }

    if (end && isNaN(new Date(end).getTime())) {
      throw new AppError('INVALID_END_DATE', 'End parameter must be a valid ISO-8601 date string or timestamp', 400);
    }

    return await firebaseService.getSensorHistory(deviceId, {
      limit: parsedLimit,
      start,
      end,
    });
  }
}

export const sensorsService = new SensorsService();
export default sensorsService;
