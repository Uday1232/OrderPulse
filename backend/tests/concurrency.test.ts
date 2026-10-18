import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Order Concurrency & Row-Level Locking (SELECT ... FOR UPDATE)', () => {
  const storeId = 'store-concurrency-test';
  let targetOrderId: string;

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();

    // Create a target order
    const order = await prisma.order.create({
      data: {
        store_id: storeId,
        items: [{ name: 'Espresso', quantity: 1, unit_price: 3.5, subtotal: 3.5 }],
        total_amount: 3.5,
        status: 'PLACED',
      },
    });
    targetOrderId = order.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { store_id: storeId } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('should handle simultaneous concurrent status updates without race conditions or deadlocks', async () => {
    // Dispatch 5 concurrent requests updating the same order simultaneously
    const updates = ['PREPARING', 'COMPLETED', 'PREPARING', 'COMPLETED', 'PREPARING'];

    const requests = updates.map((status) =>
      request(app)
        .patch(`/orders/${targetOrderId}/status`)
        .send({ status })
    );

    const responses = await Promise.all(requests);

    // Every single request should have resolved with HTTP 200 OK
    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // Verify final state in database is a valid status
    const finalOrder = await prisma.order.findUnique({
      where: { id: targetOrderId },
    });

    expect(finalOrder).toBeDefined();
    expect(['PLACED', 'PREPARING', 'COMPLETED']).toContain(finalOrder?.status);
  });
});
