import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Archival & Analytics Endpoints', () => {
  const storeId = 'store-analytics-archive-test';

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();

    // Create 2 recent orders
    await prisma.order.createMany({
      data: [
        {
          store_id: storeId,
          items: [{ name: 'Test Pizza', quantity: 3, unit_price: 10, subtotal: 30 }],
          total_amount: 30,
          status: 'COMPLETED',
          created_at: new Date(),
        },
        {
          store_id: storeId,
          items: [{ name: 'Test Burger', quantity: 2, unit_price: 15, subtotal: 30 }],
          total_amount: 30,
          status: 'COMPLETED',
          created_at: new Date(),
        },
      ],
    });

    // Create 2 orders older than 40 days for archival testing
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    await prisma.order.createMany({
      data: [
        {
          store_id: storeId,
          items: [{ name: 'Old Salad', quantity: 1, unit_price: 8, subtotal: 8 }],
          total_amount: 8,
          status: 'COMPLETED',
          created_at: fortyDaysAgo,
        },
        {
          store_id: storeId,
          items: [{ name: 'Old Coffee', quantity: 2, unit_price: 3, subtotal: 6 }],
          total_amount: 6,
          status: 'COMPLETED',
          created_at: fortyDaysAgo,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { store_id: storeId } });
    await prisma.orderArchive.deleteMany({ where: { store_id: storeId } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  describe('GET /analytics', () => {
    it('should return aggregated metrics: orders per day, revenue per store, top selling items', async () => {
      const response = await request(app)
        .get('/analytics?refresh=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;

      expect(data.summary).toBeDefined();
      expect(data.summary.totalOrders).toBeGreaterThan(0);
      expect(data.summary.totalRevenue).toBeGreaterThan(0);

      // Orders per day
      expect(Array.isArray(data.ordersPerDay)).toBe(true);
      expect(data.ordersPerDay.length).toBeGreaterThan(0);
      expect(data.ordersPerDay[0].date).toBeDefined();
      expect(data.ordersPerDay[0].order_count).toBeGreaterThan(0);

      // Revenue per store
      expect(Array.isArray(data.revenuePerStore)).toBe(true);
      expect(data.revenuePerStore.length).toBeGreaterThan(0);
      const foundStore = data.revenuePerStore.find((s: { store_id: string }) => s.store_id === storeId);
      expect(foundStore).toBeDefined();

      // Top 5 selling items
      expect(Array.isArray(data.topSellingItems)).toBe(true);
      expect(data.topSellingItems.length).toBeLessThanOrEqual(5);
      expect(data.topSellingItems[0].item_name).toBeDefined();
      expect(data.topSellingItems[0].total_quantity_sold).toBeGreaterThan(0);
    });

    it('should serve subsequent requests from Redis cache', async () => {
      const response = await request(app)
        .get('/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fromCache).toBe(true);
    });
  });

  describe('POST /archive-old-orders', () => {
    it('should atomically move orders older than 30 days to orders_archive table', async () => {
      const response = await request(app)
        .post('/archive-old-orders')
        .send({ days_threshold: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.archivedCount).toBeGreaterThanOrEqual(2);

      // Verify that the archived records exist in orders_archive
      const archivedInDb = await prisma.orderArchive.findMany({
        where: { store_id: storeId },
      });
      expect(archivedInDb.length).toBeGreaterThanOrEqual(2);

      // Verify that the archived records no longer exist in orders
      const remainingInOrders = await prisma.order.findMany({
        where: {
          store_id: storeId,
          created_at: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      });
      expect(remainingInOrders.length).toBe(0);
    });
  });
});
