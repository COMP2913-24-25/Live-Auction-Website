// backend/src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('./database/db.sqlite');

app.use(cors());
app.use(bodyParser.json());

// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Fetch all active auctions
app.get('/api/auctions', (req, res) => {
  const sql = `
    SELECT items.*, users.username AS seller_name
    FROM items
    JOIN users ON items.user_id = users.id
    WHERE end_time > datetime('now')
    ORDER BY created_at DESC`

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
})

module.exports = app;