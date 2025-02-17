const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database/db.sqlite');
const dbPath = path.join(__dirname, 'database', 'db.sqlite');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', categoriesRoutes);
app.use('/api', searchRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

module.exports = app;