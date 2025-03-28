const request = require('supertest');
const express = require('express');
const searchRoutes = require('../routes/search'); // Adjust path if needed
const knex = require('../db');

// Mock knex query builder
jest.mock('../db');

const app = express();
app.use(express.json());
app.use('/api/search', searchRoutes);

describe('GET /api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return search results successfully', async () => {
    knex.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      whereRaw: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      orderByRaw: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback) => callback([
        {
          id: 1,
          title: 'Test Item',
          description: 'A test description',
          category_name: 'Electronics',
          image_urls: 'image1.jpg,image2.jpg',
          current_bid: 100.0
        }
      ]))
    });

    const response = await request(app)
      .get('/api/search')
      .timeout({ deadline: 10000, response: 5000 }); 

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 1,
        title: 'Test Item',
        description: 'A test description',
        category_name: 'Electronics',
        image_urls: ['image1.jpg', 'image2.jpg'],
        current_bid: 100.0
      }
    ]);
  }, 15000); // Extended timeout to 15s

  it('should handle search failure', async () => {
    knex.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      then: jest.fn().mockRejectedValue(new Error('Database error'))
    });

    const response = await request(app).get('/api/search');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Search failed');
  });
});
