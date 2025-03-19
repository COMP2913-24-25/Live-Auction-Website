const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const knex = require('../db');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'auction_images', // Cloudinary folder name
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      {
        quality: 'auto',
        fetch_format: 'auto'
      }
    ],
  },
});

const upload = multer({ storage });

// Make sure the route matches exactly
router.post('/create-listing', upload.array('images', 6), async (req, res) => {
  try {
    console.log('Received form data:', req.body); // Debug log
    console.log('Received files:', req.files); // Debug log
    
    const { user_id, title, description, min_price, duration, category } = req.body;
    
    // Add validation
    if (!title || !description || !min_price || !duration || !category) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

    // Store Cloudinary image URLs
    const imageUrls = req.files.map(file => file.path);

    // Ensure duration is valid (1-5 days)
    const durationInt = parseInt(duration);
    if (isNaN(durationInt) || durationInt < 1 || durationInt > 5) {
      return res.status(400).json({ error: 'Duration must be between 1 and 5 days.' });
    }

    const createdAt = new Date();
    const endTime = new Date(createdAt.getTime() + durationInt * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    // Insert item into the database
    const [{ id: auctionId }] = await knex('items').insert({
      user_id,
      title,
      description,
      min_price,
      category_id: category,
      end_time: endTime,
      auction_status: 'Active'
    }).returning(['id']);

    // Insert images into item_images table
    const imageRecords = imageUrls.map(url => ({ item_id: auctionId, image_url: url }));
    await knex('item_images').insert(imageRecords);

    res.status(201).json({ message: 'Auction item created successfully', auctionId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create item authentication request 
router.post('/authenticate-item', upload.array('images', 6), async (req, res) => {
  try {
    const { user_id, title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

    // Store Cloudinary image URLs
    const imageUrls = req.files.map(file => file.path);

    // Insert item into the database
    const [{ id: itemId }] = await knex('items').insert({
      user_id,
      title,
      description,
      category_id: category,
      authentication_status: 'Pending',
      auction_status: 'Not Listed'
    }).returning(['id']);

    // Insert authentication request into the database
    await knex('authentication_requests').insert({
      item_id: itemId,
      user_id,
      status: 'Pending'
    });

    // Insert images into item_images table
    const imageRecords = imageUrls.map(url => ({ item_id: itemId, image_url: url }));
    await knex('item_images').insert(imageRecords);

    res.status(201).json({ message: 'Authentication request created successfully', itemId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
