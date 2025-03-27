const request = require('supertest');
const app = require('../app'); // Import the Express app
const knex = require('../db'); // Import the database connection

jest.mock('../db'); // Mock the database module

jest.mock('node-cron', () => ({
    schedule: jest.fn(), // Mock the schedule method to do nothing
}));

describe('GET /api/categories', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Reset mocks after each test
    });

    test('should return a list of categories sorted by name', async () => {
        const mockCategories = [
            { id: 1, name: 'Art' },
            { id: 2, name: 'Books' },
            { id: 3, name: 'Electronics' }
        ];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue(mockCategories)
        }));

        const response = await request(app).get('/api/categories');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCategories);
    });

    test('should return a 500 error if database query fails', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const response = await request(app).get('/api/categories');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Failed to fetch categories' });
    });
});
