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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
    console.log('🔐 认证中间件 - 请求路径:', req.path);
    console.log('🔐 认证中间件 - Headers:', req.headers);
    
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    console.log('🔐 认证中间件 - 提取的token:', token ? '存在' : '不存在');

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
    console.error('💥 认证中间件错误:', error);
    next();
  }
});

// Mount routes
app.use('/api/upload', uploadRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', categoriesRoutes);
app.use('/api/authentication', authenticationRoutes);
app.use('/api/bids', bidsRoutes);  // 暂时注释掉
app.use('/api/search', searchRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/notifications', notificationsRoutes);

// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// 添加测试路由
app.get('/api/test', (req, res) => {
  res.json({ message: '服务器正常运行' });
});

app.use((req, res) => {
  console.log('未找到路由:', req.method, req.path);
  res.status(404).json({ error: '路由未找到' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;