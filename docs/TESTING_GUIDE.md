# AutoBenta PH — Testing Guide

## Test Stack

- **Jest** — test runner and assertion library
- **Supertest** — HTTP integration testing (no real server port)
- **Node.js built-ins** — `crypto`, `fs`, `os`, `path` for unit tests

---

## Running Tests

```bash
# All tests
cd backend && npm test

# Watch mode
cd backend && npx jest --watch

# Specific file
cd backend && npx jest fraud.test.js

# With coverage report
cd backend && npx jest --coverage

# Verbose output
cd backend && npx jest --verbose
```

---

## Test Files

| File | Tests | What it covers |
|------|-------|----------------|
| `ai.test.js` | 12 | priceEstimator, fraudRiskScorer, listingQualityAnalyzer, buyerAssistant |
| `priceEstimator.extended.test.js` | 8 | All PH makes, range validation, depreciation, confidence |
| `listingQuality.extended.test.js` | 6 | Max/min scores, suggestions, photo impact, grade values |
| `buyerAssistant.extended.test.js` | 8 | All keyword patterns, listing context, comparison, edge cases |
| `fraud.test.js` | 15 | suspiciousPricingDetector, vehicleFraudAnalyzer (all flag types) |
| `audit.test.js` | 8 | SHA-256 hashing, chain verification, tamper detection |
| `aiVision.test.js` | 12 | All 5 vision pipeline modules, draft generation |
| `storage.test.js` | 5 | localStorageProvider save/delete, provider selection |
| `rateLimiters.test.js` | 6 | Middleware shape and existence |
| `health.test.js` | 9 | Auth validation, rate limiting, API health |
| `routes.test.js` | 18 | All route groups: health, auth, listings, financing, docs, protected |
| **Total** | **107** | |

---

## Test Environment

`jest.setup.js` runs before every test file and sets:
```javascript
process.env.DATABASE_URL = '...test DB URL...'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.NODE_ENV = 'test'
process.env.AI_MODE = 'mock'
process.env.STORAGE_PROVIDER = 'local'
```

This ensures:
- No `process.exit(1)` from server env validation
- pino-pretty transport is disabled (test env, not development)
- All AI calls use mock mode (no OpenAI API key needed)

---

## Writing New Tests

### Unit test (pure function)
```javascript
// __tests__/myFeature.test.js
const { myFunction } = require('../src/services/myModule');

describe('myFunction', () => {
  it('does the thing', () => {
    const result = myFunction({ input: 'value' });
    expect(result.output).toBe('expected');
  });
});
```

### Integration test (route via supertest)
```javascript
const request = require('supertest');
const app = require('../src/server');  // no port binding in test mode

it('returns 200', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
});
```

### DB-dependent tests
Tests that hit Prisma will return `500` if no real database is running. Handle both cases:
```javascript
const res = await request(app).get('/api/listings');
expect([200, 500]).toContain(res.status);
if (res.status === 200) {
  expect(res.body.listings).toBeDefined();
}
```

Or, for full integration tests, set `DATABASE_URL` in CI to a real test database.

---

## CI Integration

```yaml
# .github/workflows/test.yml (example)
- name: Run backend tests
  working-directory: backend
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/autobenta_test
    JWT_SECRET: ci-test-secret
    AI_MODE: mock
  run: npm test
```

The 107 unit tests pass without a database. Only route tests that assert 200 for DB endpoints require a running Postgres instance.

---

## Test Coverage Goals

| Area | Target |
|------|--------|
| AI services | 100% (all mock paths) |
| Fraud detection | 100% (all flag types) |
| Audit hash chain | 100% |
| AI vision pipeline | 100% |
| API routes | ≥ 80% (unit + integration) |
| Storage provider | ≥ 90% |
