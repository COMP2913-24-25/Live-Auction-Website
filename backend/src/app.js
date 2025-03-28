require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('./routes/cleanupScheduler');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

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
const profileRoutes = require('./routes/profile')

const upload = multer({ dest: 'uploads/' });

// CORS configuration
const allowedOrigins = [process.env.VITE_FRONTEND_URL, 'http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe webhook 
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
app.use('/api/search', searchRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/expert-availability', expertAvailabilityRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/profile', profileRoutes);

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;