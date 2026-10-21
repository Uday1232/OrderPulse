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
  store_name?: string;
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
  private static readonly CACHE_TTL_SECONDS = 30; // 30 seconds max fallback

  /**
   * Fetch comprehensive aggregated analytics with 100% fresh real-time database queries
   * Supports optional storeId filtering or combined all-store metrics
   */
  static async getAnalytics(forceRefresh = false, storeId?: string): Promise<AnalyticsResponse> {
    const isStoreFiltered = Boolean(storeId && storeId !== 'all');
    const cacheKey = isStoreFiltered ? `analytics:summary:${storeId}` : 'analytics:summary:all';

    // 1. Check Redis cache only if not forced refresh
    if (!forceRefresh) {
      const cached = await RedisService.get<AnalyticsResponse>(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT for analytics (${cacheKey})`);
        return {
          ...cached,
          fromCache: true,
        };
      }
    }

    logger.debug(`Computing fresh aggregations from database (store: ${storeId || 'all'})...`);

    // 2. Database Aggregations
    const ordersPerDayPromise = isStoreFiltered
      ? prisma.$queryRaw<DailyOrderStat[]>`
          SELECT
            TO_CHAR("created_at", 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS order_count,
            COALESCE(ROUND(SUM("total_amount")::numeric, 2), 0)::float AS daily_revenue
          FROM "orders"
          WHERE "store_id" = ${storeId}::uuid
          GROUP BY TO_CHAR("created_at", 'YYYY-MM-DD')
          ORDER BY date ASC
          LIMIT 30;
        `
      : prisma.$queryRaw<DailyOrderStat[]>`
          SELECT
            TO_CHAR("created_at", 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS order_count,
            COALESCE(ROUND(SUM("total_amount")::numeric, 2), 0)::float AS daily_revenue
          FROM "orders"
          GROUP BY TO_CHAR("created_at", 'YYYY-MM-DD')
          ORDER BY date ASC
          LIMIT 30;
        `;

    const revenuePerStorePromise = isStoreFiltered
      ? prisma.$queryRaw<StoreRevenueStat[]>`
          SELECT
            o."store_id" AS store_id,
            COALESCE(s."name", 'Unnamed Store') AS store_name,
            COUNT(o.*)::int AS total_orders,
            COALESCE(ROUND(SUM(o."total_amount")::numeric, 2), 0)::float AS total_revenue,
            COALESCE(ROUND(AVG(o."total_amount")::numeric, 2), 0)::float AS avg_order_value
          FROM "orders" o
          LEFT JOIN "stores" s ON s."id" = o."store_id"
          WHERE o."store_id" = ${storeId}::uuid
          GROUP BY o."store_id", s."name"
          ORDER BY total_revenue DESC;
        `
      : prisma.$queryRaw<StoreRevenueStat[]>`
          SELECT
            o."store_id" AS store_id,
            COALESCE(s."name", 'Unnamed Store') AS store_name,
            COUNT(o.*)::int AS total_orders,
            COALESCE(ROUND(SUM(o."total_amount")::numeric, 2), 0)::float AS total_revenue,
            COALESCE(ROUND(AVG(o."total_amount")::numeric, 2), 0)::float AS avg_order_value
          FROM "orders" o
          LEFT JOIN "stores" s ON s."id" = o."store_id"
          GROUP BY o."store_id", s."name"
          ORDER BY total_revenue DESC;
        `;

    const topSellingItemsPromise = isStoreFiltered
      ? prisma.$queryRaw<TopSellingItemStat[]>`
          SELECT
            COALESCE(item->>'name', 'Unknown') AS item_name,
            SUM(COALESCE((item->>'qty')::int, (item->>'quantity')::int, 1))::int AS total_quantity_sold,
            COALESCE(ROUND(SUM(COALESCE((item->>'qty')::int, (item->>'quantity')::int, 1) * COALESCE((item->>'price')::numeric, (item->>'unit_price')::numeric, 0)), 2), 0)::float AS total_revenue
          FROM "orders",
          jsonb_array_elements("items") AS item
          WHERE "store_id" = ${storeId}::uuid
          GROUP BY COALESCE(item->>'name', 'Unknown')
          ORDER BY total_quantity_sold DESC
          LIMIT 5;
        `
      : prisma.$queryRaw<TopSellingItemStat[]>`
          SELECT
            COALESCE(item->>'name', 'Unknown') AS item_name,
            SUM(COALESCE((item->>'qty')::int, (item->>'quantity')::int, 1))::int AS total_quantity_sold,
            COALESCE(ROUND(SUM(COALESCE((item->>'qty')::int, (item->>'quantity')::int, 1) * COALESCE((item->>'price')::numeric, (item->>'unit_price')::numeric, 0)), 2), 0)::float AS total_revenue
          FROM "orders",
          jsonb_array_elements("items") AS item
          GROUP BY COALESCE(item->>'name', 'Unknown')
          ORDER BY total_quantity_sold DESC
          LIMIT 5;
        `;

    const summaryStatsPromise = isStoreFiltered
      ? prisma.$queryRaw<Array<{ total_orders: number; total_revenue: number; total_stores: number }>>`
          SELECT
            COUNT(*)::int AS total_orders,
            COALESCE(ROUND(SUM("total_amount")::numeric, 2), 0)::float AS total_revenue,
            1::int AS total_stores
          FROM "orders"
          WHERE "store_id" = ${storeId}::uuid;
        `
      : prisma.$queryRaw<Array<{ total_orders: number; total_revenue: number; total_stores: number }>>`
          SELECT
            COUNT(*)::int AS total_orders,
            COALESCE(ROUND(SUM("total_amount")::numeric, 2), 0)::float AS total_revenue,
            COUNT(DISTINCT "store_id")::int AS total_stores
          FROM "orders";
        `;

    const [ordersPerDay, revenuePerStore, topSellingItems, summaryStats] = await Promise.all([
      ordersPerDayPromise,
      revenuePerStorePromise,
      topSellingItemsPromise,
      summaryStatsPromise,
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

    // Update Redis cache asynchronously for warm standby
    RedisService.set(cacheKey, response, this.CACHE_TTL_SECONDS).catch(() => {});

    return response;
  }
}
