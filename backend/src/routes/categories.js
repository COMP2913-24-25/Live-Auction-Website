const express = require('express');
const router = express.Router();
const knex = require('../db');

router.get('/', async (req, res) => {
  try {
    const categories = await knex('categories')
      .select('*')
      .orderBy('name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
