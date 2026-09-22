import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller.js';

const router = Router();

// GET /api/analytics/:deviceId - Aggregate time-series analytics and metrics (range=1h|6h|24h|7d)
router.get('/:deviceId', getAnalytics);

export default router;
