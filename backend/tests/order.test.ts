import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Order Management Endpoints (Integration)', () => {
  let testStoreId: string;
  let adminToken: string;
  let createdOrderId: string;

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();

    // Create or find admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin-order-test@test.com' },
      update: {},
      create: {
        name: 'Order Test Admin',
        email: 'admin-order-test@test.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'ADMIN',
      },
    });

    // Create a real store for integration test
    const store = await prisma.store.create({
      data: {
        name: 'Order Test Store',
        location: '999 Integration Way',
        admin_id: admin.id,
      },
    });
    testStoreId = store.id;

    // Generate valid admin token
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../src/config/env');
    adminToken = jwt.default.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testStoreId) {
      await prisma.order.deleteMany({ where: { store_id: testStoreId } });
      await prisma.store.deleteMany({ where: { id: testStoreId } });
    }
    await prisma.$disconnect();
    try {
      redis.disconnect();
    } catch (_) {}
  });

  describe('POST /orders', () => {
    it('should create an order with calculated total_amount and 201 status', async () => {
      const payload = {
        store_id: testStoreId,
        payment_method: 'CARD',
        items: [
          { name: 'Gourmet Burger', qty: 2, price: 15.5 },
          { name: 'Crispy Fries', qty: 1, price: 4.75 },
        ],
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.store_id).toBe(testStoreId);
      // 2 * 15.50 + 1 * 4.75 = 31.00 + 4.75 = 35.75
      expect(response.body.data.total_amount).toBe(35.75);
      expect(response.body.data.status).toBe('PLACED');
      expect(response.body.data.payment_status).toBe('COMPLETED');

      createdOrderId = response.body.data.id;
    });

    it('should return 400 Bad Request if payload fails Zod validation', async () => {
      const invalidPayload = {
        store_id: 'not-a-uuid',
        items: [],
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /orders', () => {
    it('should fetch orders filtered by store_id with cursor pagination', async () => {
      // Create additional orders
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/v1/orders')
          .send({
            store_id: testStoreId,
            items: [{ name: `Item ${i}`, qty: 1, price: 10 + i }],
            payment_method: 'CASH',
          });
      }

      // Fetch first page with limit 3
      const firstPage = await request(app)
        .get(`/api/v1/orders?store_id=${testStoreId}&limit=3`)
        .expect(200);

      expect(firstPage.body.success).toBe(true);
      expect(firstPage.body.data.length).toBe(3);
      expect(firstPage.body.pagination.hasMore).toBe(true);
      expect(firstPage.body.pagination.nextCursor).toBeDefined();

      const nextCursor = firstPage.body.pagination.nextCursor;

      // Fetch second page using cursor
      const secondPage = await request(app)
        .get(`/api/v1/orders?store_id=${testStoreId}&limit=3&cursor=${nextCursor}`)
        .expect(200);

      expect(secondPage.body.success).toBe(true);
      expect(secondPage.body.data.length).toBeGreaterThan(0);
      expect(secondPage.body.data.some((o: { id: string }) => o.id === nextCursor)).toBe(false);
    });

    it('should return 400 if store_id is missing', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return a single order by UUID', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${createdOrderId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdOrderId);
      expect(response.body.data.store_id).toBe(testStoreId);
    });

    it('should return 404 for non-existent order UUID', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/orders/${randomUuid}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/orders/not-a-valid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status from PLACED to PREPARED with Admin token', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PREPARED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PREPARED');

      const dbOrder = await prisma.order.findUnique({ where: { id: createdOrderId } });
      expect(dbOrder?.status).toBe('PREPARED');
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${createdOrderId}/status`)
        .send({ status: 'PREPARED' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent order UUID', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/api/v1/orders/${randomUuid}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid status enum', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
