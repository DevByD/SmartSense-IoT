import { Router } from 'express';
import { getLatestSensorReading, getSensorHistory } from '../controllers/sensors.controller.js';

const router = Router();

// GET /api/sensors/latest - Get latest telemetry for default or query device
router.get('/latest', getLatestSensorReading);

// GET /api/sensors/latest/:deviceId - Get latest telemetry for specific device
router.get('/latest/:deviceId', getLatestSensorReading);

// GET /api/sensors/history/:deviceId - Get historical readings with limit, start, end filters
router.get('/history/:deviceId', getSensorHistory);

export default router;
