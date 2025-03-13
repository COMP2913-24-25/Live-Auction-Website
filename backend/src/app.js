require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Import routes
const uploadRoutes = require('./routes/upload');
const auctionRoutes = require('./routes/auction');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const managerRoutes = require('./routes/manager');
const paymentRoutes = require('./routes/payment');
const expertRoutes = require('./routes/expert');
const userRoutes = require('./routes/user');
const bidRoutes = require('./routes/bid');

// CORS configuration
app.use(cors({
  origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// 为 Stripe webhook 特殊处理
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Mount routes
app.use('/api', uploadRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', categoriesRoutes);
app.use('/api', searchRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bids', bidRoutes);

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use(express.json());

module.exports = app;