const knex = require('knex');
const knexConfig = require('../knexfile').development;

const db = knex({
  ...knexConfig,
  connection: { filename: ':memory:' }, // Use in-memory DB for testing
});

// Mock global fetch to avoid network tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

beforeEach(async () => {
  await db.migrate.latest(); // Run migrations before each test
  await db.seed.run(); // Optionally run seeds
});

afterEach(async () => {
  await db.destroy(); // Close connection after each test
});

// Suppress unwanted console logs
const suppressLogs = (method) => {
  const original = console[method];
  beforeAll(() => (console[method] = jest.fn()));
  afterAll(() => (console[method] = original));
};

suppressLogs('log'); // Suppress console.log
suppressLogs('warn'); // Suppress console.warn
suppressLogs('error'); // Suppress console.error

module.exports = db;
