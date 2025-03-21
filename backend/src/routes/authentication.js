const express = require('express');
const router = express.Router();
const knex = require('../db');

router.post('/request', async (req, res) => {
  try {
    const { itemId } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to request authentication'
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
    }

    // Check if item exists
    const item = await knex('items').where('id', itemId).first();
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Create authentication request
    await knex('authentication_requests').insert({
      item_id: itemId,
      user_id,
      status: 'Pending',
      created_at: knex.fn.now()
    });

    // Update item status
    await knex('items')
      .where('id', itemId)
      .update({
        authentication_status: 'Pending'
      });

    res.json({
      success: true,
      message: 'Authentication request submitted successfully'
    });
  } catch (error) {
    console.error('Authentication request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit authentication request'
    });
  }
});

module.exports = router;