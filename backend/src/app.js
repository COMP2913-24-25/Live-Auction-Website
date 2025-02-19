const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');

const app = express();

// Connect to your SQLite database
const db = new sqlite3.Database('./database/db.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the SQLite database.');
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
  origin: 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

//Static file service
app.use('/uploads', express.static('uploads'));

// Mount routes
app.use('/api', uploadRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/search', searchRoutes);

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