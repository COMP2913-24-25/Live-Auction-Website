const express = require('express');
const multer = require('multer');
const path = require('path');
const knex = require('../db');

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Create a new auction
router.post('/auctions', upload.single('image'), async (req, res) => {
  const { title, description, starting_price } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Data validation
  if (!title) {
    return res.status(400).json({ error: 'The item name cannot be empty' });
  }
  if (!starting_price || starting_price <= 0) {
    return res.status(400).json({ error: 'The starting price must be greater than 0' });
  }
  if (!min_increment || min_increment <= 0) {
    return res.status(400).json({ error: 'The minimum price increment must be greater than 0' });
  }

  const startDate = new Date(start_time);
  const endDate = new Date(end_time);
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  if (duration < 1 || duration > 5) {
    return res.status(400).json({ error: 'The duration of the auction must be between 1-5 days' });
  }

  try {
    const [id] = await knex('items').insert({
      user_id: 4, // Temporary: should come from authenticated user
      title,
      description,
      min_price: starting_price,
      min_increment,
      duration,
      start_time,
      end_time,
      authenticated: false,
      image_url
    }).returning('id');

    res.json({ message: 'Auction item created successfully', id });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'An error occurred while creating the auction item' });
  }
});

module.exports = router;
