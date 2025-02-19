const express = require('express');
const knex = require('../db');
const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const categories = await knex('categories').select('*'); // Adjust column names if needed
    res.json(categories);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'An error occurred while fetching categories' });
  }
});

module.exports = router;
