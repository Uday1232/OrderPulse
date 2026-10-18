import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { redis } from '../src/config/redis';

describe('Auth & Store Endpoints', () => {
  let adminToken: string;
  let userToken: string;
  let createdStoreId: string;

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch (_) {}
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    try {
      redis.disconnect();
    } catch (_) {}
  });

  describe('Authentication & RBAC', () => {
    const testAdminEmail = `admin-test-${Date.now()}@test.com`;
    const testUserEmail = `user-test-${Date.now()}@test.com`;

    it('should register a new ADMIN user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Administrator',
          email: testAdminEmail,
          password: 'password123',
          role: 'ADMIN',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
      adminToken = res.body.data.token;
    });

    it('should register a regular USER', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Regular Customer',
          email: testUserEmail,
          password: 'password123',
          role: 'USER',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('USER');
      userToken = res.body.data.token;
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
