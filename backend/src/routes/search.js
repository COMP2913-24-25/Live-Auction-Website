const express = require('express');
const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
  
    const results = []; 
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;