// Runs once before the whole test suite: make sure the test database exists
// and matches the Prisma schema. Without this, /api/health's live `SELECT 1`
// fails (503) on a machine that has never created the test DB.
//
// Uses the same DATABASE_URL resolution as jest.setup.js, so both agree:
// honor an explicit DATABASE_URL, otherwise fall back to the local test DB.
const { execSync } = require('child_process');

module.exports = async () => {
  const url =
    process.env.DATABASE_URL ||
    'postgresql://rommelaguillon@localhost:5432/autobenta_test';

  try {
    // db push creates the database if missing and syncs all tables.
    execSync('npx prisma db push --skip-generate', {
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: url },
    });
  } catch (err) {
    console.warn(
      '\n[jest globalSetup] Could not provision the test database — ' +
        'DB-backed tests (e.g. /api/health) may fail with 503.\n' +
        'Ensure PostgreSQL is running and reachable at:\n  ' +
        url +
        '\n' +
        (err.message || ''),
    );
  }
};
