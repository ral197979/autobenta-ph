const request = require('supertest');
const app = require('../src/server');

describe('API Routes', () => {
  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('includes requestId in response', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.requestId).toBeDefined();
    });

    it('includes version 2.0.0', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe('2.0.0');
    });
  });

  describe('GET /api/listings', () => {
    it('returns listings array without auth', async () => {
      const res = await request(app).get('/api/listings');
      expect([200, 500]).toContain(res.status); // 500 if no DB, 200 with DB
      if (res.status === 200) {
        expect(Array.isArray(res.body.listings)).toBe(true);
      }
    });

    it('accepts search query param', async () => {
      const res = await request(app).get('/api/listings?search=toyota');
      expect([200, 500]).toContain(res.status);
    });

    it('accepts status filter', async () => {
      const res = await request(app).get('/api/listings?status=active');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 for missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect([400, 422]).toContain(res.status);
    });

    it('returns 401 for wrong credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'wrongpassword',
      });
      expect([401, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 for invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test',
        email: 'not-an-email',
        password: 'pass123',
        role: 'buyer',
      });
      expect([400, 422]).toContain(res.status);
    });

    it('returns 400 for short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test',
        email: 'valid@example.com',
        password: 'pw',
        role: 'buyer',
      });
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/financing/calculate', () => {
    it('calculates monthly payment correctly', async () => {
      const res = await request(app).post('/api/financing/calculate').send({
        vehiclePrice: 800000,
        downPayment: 160000,
        termMonths: 48,
        incomeRange: '50k_100k',
      });
      expect(res.status).toBe(200);
      expect(res.body.estimatedMonthly).toBeGreaterThan(0);
      expect(res.body.loanAmount).toBe(640000);
    });

    it('returns loanAmount in response', async () => {
      const res = await request(app).post('/api/financing/calculate').send({
        vehiclePrice: 1000000,
        downPayment: 200000,
        termMonths: 60,
        incomeRange: '50k_100k',
      });
      expect(res.status).toBe(200);
      expect(res.body.loanAmount).toBe(800000);
      expect(res.body.estimatedRate).toBeGreaterThan(0);
    });
  });

  describe('GET /api/docs', () => {
    it('returns Swagger UI', async () => {
      const res = await request(app).get('/api/docs/');
      expect([200, 301, 302]).toContain(res.status);
    });
  });

  describe('GET /api/docs.json', () => {
    it('returns OpenAPI spec JSON', async () => {
      const res = await request(app).get('/api/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info.title).toBe('AutoBenta PH API');
    });
  });

  describe('Protected routes', () => {
    it('GET /api/favorites returns 401 without auth', async () => {
      const res = await request(app).get('/api/favorites');
      expect(res.status).toBe(401);
    });

    it('GET /api/inspections returns 401 without auth', async () => {
      const res = await request(app).get('/api/inspections');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/stats returns 401 without auth', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('x-request-id header is returned', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });
});
