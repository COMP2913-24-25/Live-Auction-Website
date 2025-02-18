const express = require('express');
const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 1, name: 'Electronics', path: '/category/electronics' },
      { id: 2, name: 'Collectibles', path: '/category/collectibles' },
      { id: 3, name: 'Art', path: '/category/art' },
      { id: 4, name: 'Jewelry', path: '/category/jewelry' }
    ];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;