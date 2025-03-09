const request = require('supertest');
const app = require('../app');
const knex = require('../database/knex');
const { setupTestDatabase } = require('./testHelper');

// 不再模拟auth中间件，因为我们的真实中间件现在可以处理测试用户

describe('Auction End and Winner Flow', () => {
  let testAuctionId;
  let user1;
  let user2;
  
  beforeAll(async () => {
    // 为测试环境设置干净的数据库
    await setupTestDatabase();
    
    // 清理测试数据
    await knex('bids').where('item_id', '>', 1000).del();
    await knex('items').where('id', '>', 1000).del();
    
    // 创建测试用户
    user1 = {
      id: 10001,
      username: 'testbidder1',
      email: 'bidder1@test.com',
      role: 1
    };
    
    user2 = {
      id: 10002,
      username: 'testbidder2',
      email: 'bidder2@test.com',
      role: 1
    };

    // 创建测试拍卖项目（已结束）
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 昨天

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() - 2); // 前天
    
    const auctionData = {
      id: 10001, // 使用大于1000的ID避免与实际数据冲突
      title: 'Test Auction Item',
      description: 'This is a test auction item for end-of-auction testing',
      starting_price: 100,
      min_price: 50,
      current_bid: 150, // 已有出价
      seller_id: 9999, // 卖家ID
      seller_name: 'Test Seller',
      category_id: 1,
      posting_date: futureDate.toISOString(),
      end_time: pastDate.toISOString(), // 拍卖已结束
      authenticated: true,
      images: JSON.stringify(['https://example.com/test-image.jpg'])
    };
    
    // 插入测试拍卖
    await knex('items').insert(auctionData);
    testAuctionId = 10001;
    
    // 插入出价记录
    await knex('bids').insert([
      {
        user_id: user1.id,
        item_id: testAuctionId,
        bid_amount: 120,
        bid_time: new Date(pastDate.getTime() - 3600000).toISOString() // 1小时前
      },
      {
        user_id: user2.id,
        item_id: testAuctionId,
        bid_amount: 150,
        bid_time: new Date(pastDate.getTime() - 1800000).toISOString() // 30分钟前
      }
    ]);
  });
  
  afterAll(async () => {
    // 清理测试数据
    try {
      if (await knex.schema.hasTable('bids')) {
        await knex('bids').where('item_id', testAuctionId).del();
      }
      if (await knex.schema.hasTable('items')) {
        await knex('items').where('id', testAuctionId).del();
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
    await knex.destroy();
  });
  
  test('API should return highest bidder information', async () => {
    const response = await request(app)
      .get(`/api/auctions/${testAuctionId}`)
      .expect(200);
      
    expect(response.body).toHaveProperty('id', testAuctionId);
    expect(response.body).toHaveProperty('highest_bidder_id', user2.id);
    expect(response.body).toHaveProperty('current_bid', 150);
  });
  
  test('Auction is correctly identified as ended', async () => {
    const response = await request(app)
      .get(`/api/auctions/${testAuctionId}`)
      .expect(200);
      
    const now = new Date().getTime();
    const endTime = new Date(response.body.end_time).getTime();
    expect(endTime < now).toBe(true);
  });
  
  test('Non-winning user should not receive winner status', async () => {
    const response = await request(app)
      .get(`/api/auctions/${testAuctionId}`)
      .set('x-test-user', JSON.stringify(user1))
      .expect(200);
      
    // 确认当前用户不是最高出价者
    expect(response.body.highest_bidder_id).not.toBe(user1.id);
  });
  
  test('Winning user should receive winner status', async () => {
    const response = await request(app)
      .get(`/api/auctions/${testAuctionId}`)
      .set('x-test-user', JSON.stringify(user2))
      .expect(200);
      
    // 确认当前用户是最高出价者
    expect(response.body.highest_bidder_id).toBe(user2.id);
  });
  
  test('API returns correct auction data format for frontend modal', async () => {
    const response = await request(app)
      .get(`/api/auctions/${testAuctionId}`)
      .expect(200);
    
    // 检查必要的字段是否存在
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('current_bid');
    expect(response.body).toHaveProperty('end_time');
    expect(response.body).toHaveProperty('highest_bidder_id');
    
    // 验证图片数据格式
    expect(response.body).toHaveProperty('images');
    expect(Array.isArray(JSON.parse(response.body.images))).toBe(true);
  });
}); 