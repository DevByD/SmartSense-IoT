import { Router } from 'express';
import { getAllDevices, getDeviceById, updateDeviceSecurity } from '../controllers/devices.controller.js';

const router = Router();

// GET /api/devices - List all registered IoT devices
router.get('/', getAllDevices);

// GET /api/devices/:deviceId - Get single device by ID
router.get('/:deviceId', getDeviceById);

// PATCH /api/devices/:deviceId/security - Update device security mode (ARMED / DISARMED)
router.patch('/:deviceId/security', updateDeviceSecurity);

export default router;
