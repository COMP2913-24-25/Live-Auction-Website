require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// Use database path from .env or default
const dbPath = process.env.DATABASE_URL || './database/db.sqlite';

// Connect to your SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log(`Connected to the SQLite database at ${dbPath}.`);
  }
});

// Import routes
const uploadRoutes = require('./routes/upload');
const auctionRoutes = require('./routes/auction');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');

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

// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

module.exports = app;