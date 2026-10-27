import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Auth & Store Endpoints', () => {
  let adminToken: string;
  let userToken: string;
  let createdStoreId: string;
  let testAdminEmail = `admin-test-${Date.now()}@test.com`;
  let testUserEmail = `user-test-${Date.now()}@test.com`;

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();
  });

  afterAll(async () => {
    try {
      if (createdStoreId) {
        await prisma.orderArchive.deleteMany({ where: { store_id: createdStoreId } });
        await prisma.order.deleteMany({ where: { store_id: createdStoreId } });
        await prisma.item.deleteMany({ where: { category: { store_id: createdStoreId } } });
        await prisma.category.deleteMany({ where: { store_id: createdStoreId } });
        await prisma.store.deleteMany({ where: { id: createdStoreId } });
      }
      await prisma.store.deleteMany({
        where: { name: { contains: 'Seaside Pavilion' } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [testAdminEmail, testUserEmail] } },
      });
    } catch (_) {}
    await prisma.$disconnect();
    try {
      redis.disconnect();
    } catch (_) {}
  });

  describe('Authentication & RBAC', () => {

    it('should register a regular USER even if requesting ADMIN (public registration strictly enforces USER)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Regular Customer',
          email: testUserEmail,
          password: 'password123',
          role: 'ADMIN', // Requests ADMIN role, but system enforces USER
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('USER');
      userToken = res.body.data.token;
    });

    it('should allow SuperAdmin to login and create a Store Admin', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('admin123', 10);
      await prisma.user.upsert({
        where: { email: 'admin@storepulse.com' },
        update: {},
        create: {
          name: 'StorePulse SuperAdmin',
          email: 'admin@storepulse.com',
          password_hash: hash,
          role: 'SUPERADMIN',
        },
      });

      const superLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@storepulse.com',
          password: 'admin123',
        })
        .expect(200);

      const superToken = superLogin.body.data.token;

      // SuperAdmin creates a Store Admin via POST /admins
      const adminRes = await request(app)
        .post('/api/v1/auth/admins')
        .set('Authorization', `Bearer ${superToken}`)
        .send({
          name: 'Test Administrator',
          email: testAdminEmail,
          password: 'password123',
        })
        .expect(201);

      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.user.role).toBe('ADMIN');

      // Newly created Store Admin can login
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testAdminEmail,
          password: 'password123',
        })
        .expect(200);

      expect(adminLogin.body.success).toBe(true);
      expect(adminLogin.body.data.user.role).toBe('ADMIN');
      adminToken = adminLogin.body.data.token;
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate Admin',
          email: testAdminEmail,
          password: 'password123',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testAdminEmail,
          password: 'password123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testAdminEmail);
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testAdminEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should get current profile with valid JWT token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testAdminEmail);
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('should reject unauthenticated profile request', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 200 for forgot-password request on non-existent email (anti-enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost-user-nonexistent@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account exists');
    });

    it('should dispatch password reset and allow user to reset password successfully', async () => {
      // 1. Request forgot-password for the registered user
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(200);

      expect(forgotRes.body.success).toBe(true);
      expect(forgotRes.body.devResetUrl).toBeDefined();

      const resetUrl = forgotRes.body.devResetUrl as string;
      const urlObj = new URL(resetUrl);
      const token = urlObj.searchParams.get('token');
      expect(token).toBeDefined();

      // 2. Reject reset with invalid/tampered token
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid_tampered_token_that_does_not_exist_in_redis_123',
          new_password: 'newSecretPassword123',
        })
        .expect(400);

      // 3. Complete reset with valid token
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token,
          new_password: 'newSecretPassword123',
        })
        .expect(200);

      expect(resetRes.body.success).toBe(true);
      expect(resetRes.body.message).toContain('successfully reset');

      // 4. Token must be burned (one-time use): second attempt must fail
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token,
          new_password: 'anotherPassword123',
        })
        .expect(400);

      // 5. Old password no longer works
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'password123',
        })
        .expect(401);

      // 6. New password works successfully
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'newSecretPassword123',
        })
        .expect(200);

      expect(newLoginRes.body.success).toBe(true);
      expect(newLoginRes.body.data.token).toBeDefined();
    });
  });

  describe('Stores & Dynamic Menus', () => {
    it('should return all stores publicly', async () => {
      const res = await request(app)
        .get('/api/v1/stores')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow ADMIN to create a new store', async () => {
      const res = await request(app)
        .post('/api/v1/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Seaside Pavilion',
          location: 'Beachfront Road, Bay Area',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Seaside Pavilion');
      createdStoreId = res.body.data.id;
    });

    it('should forbid regular USER from creating a store', async () => {
      const res = await request(app)
        .post('/api/v1/stores')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Cafe',
          location: 'Nowhere St',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow ADMIN to update an existing store', async () => {
      const res = await request(app)
        .patch(`/api/v1/stores/${createdStoreId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Seaside Pavilion Grand Resort',
          location: 'Beachfront Road, Bay Area North',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Seaside Pavilion Grand Resort');
      expect(res.body.data.location).toBe('Beachfront Road, Bay Area North');
    });

    it('should forbid regular USER from updating a store', async () => {
      const res = await request(app)
        .patch(`/api/v1/stores/${createdStoreId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacked Store',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return categorized menu for a store', async () => {
      const res = await request(app)
        .get(`/api/v1/stores/${createdStoreId}/menu`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.categories).toBeDefined();
      expect(Array.isArray(res.body.data.categories)).toBe(true);
    });
  });
});
