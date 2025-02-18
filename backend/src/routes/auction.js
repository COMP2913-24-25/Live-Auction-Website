const express = require('express');
const knex = require('../db'); // Assuming you have a Knex setup in db/knex.js
const router = express.Router();

// Utility function to calculate remaining time
const calculateTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const difference = end - now;

    if (difference <= 0) return "Auction Ended";

    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
};

// Route to get a single auction item
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch auction details
        const auction = await knex('item_current_bids')
            .select(
                'item_id AS id',
                'title',
                'description',
                'current_bid',
                'authenticated',
                'end_time',
                'min_price'
            )
            .where({ item_id: id })
            .first();

        if (!auction) {
            return res.status(404).json({ error: 'Auction item not found' });
        }

        // Fetch seller name
        const seller = await knex('items')
            .select('users.username AS seller_name', 'items.created_at')
            .join('users', 'items.user_id', 'users.id')
            .where('items.id', id)
            .first();

        // Fetch item images
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
            remaining_time: calculateTimeRemaining(auction.end_time),
            images: images.map(img => img.image_url)
        });
    } catch (error) {
        console.error('Error fetching auction item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
