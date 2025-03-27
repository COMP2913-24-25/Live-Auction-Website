const knex = require('knex');
const knexConfig = require('../knexfile').development;

const db = knex({
  ...knexConfig,
  connection: { filename: ':memory:' }, // Use in-memory DB for testing
});

beforeEach(async () => {
  await db.migrate.latest(); // Run migrations before each test
  await db.seed.run(); // Optionally run seeds
});

afterEach(async () => {
  await db.destroy(); // Close connection after each test
});

module.exports = db;
