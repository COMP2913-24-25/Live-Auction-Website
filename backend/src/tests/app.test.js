const { describe, it, expect, beforeAll, afterAll, afterEach } = require('@jest/globals');
const request = require('supertest');
const app = require('../app');

describe('API Tests', () => {
  // 基础路由测试
  // Basic route test
  it('GET / - should return server running message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Server is running');
  });

  // 创建拍卖项目测试
  // Create auction item test
  it('POST /api/auctions - should create new auction item', async () => {
    const auctionData = {
      title: 'Test Item',
      description: 'Test Description',
      starting_price: 100,
      min_increment: 10,
      start_time: new Date(Date.now() + 24*60*60*1000).toISOString(),
      end_time: new Date(Date.now() + 48*60*60*1000).toISOString()
    };

    const response = await request(app)
      .post('/api/auctions')
      .send(auctionData);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Auction item created successfully');
  });

  // 获取拍卖列表测试
  // Get auctions list test
  it('GET /api/auctions - should return auction items', async () => {
    const response = await request(app).get('/api/auctions');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});