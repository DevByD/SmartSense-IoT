import { Router } from 'express';
import { getAlerts, getAlertById, acknowledgeAlert } from '../controllers/alerts.controller.js';

const router = Router();

// GET /api/alerts - Retrieve alerts with optional severity, acknowledged, limit filters
router.get('/', getAlerts);

// GET /api/alerts/:alertId - Retrieve single alert by ID
router.get('/:alertId', getAlertById);

// PATCH /api/alerts/:alertId/acknowledge - Acknowledge alert
router.patch('/:alertId/acknowledge', acknowledgeAlert);

export default router;
