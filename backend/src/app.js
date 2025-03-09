require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Import routes
const uploadRoutes = require('./routes/upload');
const auctionRoutes = require('./routes/auction');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const managerRoutes = require('./routes/manager');
const expertRoutes = require('./routes/expert');

// CORS configuration
app.use(cors({
  origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(bodyParser.json());

// Mount routes
app.use('/api', uploadRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', categoriesRoutes);
app.use('/api', searchRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/expert', expertRoutes);

// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

module.exports = app;