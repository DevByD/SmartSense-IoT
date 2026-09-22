import firebaseService from './firebase.service.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_RANGES = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

class AnalyticsService {
  async getAnalytics(deviceId, { range = '24h' } = {}) {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new AppError('INVALID_DEVICE_ID', 'Device ID parameter is required', 400);
    }

    const durationMs = ALLOWED_RANGES[range];
    if (!durationMs) {
      throw new AppError(
        'INVALID_RANGE',
        `Range must be one of: ${Object.keys(ALLOWED_RANGES).join(', ')}`,
        400
      );
    }

    const cutoffTime = new Date(Date.now() - durationMs).toISOString();
    const readings = await firebaseService.getSensorHistory(deviceId, {
      start: cutoffTime,
      limit: 500,
    });

    if (!readings || readings.length === 0) {
      return {
        deviceId,
        range,
        temperature: [],
        humidity: [],
        distance: [],
        statistics: {
          temperature: { min: null, max: null, average: null },
          humidity: { min: null, max: null, average: null },
          distance: { min: null, max: null, average: null },
        },
        motionEvents: 0,
        soundEvents: 0,
        touchEvents: 0,
        totalReadings: 0,
      };
    }

    // Prepare Chart.js friendly time series
    const temperatureSeries = [];
    const humiditySeries = [];
    const distanceSeries = [];

    let tempSum = 0;
    let tempMin = Infinity;
    let tempMax = -Infinity;
    let tempCount = 0;

    let humSum = 0;
    let humMin = Infinity;
    let humMax = -Infinity;
    let humCount = 0;

    let distSum = 0;
    let distMin = Infinity;
    let distMax = -Infinity;
    let distCount = 0;

    let motionEvents = 0;
    let soundEvents = 0;
    let touchEvents = 0;

    for (const r of readings) {
      const ts = r.timestamp || r.processedAt || new Date().toISOString();

      if (typeof r.temperature === 'number') {
        temperatureSeries.push({ timestamp: ts, value: r.temperature });
        tempSum += r.temperature;
        if (r.temperature < tempMin) tempMin = r.temperature;
        if (r.temperature > tempMax) tempMax = r.temperature;
        tempCount++;
      }

      if (typeof r.humidity === 'number') {
        humiditySeries.push({ timestamp: ts, value: r.humidity });
        humSum += r.humidity;
        if (r.humidity < humMin) humMin = r.humidity;
        if (r.humidity > humMax) humMax = r.humidity;
        humCount++;
      }

      if (typeof r.distance === 'number') {
        distanceSeries.push({ timestamp: ts, value: r.distance });
        distSum += r.distance;
        if (r.distance < distMin) distMin = r.distance;
        if (r.distance > distMax) distMax = r.distance;
        distCount++;
      }

      if (r.motion === true) motionEvents++;
      if (r.sound === true) soundEvents++;
      if (r.touch === true) touchEvents++;
    }

    const round1 = (num) => Math.round(num * 10) / 10;

    return {
      deviceId,
      range,
      temperature: temperatureSeries,
      humidity: humiditySeries,
      distance: distanceSeries,
      statistics: {
        temperature: {
          min: tempCount > 0 ? round1(tempMin) : null,
          max: tempCount > 0 ? round1(tempMax) : null,
          average: tempCount > 0 ? round1(tempSum / tempCount) : null,
        },
        humidity: {
          min: humCount > 0 ? round1(humMin) : null,
          max: humCount > 0 ? round1(humMax) : null,
          average: humCount > 0 ? round1(humSum / humCount) : null,
        },
        distance: {
          min: distCount > 0 ? round1(distMin) : null,
          max: distCount > 0 ? round1(distMax) : null,
          average: distCount > 0 ? round1(distSum / distCount) : null,
        },
      },
      motionEvents,
      soundEvents,
      touchEvents,
      totalReadings: readings.length,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
