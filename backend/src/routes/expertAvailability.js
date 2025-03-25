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

                // Ensure hours are always two digits
                const fixTimeFormat = (time) => {
                    if (!time) return null;
                    const parts = time.split(':');
                    if (parts.length === 3) {
                        parts[0] = parts[0].padStart(2, '0'); // Ensure two-digit hour
                        return parts.join(':');
                    }
                    return null;
                };

                const fixedStart = fixTimeFormat(slot.start_time);
                const fixedEnd = fixTimeFormat(slot.end_time);

                console.log(`Fixed Format - Start: ${fixedStart}, End: ${fixedEnd}`);

                if (fixedStart && slot.date) {
                    startTime = new Date(`${slot.date}T${fixedStart}`);
                }
                if (fixedEnd && slot.date) {
                    endTime = new Date(`${slot.date}T${fixedEnd}`);
                }

                // Debug converted values
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

        // Sort experts by next_available time
        const sortedExperts = Object.values(expertMap).sort((a, b) => {
            if (!a.next_available) return 1; // Place experts with no availability at the end
            if (!b.next_available) return -1;
            return new Date(a.next_available) - new Date(b.next_available);
        });

        return res.json({
            experts: sortedExperts
        });

    } catch (error) {
        console.error('Error fetching available experts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to get the date range (next 3 to 7 days)
function getNext3to7DaysRange() {
    const now = new Date();
    const futureStart = new Date();
    const futureEnd = new Date();

    futureStart.setDate(now.getDate() + 3);
    futureEnd.setDate(now.getDate() + 7);

    return {
        start: futureStart.toISOString().split('T')[0],  // YYYY-MM-DD format
        end: futureEnd.toISOString().split('T')[0]       // YYYY-MM-DD format
    };
}

// Get soon-to-be available experts in the next 3-7 days
router.get('/soon-available-experts', async (req, res) => {
    try {
        const { start, end } = getNext3to7DaysRange();

        // Fetch availability in the next 3-7 days
        const upcomingAvailability = await knex('expert_availability')
            .where('date', '>=', start)
            .andWhere('date', '<=', end)
            .andWhere('is_available', true)
            .select('expert_id', 'date', 'start_time', 'end_time');

        if (!upcomingAvailability.length) {
            return res.json({ message: 'No experts becoming available in the next 3-7 days', experts: [] });
        }

        // Extract unique expert IDs
        const expertIds = [...new Set(upcomingAvailability.map(e => e.expert_id))];

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
                next_available: null
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

        // Attach next available time (choosing the earliest slot)
        upcomingAvailability.forEach(slot => {
            const expert = expertMap[slot.expert_id];

            if (expert) {
                // Ensure hours are always two digits
                const fixTimeFormat = (time) => {
                    if (!time) return null;
                    const parts = time.split(':');
                    if (parts.length === 3) {
                        parts[0] = parts[0].padStart(2, '0'); // Ensure two-digit hour
                        return parts.join(':');
                    }
                    return null;
                };

                const fixedStart = fixTimeFormat(slot.start_time);

                if (fixedStart && slot.date) {
                    const startTime = new Date(`${slot.date}T${fixedStart}`);

                    // Choose the earliest next available time
                    if (!expert.next_available || startTime < new Date(expert.next_available)) {
                        expert.next_available = startTime.toISOString();
                    }
                }
            }
        });

        // Sort experts by next_available time
        const sortedExperts = Object.values(expertMap).sort((a, b) => {
            if (!a.next_available) return 1; // Place experts with no availability at the end
            if (!b.next_available) return -1;
            return new Date(a.next_available) - new Date(b.next_available);
        });

        return res.json({
            experts: sortedExperts
        });
    } catch (error) {
        console.error('Error fetching soon-to-be-available experts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to get the start of the current and next week
function getWeekStartDates() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = dayOfWeek; // Days to subtract to get to Sunday
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - diff);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const startOfNextWeek = new Date(startOfCurrentWeek);
    startOfNextWeek.setDate(startOfCurrentWeek.getDate() + 7);

    return { startOfCurrentWeek, startOfNextWeek };
}

// Function to generate all dates for a week
function generateWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push({
            date: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en-US', { weekday: 'long' })
        });
    }
    return dates;
}

// Get working hours for an expert (current & next week)
router.get('/:expert_id', async (req, res) => {
    const { expert_id } = req.params;
    const { startOfCurrentWeek, startOfNextWeek } = getWeekStartDates();

    try {
        // Fetch existing working hours
        const workingHours = await knex('expert_availability')
            .where('expert_id', expert_id)
            .andWhere('date', '>=', startOfCurrentWeek.toISOString().split('T')[0])
            .andWhere('date', '<', new Date(startOfNextWeek.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        const currentWeekDates = generateWeekDates(startOfCurrentWeek);
        const nextWeekDates = generateWeekDates(startOfNextWeek);

        const formatAvailability = (dates, weekType) => {
            return dates.map(({ date, day }) => {
                const entry = workingHours.find(w => w.date === date);
                return entry ? {
                    date,
                    day,
                    start_time: entry.start_time,
                    end_time: entry.end_time,
                    unavailable: entry.unavailable
                } : {
                    date,
                    day,
                    start_time: weekType === 'current' ? 'Unavailable' : null,
                    end_time: null,
                    unavailable: weekType === 'current' ? true : false
                };
            });
        };

        res.json({
            currentWeek: formatAvailability(currentWeekDates, 'current'),
            nextWeek: formatAvailability(nextWeekDates, 'next')
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching availability' });
    }
});

// Update working hours for next week
router.put('/:expert_id', async (req, res) => {
    const { expert_id } = req.params;
    const { workingHours } = req.body;
    const { startOfNextWeek } = getWeekStartDates();
    const nextWeekDates = generateWeekDates(startOfNextWeek).map(d => d.date);

    try {
        await knex.transaction(async trx => {
            await Promise.all(workingHours.map(async ({ date, start_time, end_time, unavailable }) => {
                if (!nextWeekDates.includes(date)) {
                    throw new Error(`Invalid date range: ${date}`);
                }

                // Ensure unavailable days store NULL, otherwise provide defaults
                const finalStartTime = unavailable ? null : start_time || '08:00';
                const finalEndTime = unavailable ? null : end_time || '20:00';

                await trx('expert_availability')
                    .insert({
                        expert_id,
                        date,
                        start_time: finalStartTime,
                        end_time: finalEndTime,
                        unavailable
                    })
                    .onConflict(['expert_id', 'date'])
                    .merge({
                        start_time: knex.raw('excluded.start_time'),
                        end_time: knex.raw('COALESCE(excluded.end_time, expert_availability.end_time)'), // Keep existing end_time if none provided
                        unavailable: knex.raw('excluded.unavailable')
                    });
            }));
        });

        res.json({ message: 'Working hours updated successfully' });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
