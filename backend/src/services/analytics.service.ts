import { prisma } from '../config/db';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';

export interface DailyOrderStat {
  date: string;
  order_count: number;
  daily_revenue: number;
}

export interface StoreRevenueStat {
  store_id: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface TopSellingItemStat {
  item_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  totalStores: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  ordersPerDay: DailyOrderStat[];
  revenuePerStore: StoreRevenueStat[];
  topSellingItems: TopSellingItemStat[];
  cachedAt: string;
  fromCache: boolean;
}

export class AnalyticsService {
  private static readonly CACHE_TTL_SECONDS = 600; // 10 minutes

  /**
   * Fetch comprehensive aggregated analytics with Redis caching
   */
  static async getAnalytics(forceRefresh = false): Promise<AnalyticsResponse> {
    const cacheKey = 'analytics:summary';

    // 1. Check Redis cache if not forced refresh
    if (!forceRefresh) {
      const cached = await RedisService.get<AnalyticsResponse>(cacheKey);
      if (cached) {
        logger.debug('Cache HIT for analytics');
        return {
          ...cached,
          fromCache: true,
        };
      }
    }

    logger.debug('Cache MISS or force refresh for analytics. Computing aggregations from database...');

    // 2. Database Aggregations
    const [ordersPerDay, revenuePerStore, topSellingItems, summaryStats] = await Promise.all([
      // 1. Orders and Revenue per day (Last 30 days)
      prisma.$queryRaw<DailyOrderStat[]>`
        SELECT
          TO_CHAR("created_at", 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS order_count,
          COALESCE(ROUND(SUM("total_amount")::numeric, 2), 0)::float AS daily_revenue
        FROM "orders"
        GROUP BY TO_CHAR("created_at", 'YYYY-MM-DD')
        ORDER BY date DESC
        LIMIT 30;
      `,

      // 2. Total revenue & orders per store
      prisma.$queryRaw<StoreRevenueStat[]>`
        SELECT
          "store_id" AS store_id,
          COUNT(*)::int AS total_orders,
          COALESCE(ROUND(SUM("total_amount")::numeric, 2), 0)::float AS total_revenue,
          COALESCE(ROUND(AVG("total_amount")::numeric, 2), 0)::float AS avg_order_value
        FROM "orders"
        GROUP BY "store_id"
        ORDER BY total_revenue DESC;
      `,

      // 3. Top 5 selling items by quantity sold from JSONB
      prisma.$queryRaw<TopSellingItemStat[]>`
        SELECT
          item.name AS item_name,
          SUM(item.quantity)::int AS total_quantity_sold,
          COALESCE(ROUND(SUM(item.quantity * item.unit_price)::numeric, 2), 0)::float AS total_revenue
        FROM "orders",
        jsonb_to_recordset("items") AS item(name text, quantity int, unit_price numeric)
        GROUP BY item.name
        ORDER BY total_quantity_sold DESC
        LIMIT 5;
      `,

      // 4. Overall high-level summary
      prisma.$queryRaw<Array<{ total_orders: number; total_revenue: number; total_stores: number }>>`
        SELECT
          COUNT(*)::int AS total_orders,
          COALESCE(ROUND(SUM("total_amount")::numeric, 2), 0)::float AS total_revenue,
          COUNT(DISTINCT "store_id")::int AS total_stores
        FROM "orders";
      `,
    ]);

    const summary: AnalyticsSummary = {
      totalOrders: summaryStats[0]?.total_orders || 0,
      totalRevenue: summaryStats[0]?.total_revenue || 0,
      totalStores: summaryStats[0]?.total_stores || 0,
    };

    const response: AnalyticsResponse = {
      summary,
      ordersPerDay,
      revenuePerStore,
      topSellingItems,
      cachedAt: new Date().toISOString(),
      fromCache: false,
    };

    // 3. Cache into Redis with 10-minute TTL
    await RedisService.set(cacheKey, response, this.CACHE_TTL_SECONDS);

    return response;
  }
}
