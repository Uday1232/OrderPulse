import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Archival & Analytics Endpoints', () => {
  let storeId: string;

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();

    // Create admin & store
    const admin = await prisma.user.upsert({
      where: { email: 'analytics-test@test.com' },
      update: {},
      create: {
        name: 'Analytics Admin',
        email: 'analytics-test@test.com',
        password_hash: 'hashedpassword',
        role: 'ADMIN',
      },
    });

    const store = await prisma.store.create({
      data: {
        name: 'Analytics Test Store',
        location: 'Analytics Blvd',
        admin_id: admin.id,
      },
    });
    storeId = store.id;

    // Create 2 recent orders
    await prisma.order.createMany({
      data: [
        {
          store_id: storeId,
          items: [{ name: 'Test Pizza', qty: 3, price: 10, subtotal: 30 }],
          total_amount: 30,
          status: 'PREPARED',
          payment_method: 'CARD',
          payment_status: 'COMPLETED',
          created_at: new Date(),
        },
        {
          store_id: storeId,
          items: [{ name: 'Test Burger', qty: 2, price: 15, subtotal: 30 }],
          total_amount: 30,
          status: 'PREPARED',
          payment_method: 'CASH',
          payment_status: 'COMPLETED',
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
          items: [{ name: 'Old Salad', qty: 1, price: 8, subtotal: 8 }],
          total_amount: 8,
          status: 'PREPARED',
          payment_method: 'CARD',
          payment_status: 'COMPLETED',
          created_at: fortyDaysAgo,
        },
        {
          store_id: storeId,
          items: [{ name: 'Old Coffee', qty: 2, price: 3, subtotal: 6 }],
          total_amount: 6,
          status: 'PREPARED',
          payment_method: 'CARD',
          payment_status: 'COMPLETED',
          created_at: fortyDaysAgo,
        },
      ],
    });
  });

  afterAll(async () => {
    if (storeId) {
      await prisma.order.deleteMany({ where: { store_id: storeId } });
      await prisma.orderArchive.deleteMany({ where: { store_id: storeId } });
      await prisma.store.deleteMany({ where: { id: storeId } });
    }
    await prisma.$disconnect();
    try {
      redis.disconnect();
    } catch (_) {}
  });

  describe('GET /analytics', () => {
    it('should return aggregated metrics: orders per day, revenue per store, top selling items', async () => {
      const response = await request(app)
        .get('/api/v1/analytics?refresh=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const { summary, ordersPerDay, revenuePerStore, topSellingItems } = response.body.data;

      expect(summary.totalOrders).toBeGreaterThanOrEqual(4);
      expect(summary.totalRevenue).toBeGreaterThan(0);
      expect(Array.isArray(ordersPerDay)).toBe(true);
      expect(Array.isArray(revenuePerStore)).toBe(true);
      expect(Array.isArray(topSellingItems)).toBe(true);
    });

    it('should serve subsequent requests from Redis cache', async () => {
      const response = await request(app)
        .get('/api/v1/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fromCache).toBe(true);
    });
  });

  describe('POST /archive-old-orders', () => {
    it('should atomically move orders older than 30 days to orders_archive table', async () => {
      const countBefore = await prisma.order.count({
        where: { store_id: storeId },
      });
      expect(countBefore).toBe(4);

      const response = await request(app)
        .post('/api/v1/archive-old-orders')
        .send({ days_threshold: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.archivedCount).toBeGreaterThanOrEqual(2);

      // Verify active orders decreased
      const countAfter = await prisma.order.count({
        where: { store_id: storeId },
      });
      expect(countAfter).toBe(2);

      // Verify records are present in orders_archive
      const archivedRecords = await prisma.orderArchive.findMany({
        where: { store_id: storeId },
      });
      expect(archivedRecords.length).toBeGreaterThanOrEqual(2);
    });
  });
});
