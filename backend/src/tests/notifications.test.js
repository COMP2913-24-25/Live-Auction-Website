const request = require('supertest');
const express = require('express');
const knex = require('../db');
const notificationRouter = require('../routes/notifications');

jest.mock('../db');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRouter);

describe('Notification API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch notifications for a user', async () => {
    knex.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([
        {
          id: 1,
          user_id: 123,
          auction_id: 5,
          type: 'outbid',
          created_at: new Date(),
          auction_title: 'Vintage Clock',
          auction_description: 'A rare antique clock',
          min_price: 100,
          auction_end_time: new Date(),
          authentication_status: 'pending',
          auction_status: 'active',
          current_bid: 150,
          image_urls: 'image1.jpg,image2.jpg',
        },
      ]),
    }));

    const res = await request(app).get('/api/notifications/123');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].message).toBe('You have been outbid on "Vintage Clock"');
  });

  test('should mark notification as read', async () => {
    knex.mockImplementation(() => ({ where: jest.fn().mockReturnThis(), update: jest.fn().mockResolvedValue(1) }));
    const res = await request(app).put('/api/notifications/1/read');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('should delete a notification', async () => {
    knex.mockImplementation(() => ({ where: jest.fn().mockReturnThis(), update: jest.fn().mockResolvedValue(1) }));
    const res = await request(app).delete('/api/notifications/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
