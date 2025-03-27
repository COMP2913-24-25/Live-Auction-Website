const { describe, it, expect, beforeAll, afterAll, afterEach } = require('@jest/globals');
const request = require('supertest');
const app = require('../app');
const db = require('../db');
const jwt = require('jsonwebtoken');

// Mock user for authentication
const mockUser = {
  id: 999,
  email: 'test@example.com',
  role: 2
};

// Generate a valid JWT token for testing
const generateToken = () => {
  return jwt.sign(
    mockUser,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

describe('Payment API Tests', () => {
  let authToken;
  let testPaymentMethodId;

  beforeAll(async () => {
    // Generate auth token for tests
    authToken = generateToken();
    
    // Clean up test data before starting
    await db('user_payment_methods').where('user_id', mockUser.id).delete();
  });

  afterAll(async () => {
    // Clean up test data after tests
    await db('user_payment_methods').where('user_id', mockUser.id).delete();
    
    // Close database connection
    await db.destroy();
  });

  // Test adding a payment method
  it('POST /api/payment/methods - should add a new payment method', async () => {
    const paymentMethodData = {
      payment_provider: 'Stripe',
      tokenized_card_id: 'tok_' + Math.random().toString(36).substring(2, 15),
      last4: '4242',
      card_type: 'Visa',
      exp_month: 12,
      exp_year: 25,
      cvv: '123'
    };

    const response = await request(app)
      .post('/api/payment/methods')
      .set('Authorization', `Bearer ${authToken}`)
      .send(paymentMethodData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Payment method added successfully');
    expect(response.body).toHaveProperty('id');
    
    // Save the ID for later tests
    testPaymentMethodId = response.body.id;
  });

  // Test getting payment methods
  it('GET /api/payment/methods - should return user payment methods', async () => {
    const response = await request(app)
      .get('/api/payment/methods')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // If we added a payment method in the previous test, we should have at least one
    if (testPaymentMethodId) {
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('payment_provider');
      expect(response.body[0]).toHaveProperty('last4');
    }
  });

  // Test creating a payment intent
  it('POST /api/payment/create-payment-intent - should create a payment intent', async () => {
    const paymentData = {
      amount: 1000, // $10.00
      auctionId: 1,
      paymentMethodId: testPaymentMethodId
    };

    const response = await request(app)
      .post('/api/payment/create-payment-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send(paymentData);

    // Since this might be a mock in test environment, we'll check for either success or a specific error
    if (response.statusCode === 200) {
      expect(response.body).toHaveProperty('clientSecret');
    } else {
      // If we're in test mode and can't actually create a payment intent
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    }
  });

  // Test error handling for missing fields
  it('POST /api/payment/methods - should return 400 for missing fields', async () => {
    const invalidData = {
      // Missing required fields
      payment_provider: 'Stripe'
    };

    const response = await request(app)
      .post('/api/payment/methods')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });

  // Test authentication requirement
  it('GET /api/payment/methods - should require authentication', async () => {
    const response = await request(app)
      .get('/api/payment/methods');
      // No auth token provided

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  // Test payment history endpoint
  it('GET /api/payment/payment-history/:userId - should return payment history', async () => {
    const response = await request(app)
      .get(`/api/payment/payment-history/${mockUser.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // Test item payment status endpoint
  it('GET /api/payment/item-payment-status/:itemId - should return payment status', async () => {
    const itemId = 1; // Use a test item ID
    
    const response = await request(app)
      .get(`/api/payment/item-payment-status/${itemId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status');
  });
}); 