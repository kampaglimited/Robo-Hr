const { Pool } = require('pg');

// Test database setup
const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgres://robohr:secret@localhost:5432/robohr_test'
});

beforeAll(async () => {
  // Setup test database
  await testPool.query('BEGIN');
});

afterAll(async () => {
  // Cleanup
  await testPool.query('ROLLBACK');
  await testPool.end();
});

module.exports = testPool;
