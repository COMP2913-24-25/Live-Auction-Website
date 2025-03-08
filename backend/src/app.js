require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
console.log('JWT_SECRET:', process.env.JWT_SECRET);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const knex = require('./database/knex');  // Use the knex instance we configured earlier

const app = express();

// Import routes
const uploadRoutes = require('./routes/upload');
const auctionRoutes = require('./routes/auction');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const authenticationRoutes = require('./routes/authentication');
const bidsRoutes = require('./routes/bids');

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Add authentication middleware
app.use(async (req, res, next) => {
  try {
    console.log('Request cookies:', req.cookies);
    console.log('Request headers:', req.headers);
    
    // 从 cookie 或 Authorization 头获取令牌
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    console.log('Found token:', token);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Successfully decoded token:', decoded);
        
        // Get the latest user information from the database
        const user = await knex('users')
          .where({ id: decoded.id })
          .select('id', 'email', 'role', 'username')
          .first();
          
        if (user) {
          req.user = user;
          console.log('User attached to request:', req.user);
        } else {
          console.log('User not found in database');
        }
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
      }
    } else {
      console.log('No token found in request');
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
});

// Mount routes
app.use('/api', uploadRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', categoriesRoutes);
app.use('/api', searchRoutes);
app.use('/api/authentication', authenticationRoutes);
app.use('/api/bids', bidsRoutes);

// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

module.exports = app;