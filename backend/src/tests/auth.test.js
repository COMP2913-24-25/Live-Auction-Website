const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../db');

// Import the auth routes
const authRoutes = require('../routes/auth');

// Mock environment setup
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../db');

describe('Authentication Routes', () => {
  let app;

  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      // Mock bcrypt hash
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock knex insert
      knex.mockReturnValue({
        insert: jest.fn().mockResolvedValue([1])
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'User registered successfully' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should handle registration error', async () => {
      // Simulate a registration error (e.g., duplicate email)
      knex.mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Duplicate email'))
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ message: 'User already exists' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock user data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        role: 'user'
      };

      // Mock knex query to return user
      knex.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockUser)
        })
      });

      // Mock password comparison
      bcrypt.compare.mockResolvedValue(true);

      // Mock JWT token generation
      jwt.sign.mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        token: 'mockToken',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role
        }
      });
    });

    it('should reject login with invalid email', async () => {
      // Mock knex query to return no user
      knex.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null)
        })
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should reject login with invalid password', async () => {
      // Mock user data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        role: 'user'
      };

      // Mock knex query to return user
      knex.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockUser)
        })
      });

      // Mock password comparison to fail
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ message: 'Email and password are required' });
    });
  });
});