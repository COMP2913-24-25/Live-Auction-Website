require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('./routes/cleanupScheduler');

const express = require('express');
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

// 导入 Cloudinary 配置
const { upload } = require('./routes/upload');

// CORS configuration
const allowedOrigins = [process.env.VITE_FRONTEND_URL, 'http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
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
app.use('/api/upload', uploadRoutes);
app.use('/api/auctions', auctionRoutes);  // 移除本地上传中间件
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/email', emailRouter);
app.use('/api/expert-availability', expertAvailabilityRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/categories', categoriesRoutes);

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 记录路由配置
console.log('Routes configured:');
console.log('- /api/upload/* -> uploadRoutes');
console.log('- /api/auctions/* -> auctionRoutes');

console.log('Email config:', {
  user: process.env.EMAIL_USER ? 'Set' : 'Not set',
  pass: process.env.EMAIL_PASSWORD ? 'Set' : 'Not set'
});

// 添加明确的调试信息来显示使用的 SECRET_KEY
console.log(`SECRET_KEY (first 3 chars): ${process.env.SECRET_KEY?.substring(0, 3)}***`);

// 在 .env 中确保 SECRET_KEY 设置一致
// SECRET_KEY=your_actual_secret_key

module.exports = app;