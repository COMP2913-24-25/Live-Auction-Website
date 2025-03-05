const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

router.post('/request', async (req, res) => {
  try {
    // Print request message
    console.log('Authentication Request Body:', req.body);
    console.log('Current User:', req.user);

    // Check whether the user is logged in
    if (!req.user) {
      console.log('User not logged in');
      return res.status(401).json({
        success: false,
        error: 'Please log in first'
      });
    }

    const { item_id } = req.body;
    console.log('Attempting to create auth request for item:', item_id);

    // Check whether the goods exist
 
    const item = await knex('items')
      .where('id', item_id)
      .first();

    console.log('Found item:', item);

    if (!item) {
      console.log('Item not found:', item_id);
      return res.status(404).json({
        success: false,
        error: 'Commodity nonexistence'
      });
    }

    // Check if there are already pending authentication requests
 
    const existingRequest = await knex('authentication_requests')
      .where({
        item_id: item_id,
        status: 'Pending'
      })
      .first();

    if (existingRequest) {
      console.log('Existing request found:', existingRequest);
      return res.status(400).json({
        success: false,
        error: 'The product has a pending certification request'
      });
    }

    // Create a new authentication request
 
    const [request] = await knex('authentication_requests')
      .insert({
        user_id: req.user.id,
        item_id: item_id,
        status: 'Pending',
        request_time: knex.fn.now()
      })
      .returning('*');

    console.log('Created new request:', request);

    res.json({
      success: true,
      request: request
    });

  } catch (error) {
    console.error('Detailed authentication request error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while submitting the authentication request'
    });
  }
});

module.exports = router; 