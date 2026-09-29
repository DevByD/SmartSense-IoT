import { getLatestMqttSensorData } from './mqtt.service.js';
import { AppError } from '../middleware/errorHandler.js';

class SensorsService {
  async getLatest(deviceId) {
    const reading = getLatestMqttSensorData(deviceId);

    if (!reading || !reading.timestamp) {
      throw new AppError(
        'SENSOR_DATA_NOT_FOUND',
        `No latest sensor reading found for device: ${deviceId}`,
        404
      );
    }

    return reading;
  }

  async getHistory(deviceId, { limit = 50, start = null, end = null } = {}) {
    return [];
  }
}

export const sensorsService = new SensorsService();
export default sensorsService;