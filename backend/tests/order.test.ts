import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Order Management Endpoints (Integration)', () => {
  const testStoreId = 'store-test-integration';
  let createdOrderId: string;

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();
    // Clean test store orders
    await prisma.order.deleteMany({ where: { store_id: testStoreId } });
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { store_id: testStoreId } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  describe('POST /orders', () => {
    it('should create an order with calculated total_amount and 201 status', async () => {
      const payload = {
        store_id: testStoreId,
        items: [
          { name: 'Gourmet Burger', quantity: 2, unit_price: 15.5 },
          { name: 'Crispy Fries', quantity: 1, unit_price: 4.75 },
        ],
      };

      const response = await request(app)
        .post('/orders')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.store_id).toBe(testStoreId);
      // 2 * 15.50 + 1 * 4.75 = 31.00 + 4.75 = 35.75
      expect(response.body.data.total_amount).toBe(35.75);
      expect(response.body.data.status).toBe('PLACED');

      createdOrderId = response.body.data.id;
    });

    it('should return 400 Bad Request if payload fails Zod validation', async () => {
      const invalidPayload = {
        store_id: '',
        items: [],
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('GET /orders', () => {
    beforeAll(async () => {
      // Seed 5 orders for pagination testing
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/orders')
          .send({
            store_id: testStoreId,
            items: [{ name: `Item ${i}`, quantity: 1, unit_price: 10 + i }],
          });
      }
    });

    it('should fetch orders filtered by store_id with cursor pagination', async () => {
      const response = await request(app)
        .get(`/orders?store_id=${testStoreId}&limit=3`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination.hasMore).toBe(true);
      expect(response.body.pagination.nextCursor).toBeDefined();

      const nextCursor = response.body.pagination.nextCursor;

      // Fetch next page using cursor
      const secondPage = await request(app)
        .get(`/orders?store_id=${testStoreId}&limit=3&cursor=${nextCursor}`)
        .expect(200);

      expect(secondPage.body.success).toBe(true);
      expect(secondPage.body.data.length).toBeGreaterThan(0);
      // Ensure cursor item is not duplicated in second page
      expect(secondPage.body.data.some((o: { id: string }) => o.id === nextCursor)).toBe(false);
    });

    it('should return 400 if store_id is missing', async () => {
      const response = await request(app)
        .get('/orders')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return a single order by UUID', async () => {
      const response = await request(app)
        .get(`/orders/${createdOrderId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdOrderId);
      expect(response.body.data.store_id).toBe(testStoreId);
    });

    it('should return 404 for non-existent order UUID', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/orders/${randomUuid}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/orders/not-a-valid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status from PLACED to PREPARING', async () => {
      const response = await request(app)
        .patch(`/orders/${createdOrderId}/status`)
        .send({ status: 'PREPARING' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PREPARING');

      // Verify in database
      const dbOrder = await prisma.order.findUnique({ where: { id: createdOrderId } });
      expect(dbOrder?.status).toBe('PREPARING');
    });

    it('should return 404 for non-existent order UUID', async () => {
      const randomUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/orders/${randomUuid}/status`)
        .send({ status: 'COMPLETED' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid status enum', async () => {
      const response = await request(app)
        .patch(`/orders/${createdOrderId}/status`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
