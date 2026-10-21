import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  /**
   * GET /analytics
   * Aggregation queries for orders per day, revenue per store, top selling items (cached in Redis)
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const storeId = typeof req.query.store_id === 'string' && req.query.store_id !== 'all'
        ? req.query.store_id
        : undefined;
      const analytics = await AnalyticsService.getAnalytics(forceRefresh, storeId);
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}
