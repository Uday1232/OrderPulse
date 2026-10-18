import { Request, Response, NextFunction } from 'express';
import { ArchiveService } from '../services/archive.service';
import { ArchiveOrdersInput } from '../validators/order.schema';

export class ArchiveController {
  /**
   * POST /archive-old-orders
   * Move orders older than threshold (default 30 days) to orders_archive in an atomic transaction
   */
  static async archiveOldOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days_threshold = 30 } = (req.body || {}) as ArchiveOrdersInput;
      const result = await ArchiveService.archiveOldOrders(days_threshold);
      res.status(200).json({
        success: true,
        message: `Successfully archived ${result.archivedCount} orders older than ${result.daysThreshold} days`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
