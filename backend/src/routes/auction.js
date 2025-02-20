const express = require('express');
const knex = require('../db'); // Assuming you have a Knex setup in db/knex.js
const router = express.Router();

// Fetch all active auctions
router.get('/active', async (req, res) => {
    try {
      const auctions = await knex('item_current_bids as icb')
        .select(
          'icb.item_id as id',
          'icb.title',
          'icb.description',
          'icb.min_price',
          'icb.end_time',
          'icb.authenticated',
          'icb.current_bid',
          knex.raw('GROUP_CONCAT(ii.image_url) as image_urls'),
          'u.username as seller_name'
        )
        .leftJoin('items as i', 'icb.item_id', 'i.id')
        .leftJoin('users as u', 'i.user_id', 'u.id')
        .leftJoin('item_images as ii', 'icb.item_id', 'ii.item_id')
        .where('icb.end_time', '>', knex.raw("datetime('now')"))
        .groupBy('icb.item_id')
        .orderBy('i.created_at', 'desc');
  
      if (auctions.length === 0) {
        return res.status(404).json({ error: 'No active auctions found' });
      }
  
      res.json(auctions);
    } catch (err) {
      console.error('Database error:', err.message);
      res.status(500).json({ error: err.message });
    }
});  

// Route to get a single auction item
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const auction = await knex('item_current_bids')
            .select(
                'item_id AS id',
                'title',
                'description',
                'current_bid',
                'authenticated',
                'end_time',  // Ensure this is a valid timestamp
                'min_price'
            )
            .where({ item_id: id })
            .first();

        if (!auction) {
            return res.status(404).json({ error: 'Auction item not found' });
        }

        const seller = await knex('items')
            .select('users.username AS seller_name', 'items.created_at')
            .join('users', 'items.user_id', 'users.id')
            .where('items.id', id)
            .first();

        const images = await knex('item_images')
            .select('image_url')
            .where({ item_id: id });

        res.json({
            id: auction.id,
            title: auction.title,
            description: auction.description,
            current_bid: auction.current_bid,
            authenticated: auction.authenticated,
            seller_name: seller?.seller_name || "Unknown",
            posting_date: seller?.created_at || "Unknown",
            end_time: auction.end_time, // Send as raw timestamp
            images: images.map(img => img.image_url)
        });
    } catch (error) {
        console.error('Error fetching auction item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
