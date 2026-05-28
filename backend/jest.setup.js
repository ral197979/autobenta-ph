// Set required env vars before any modules are loaded
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://rommelaguillon@localhost:5432/autobenta_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-jest-runs-only';
process.env.NODE_ENV = 'test';
process.env.AI_MODE = 'mock';
process.env.STORAGE_PROVIDER = 'local';
