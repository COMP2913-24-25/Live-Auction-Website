const request = require('supertest');
const app = require('../app'); // Import the Express app
const knex = require('../db'); // Import the database connection

jest.mock('../db'); // Mock the database module

jest.mock('node-cron', () => ({
    schedule: jest.fn(), // Mock the schedule method to do nothing
}));

describe('GET /api/auctions/active', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Reset mocks after each test
    });

    test('should return a list of active auctions', async () => {
        const mockAuctions = [
            { id: 1, title: 'Auction 1', min_price: 100, auction_status: 'Active' },
            { id: 2, title: 'Auction 2', min_price: 200, auction_status: 'Active' }
        ];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue(mockAuctions)
        }));

        const response = await request(app).get('/api/auctions/active');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockAuctions);
    });

    test('should return a 500 error if database query fails', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const response = await request(app).get('/api/auctions/active');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Failed to fetch active auctions' });
    });
});
