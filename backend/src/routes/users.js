const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

// Get all expert list
router.get('/experts', async (req, res) => {
  try {
    // Get all users with role 2 (assuming 2 is the expert role)
    const experts = await knex('users')
      .where('role', 2)
      .select('id', 'username', 'email', 'role')
      .orderBy('username');
    
    return res.json({
      success: true,
      experts
    });
  } catch (error) {
    console.error('Get expert list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Get expert list failed'
    });
  }
});

// Add API to get single user info
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await knex('users')
      .where('id', userId)
      .select('id', 'username', 'email', 'role')
      .first();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return res.status(500).json({
      success: false,
      error: 'Get user info failed'
    });
  }
});

module.exports = router; 