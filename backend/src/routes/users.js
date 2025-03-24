const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

// Get all experts
router.get('/experts', async (req, res) => {
  try {
    // Get all users with role 2 (assumed to be experts)
    const experts = await knex('users')
      .where('role', 2)
      .select('id', 'username', 'email', 'role')
      .orderBy('username');

    return res.json({
      success: true,
      experts
    });
  } catch (error) {
    console.error('Error retrieving expert list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve expert list'
    });
  }
});

// Add API to get a single user's info
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
    console.error('Error retrieving user info:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user info'
    });
  }
});

module.exports = router;
