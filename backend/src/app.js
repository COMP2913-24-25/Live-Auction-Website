require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('./routes/cleanupScheduler');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// 确保这些中间件在路由之前
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const uploadRoutes = require('./routes/upload');
const auctionRoutes = require('./routes/auction');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const managerRoutes = require('./routes/manager');
const paymentRoutes = require('./routes/payment');
const notificationsRoutes = require('./routes/notifications');
const expertRoutes = require('./routes/expert');
const { router: emailRouter } = require('./routes/email');
const expertAvailabilityRoutes = require('./routes/expertAvailability');
const bidRoutes = require('./routes/bid');

// CORS configuration
app.use(cors({
  origin: process.env.VITE_FRONTEND_URL,
  credentials: true,
}));

// 为 Stripe webhook 特殊处理
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    next();
  }
});

// Mount routes - 修正路径
app.use('/api/upload', uploadRoutes);      // 修改为/api/upload，使路径与前端匹配
app.use('/api/auctions', auctionRoutes);   // 保持不变，使用复数形式
app.use('/api/auth', authRoutes);
app.use('/api', categoriesRoutes);        // 保持不变
app.use('/api/search', searchRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/email', emailRouter);
app.use('/api/expert-availability', expertAvailabilityRoutes);
app.use('/api/bids', bidRoutes);

// 记录路由配置
console.log('Routes configured:');
console.log('- /api/upload/* -> uploadRoutes');
console.log('- /api/auctions/* -> auctionRoutes');

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

console.log('Email config:', {
  user: process.env.EMAIL_USER ? 'Set' : 'Not set',
  pass: process.env.EMAIL_PASSWORD ? 'Set' : 'Not set'
});

module.exports = app;