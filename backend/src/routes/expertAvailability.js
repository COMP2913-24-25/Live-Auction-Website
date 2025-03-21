const express = require('express');
const router = express.Router();
const knex = require('../db');

// Function to get the date range (next 48 hours)
function getNext48HoursRange() {
    const now = new Date();
    const future = new Date();
    future.setHours(now.getHours() + 48);

    return {
        start: now.toISOString().split('T')[0],   // YYYY-MM-DD format
        end: future.toISOString().split('T')[0]   // YYYY-MM-DD format
    };
}

// Get available experts in the next 48 hours
router.get('/available-experts', async (req, res) => {
    try {
        const { start, end } = getNext48HoursRange();
        const now = new Date();

        // Fetch availability in the next 48 hours
        const availableExperts = await knex('expert_availability')
            .where('date', '>=', start)
            .andWhere('date', '<=', end)
            .andWhere('is_available', true)
            .select('expert_id', 'date', 'start_time', 'end_time');

        if (!availableExperts.length) {
            return res.json({ message: 'No experts available in the next 48 hours', experts: [] });
        }

        // Extract unique expert IDs
        const expertIds = [...new Set(availableExperts.map(e => e.expert_id))];

        // Fetch expert details
        const experts = await knex('users')
            .whereIn('id', expertIds)
            .select('id', 'username');

        // Get categories
        const categories = await knex('expert_categories')
            .whereIn('expert_id', expertIds)
            .join('categories', 'expert_categories.category_id', '=', 'categories.id')
            .select('expert_id', 'categories.name as category');

        // Get workloads
        const workloads = await knex('authentication_requests')
            .whereIn('expert_id', expertIds)
            .andWhere('status', 'pending')
            .groupBy('expert_id')
            .select('expert_id')
            .count('id as pending_requests');

        // Organize expert data
        const expertMap = {};
        experts.forEach(expert => {
            expertMap[expert.id] = {
                id: expert.id,
                username: expert.username,
                category: [],
                workload: 0,
                next_available: null,
                available_now: false
            };
        });

        // Attach categories
        categories.forEach(cat => {
            if (expertMap[cat.expert_id]) {
                expertMap[cat.expert_id].category.push(cat.category);
            }
        });

        // Attach workload
        workloads.forEach(wl => {
            if (expertMap[wl.expert_id]) {
                expertMap[wl.expert_id].workload = wl.pending_requests;
            }
        });

        // Debug: Log all expert time values
        console.log("Available experts data:", availableExperts);

        // Attach next available time (with proper date handling)
        availableExperts.forEach(slot => {
            const expert = expertMap[slot.expert_id];

            if (expert) {
                let startTime = null;
                let endTime = null;

                // Debug: Log raw database values
                console.log(`Processing Expert ${slot.expert_id} - Date: ${slot.date}, Start: ${slot.start_time}, End: ${slot.end_time}`);

                if (slot.start_time && slot.date) {
                    startTime = new Date(`${slot.date}T${slot.start_time}`);
                }
                if (slot.end_time && slot.date) {
                    endTime = new Date(`${slot.date}T${slot.end_time}`);
                }

                // Debug: Log converted values
                console.log(`Converted - Start: ${startTime}, End: ${endTime}`);

                // Validate the conversion
                if (isNaN(startTime) || isNaN(endTime)) {
                    console.error(`Invalid date-time format for expert ${slot.expert_id}:`, slot);
                    return; // Skip this entry
                }

                if (startTime && endTime) {
                    if (now >= startTime && now <= endTime) {
                        expert.available_now = true;
                    } else if (!expert.next_available || startTime < new Date(expert.next_available)) {
                        expert.next_available = startTime.toISOString();
                    }
                }
            }
        });

        return res.json({
            experts: Object.values(expertMap)
        });

    } catch (error) {
        console.error('Error fetching available experts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
