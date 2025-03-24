require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('./routes/cleanupScheduler');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
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
const notificationsRoutes = require('./routes/notifications');
const expertRoutes = require('./routes/expert');
const expertAvailabilityRoutes = require('./routes/expertAvailability');

const upload = multer({ dest: 'uploads/' }); // 临时存储上传的文件

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
    express.json()(req, res, next);
  }
});

// Mount routes
app.use('/api', uploadRoutes);
app.use('/api/auctions', upload.array('images'), auctionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', categoriesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/expert-availability', expertAvailabilityRoutes);

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// 确保这些中间件在路由之前
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = app;