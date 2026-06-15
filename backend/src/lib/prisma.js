// Shared PrismaClient singleton — one connection pool for the whole process.
//
// Previously every route/service/middleware did its own `new PrismaClient()`.
// With ~67 modules that meant ~67 independent connection pools, which under
// full test-suite load could exceed Postgres `max_connections` and make
// /api/health's `SELECT 1` fail intermittently. A single shared client keeps
// the process to one pool.
//
// The globalThis guard ensures we reuse the same instance even if this module
// is resolved via different relative paths or re-required (e.g. test watch mode).
const { PrismaClient } = require('@prisma/client');

const prisma = globalThis.__ryderrPrisma || new PrismaClient();
if (!globalThis.__ryderrPrisma) globalThis.__ryderrPrisma = prisma;

module.exports = prisma;
