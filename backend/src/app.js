require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
console.log('JWT_SECRET:', process.env.JWT_SECRET);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const knex = require('./database/knex');  // Use the knex instance we configured earlier

const app = express();

const uploadRoutes = require('./routes/upload');
const auctionRoutes = require('./routes/auction');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const managerRoutes = require('./routes/manager');
const notificationsRoutes = require('./routes/notifications');
const authenticationRoutes = require('./routes/authentication');
const bidsRoutes = require('./routes/bids'); 
const expertRoutes = require('./routes/expert');

// CORS configuration
app.use(cors({
  origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Add authentication middleware
app.use(async (req, res, next) => {
  try {
    console.log('🔐 Authentication Middleware - Request path:', req.path);
    console.log('🔐 Authentication middleware - Headers:', req.headers);
    
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    console.log('🔐 Authentication middleware - Extracts tokens:', token ? 'exist' : 'inexistence');

    if (token) {
      try {
        const decoded = jwt.verify(
          token, 
          process.env.SECRET_KEY || 'temporary_secret_key_for_testing'
        );
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
    console.error('💥 Authentication middleware error:', error);
    next();
  }
});

// Mount routes in correct order
app.use('/api/auth', authRoutes);
app.use('/api/authentication', authenticationRoutes);  // Authentication routes
app.use('/api/upload', uploadRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', categoriesRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/expert', expertRoutes);

// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Add test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'The server is running properly' });
});

app.use((req, res) => {
  console.log('No route found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server internal error' });
});

module.exports = app;
