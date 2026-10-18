import { prisma } from '../config/db';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';

export interface ArchiveResult {
  archivedCount: number;
  daysThreshold: number;
  timestamp: string;
}

export class ArchiveService {
  /**
   * Atomically move orders older than `daysThreshold` from orders to orders_archive
   */
  static async archiveOldOrders(daysThreshold = 30): Promise<ArchiveResult> {
    logger.info(`Starting archival of orders older than ${daysThreshold} days`);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Move records atomically using PostgreSQL Common Table Expression (CTE)
      const query = `
        WITH moved_orders AS (
          DELETE FROM "orders"
          WHERE "created_at" < NOW() - (${daysThreshold} || ' days')::INTERVAL
          RETURNING id, store_id, items, total_amount, status, created_at, NOW() AS archived_at
        )
        INSERT INTO "orders_archive" (id, store_id, items, total_amount, status, created_at, archived_at)
        SELECT id, store_id, items, total_amount, status, created_at, archived_at FROM moved_orders;
      `;

      const affectedCount = await tx.$executeRawUnsafe(query);

      return affectedCount;
    });

    logger.info(`Archived ${result} orders successfully (older than ${daysThreshold} days)`);

    // Invalidate Redis caches
    await Promise.all([
      RedisService.invalidatePattern('orders:*'),
      RedisService.invalidatePattern('analytics:*'),
    ]);

    return {
      archivedCount: result,
      daysThreshold,
      timestamp: new Date().toISOString(),
    };
  }
}
