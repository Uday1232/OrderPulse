import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

// GET /analytics - Aggregated analytics with Redis caching
router.get('/', AnalyticsController.getAnalytics);

export default router;
