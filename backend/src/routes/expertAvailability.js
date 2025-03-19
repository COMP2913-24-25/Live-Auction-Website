const express = require('express');
const router = express.Router();
const knex = require('../db');

async function getNextSunday() {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay(); // Days until next Sunday
    today.setDate(today.getDate() + daysUntilSunday);
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

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

async function getCurrentSunday() {
    const today = new Date();
    today.setDate(today.getDate() - today.getDay()); // Move back to the most recent Sunday
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

router.patch('/availability/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_available } = req.body;

        if (typeof is_available !== 'boolean') {
            return res.status(400).json({ error: 'Invalid availability status' });
        }

        // Ensure it's for the current week
        const currentWeekStart = await getCurrentSunday();

        const availability = await knex('expert_availability')
            .where({ id })
            .andWhere('week_start_date', currentWeekStart)
            .first();

        if (!availability) {
            return res.status(404).json({ error: 'Availability slot not found or cannot be changed' });
        }

        await knex('expert_availability').where({ id }).update({ is_available });
        return res.json({ message: 'Availability updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
