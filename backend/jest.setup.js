const knex = require('knex');
const knexConfig = require('../backend/knexfile').test;

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

beforeAll(async () => {
  await db.migrate.latest(); // Run migrations before all tests
  await db.seed.run(); // Optionally run seeds once
});

afterAll(async () => {
  await db.destroy(); // Close connection after each test
});

beforeEach(() => {
  // Reset any global mocks or states if needed
  jest.clearAllMocks();
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
