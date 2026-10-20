import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Order Concurrency & Row-Level Locking (SELECT ... FOR UPDATE)', () => {
  let storeId: string;
  let targetOrderId: string;
  let adminToken: string;

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();

    // Create or find admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'concurrency-admin-test@test.com' },
      update: {},
      create: {
        name: 'Concurrency Admin',
        email: 'concurrency-admin-test@test.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'ADMIN',
      },
    });

    const jwt = await import('jsonwebtoken');
    const { env } = await import('../src/config/env');
    adminToken = jwt.default.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a real store
    const store = await prisma.store.create({
      data: {
        name: 'Concurrency Test Store',
        location: 'Row Lock Avenue',
        admin_id: adminUser.id,
      },
    });
    storeId = store.id;

    // Create a target order
    const order = await prisma.order.create({
      data: {
        store_id: storeId,
        items: [{ name: 'Espresso', qty: 1, price: 3.5, subtotal: 3.5 }],
        total_amount: 3.5,
        status: 'PLACED',
        payment_method: 'CASH',
        payment_status: 'PENDING',
      },
    });
    targetOrderId = order.id;
  });

  afterAll(async () => {
    if (storeId) {
      await prisma.order.deleteMany({ where: { store_id: storeId } });
      await prisma.store.deleteMany({ where: { id: storeId } });
    }
    await prisma.$disconnect();
    try {
      redis.disconnect();
    } catch (_) {}
  });

  it('should handle simultaneous concurrent status updates without race conditions or deadlocks', async () => {
    // Dispatch 5 concurrent requests updating the same order simultaneously
    const updates = ['PREPARED', 'PLACED', 'PREPARED', 'CANCELLED', 'PREPARED'];

    const requests = updates.map((status) =>
      request(app)
        .patch(`/api/v1/orders/${targetOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
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
    expect(['PLACED', 'PREPARED', 'CANCELLED']).toContain(finalOrder?.status);
  });
});
