const express = require('express');
const router = express.Router();
const knex = require('../db');

router.post('/availability', async (req, res) => {
    try {
        const { expert_id, slots } = req.body;

        if (!expert_id || !slots || !Array.isArray(slots)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const weekStartDate = await getNextSunday(); // Function to get the next week's Sunday

        const availabilityRecords = slots.map(slot => ({
            expert_id,
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: true,
            week_start_date: weekStartDate
        }));

        await knex('expert_availability').insert(availabilityRecords);
        return res.status(201).json({ message: 'Availability set successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function getNextSunday() {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay(); // Days until next Sunday
    today.setDate(today.getDate() + daysUntilSunday);
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

module.exports = router;
