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

// Fetch all active auctions
app.get('/api/auctions', (req, res) => {
  const sql = `
    SELECT
      icb.item_id AS id,
      icb.title,
      icb.description,
      icb.min_price,
      icb.end_time,
      icb.authenticated,
      icb.current_bid,
      GROUP_CONCAT(ii.image_url) AS image_urls,
      u.username AS seller_name
    FROM
      item_current_bids icb
    LEFT JOIN
      items i ON icb.item_id = i.id
    LEFT JOIN
      users u ON i.user_id = u.id
    LEFT JOIN
      item_images ii ON icb.item_id = ii.item_id
    WHERE
      icb.end_time > datetime('now')
    GROUP BY
      icb.item_id
    ORDER BY
      i.created_at DESC`

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
})

module.exports = app;