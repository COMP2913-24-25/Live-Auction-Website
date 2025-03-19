const express = require('express');
const router = express.Router();
const knex = require('../db');

async function getNextSunday() {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay(); // Days until next Sunday
    today.setDate(today.getDate() + daysUntilSunday);
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Set availability for the next week starting Sunday
router.post('/availability', async (req, res) => {
    try {
        const { expert_id, slots } = req.body;

        if (!expert_id || !slots || !Array.isArray(slots)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const currentWeekStart = await getCurrentSunday();
        const nextWeekStart = await getNextSunday();

        const availabilityRecords = slots.map(slot => {
            const slotDate = new Date(slot.date);
            const slotWeekStart = slotDate >= new Date(nextWeekStart) ? nextWeekStart : currentWeekStart;

            return {
                expert_id,
                date: slot.date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                is_available: true,
                week_start_date: slotWeekStart
            };
        });

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

// Modify availability for the current week
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

// Mark entire week unavailable
router.post('/availability/unavailable', async (req, res) => {
    try {
        const { expert_id, is_fully_unavailable } = req.body;

        if (typeof is_fully_unavailable !== 'boolean') {
            return res.status(400).json({ error: 'Invalid availability status' });
        }

        // Update the expert's full availability status
        await knex('users').where({ id: expert_id }).update({ is_fully_unavailable });

        if (is_fully_unavailable) {
            // Mark all availability slots as unavailable for both current and next week
            const currentWeek = await getCurrentSunday();
            const nextWeek = await getNextSunday();

            await knex('expert_availability')
                .where({ expert_id })
                .andWhere(builder => builder.where('week_start_date', currentWeek).orWhere('week_start_date', nextWeek))
                .update({ is_available: false });
        }

        return res.json({ message: 'Expert availability updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get availability for the current and next week
router.get('/availability/:expert_id', async (req, res) => {
    try {
        const { expert_id } = req.params;

        const currentWeek = await getCurrentSunday();
        const nextWeek = await getNextSunday();

        const availability = await knex('expert_availability')
            .where({ expert_id })
            .andWhere(builder => builder.where('week_start_date', currentWeek).orWhere('week_start_date', nextWeek))
            .select('*');

        const isFullyUnavailable = await knex('users').where({ id: expert_id }).select('is_fully_unavailable').first();

        return res.json({
            is_fully_unavailable: isFullyUnavailable?.is_fully_unavailable ?? false,
            availability
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
