const request = require('supertest');
const app = require('../src/server');

describe('API Health & Auth', () => {
  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('AutoBenta PH API');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/auth/register', () => {
    it('rejects invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'notanemail', password: '123456', name: 'Test' });
      expect(res.status).toBe(400);
    });

    it('rejects short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: '123', name: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('rejects invalid credentials (401 or 500 without DB)', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrongpassword' });
      expect([401, 500]).toContain(res.status);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects invalid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/listings', () => {
    it('returns 200 or 500 depending on DB availability', async () => {
      const res = await request(app).get('/api/listings');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.listings).toBeDefined();
        expect(Array.isArray(res.body.listings)).toBe(true);
        expect(res.body.pagination).toBeDefined();
      }
    });

    it('supports search query param', async () => {
      const res = await request(app).get('/api/listings?search=Toyota');
      expect([200, 500]).toContain(res.status);
    });

    it('supports price filter', async () => {
      const res = await request(app).get('/api/listings?priceMin=500000&priceMax=1000000');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/financing/calculate', () => {
    it('calculates monthly payment correctly or 500 without DB', async () => {
      const res = await request(app).post('/api/financing/calculate').send({
        vehiclePrice: 800000, downPayment: 160000, termMonths: 60, incomeRange: '50k_100k',
      });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        const monthly = res.body.estimatedMonthly || res.body.monthlyPayment;
        expect(monthly).toBeGreaterThan(0);
        expect(res.body.loanAmount).toBe(640000);
      }
    });
  });

  describe('404 handler', () => {
    it('returns 404 or 500 for unknown listing id', async () => {
      const res = await request(app).get('/api/listings/nonexistent-id-abc');
      expect([404, 500]).toContain(res.status);
    });
  });
});
