const express = require('express');
const router = express.Router();
const knex = require('../db');

// Fetch finalized items for an expert (userId)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const items = await knex('authentication_requests as ar')
            .select(
                "ar.id",
                "ar.request_time",
                "ar.decision_timestamp",
                "ar.comments",
                "i.title as item_title",
                "i.description as item_description",
                "c.name as category",
                knex.raw("GROUP_CONCAT(ii.image_url) as item_images"),
                "ar.comments",
                "ar.decision_timestamp",
                "i.authentication_status"
            )
            .leftJoin("items as i", "ar.item_id", "i.id")
            .leftJoin("item_images as ii", "i.id", "ii.item_id")
            .leftJoin("categories as c", "i.category_id", "c.id")
            .where('ar.user_id', userId)
            .andWhere("ar.status", "!=", "Pending")
            .whereIn('i.authentication_status', ['Approved', 'Rejected'])
            .groupBy("ar.id")
            .orderBy('i.created_at', 'desc');

        res.json(items);
    } catch (error) {
        console.error('Error fetching finalized items:', error);
        res.status(500).json({ error: 'Failed to fetch finalized items' });
    }
});

// Finalize an item with min_price and duration
router.post('/:id/finalize', async (req, res) => {
    const { id } = req.params;
    const { min_price, duration } = req.body;

    if (!min_price || !duration) {
        return res.status(400).json({ error: 'min_price and duration are required' });
    }

    if (duration < 1 || duration > 5) {
        return res.status(400).json({ error: 'Duration must be between 1 and 5 days' });
    }

    try {
        const item = await knex('items').where({ id }).first();

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.authentication_status !== 'Approved' && item.authentication_status !== 'Rejected') {
            return res.status(400).json({ error: 'Item must be approved or rejected before finalizing' });
        }

        const endTime = new Date();
        endTime.setDate(endTime.getDate() + parseInt(duration));

        // Format the date in 'YYYY-MM-DD HH:MM:SS' format
        const formattedEndTime = endTime.toISOString().slice(0, 19).replace("T", " ");

        await knex('items')
            .where({ id })
            .update({
                min_price,
                end_time: formattedEndTime, // Use the formatted end time here
                auction_status: "Active"
            });

        res.json({ message: 'Item finalized successfully' });
    } catch (error) {
        console.error('Error finalizing item:', error);
        res.status(500).json({ error: 'Failed to finalize item' });
    }
});

module.exports = router;
