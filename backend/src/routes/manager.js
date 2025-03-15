const express = require("express");
const knex = require("../db");
const router = express.Router();

// Fetch pending authentication requests not yet assigned to an expert
router.get('/authentication-requests/pending-unassigned', async (req, res) => {
    try {
        const pendingRequests = await knex('authentication_requests')
            .select(
                'items.id as item_id',
                'items.title as item_name',
                'categories.id as category_id',
                'categories.name as category_name',
                'authentication_requests.status'
            )
            .join('items', 'authentication_requests.item_id', 'items.id')
            .join('categories', 'items.category_id', 'categories.id')
            .where('authentication_requests.status', 'Pending')
            .whereNull('authentication_requests.expert_id');

        res.json(pendingRequests);
    } catch (error) {
        console.error('Error fetching pending authentication requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch pending authentication requests already assigned to an expert
router.get('/authentication-requests/pending-assigned', async (req, res) => {
    try {
        const pendingRequests = await knex('authentication_requests')
            .select(
                'authentication_requests.id',
                'items.id as item_id',
                'items.title as item_name',
                'categories.id as category_id',
                'categories.name as category_name',
                'users.id as assigned_expert_id',
                'users.username as assigned_expert_username'
            )
            .join('items', 'authentication_requests.item_id', 'items.id')
            .join('categories', 'items.category_id', 'categories.id')
            .join('users', 'authentication_requests.expert_id', 'users.id')
            .where('authentication_requests.status', 'Pending')
            .where('authentication_requests.second_opinion_requested', 1)
            .whereNull('authentication_requests.new_expert_id');

        res.json(pendingRequests);
    } catch (error) {
        console.error('Error fetching pending authentication requests with experts:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Fetch experts available for a specific category
router.get('/experts/:category_id', async (req, res) => {
    const { category_id } = req.params;

    try {
        const experts = await knex('expert_categories')
            .select('users.id', 'users.username')
            .join('users', 'expert_categories.expert_id', 'users.id')
            .where('expert_categories.category_id', category_id);

        res.json(experts);
    } catch (error) {
        console.error('Error fetching experts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch experts available for reassignment but not the current expert
router.get('/experts/:category_id/:current_expert_id', async (req, res) => {
    const { category_id, current_expert_id } = req.params;

    try {
        const experts = await knex('expert_categories')
            .select('users.id', 'users.username')
            .join('users', 'expert_categories.expert_id', 'users.id')
            .where('expert_categories.category_id', category_id)
            .whereNot('expert_categories.expert_id', current_expert_id);

        res.json(experts);
    } catch (error) {
        console.error('Error fetching experts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch approved and rejected items
router.get('/authentication-requests/completed', async (req, res) => {
    try {
        const completedRequests = await knex('authentication_requests as ar')
            .select(
                'ar.id',
                'items.id as item_id',
                'items.title as item_name',
                knex.raw(`
                    COALESCE(expert_new.username, expert_old.username) AS assigned_expert_username
                `),
                'ar.second_opinion_requested',
                'ar.status',
                'ar.comments',
                'ar.decision_timestamp',            
            )
            .join('items', 'ar.item_id', 'items.id')
            .join('categories', 'items.category_id', 'categories.id')
            .leftJoin('users as expert_old', 'ar.expert_id', 'expert_old.id')
            .leftJoin('users as expert_new', 'ar.new_expert_id', 'expert_new.id')
            .whereIn('ar.status', ['Approved', 'Rejected']);

        res.json(completedRequests);
    } catch (error) {
        console.error('Error fetching completed authentication requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign an expert to an item
router.put('/authentication-requests/assign', async (req, res) => {
    const { item_id, expert_id } = req.body;

    try {
        await knex('authentication_requests')
            .where({ item_id })
            .update({ expert_id });


        return res.json({message: 'Expert assigned successfully'});

    } catch (error) {
        console.error('Error assigning expert:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Read if expert has been assigned to an item
let lastKnownCount = 0; // Store the last known count of assigned experts

router.get('/authentication-requests/check-updates', async (req, res) => {
    try {
        const currentCount = await knex('authentication_requests')
            .whereNotNull('expert_id')
            .count('* as count')
            .first();
        
        const updateInfo =   await knew('authentication_requests')
            .select('item_id', 'expert_id')
            .whereNotNull('expert_id');

        if (currentCount.count > lastKnownCount) {
            lastKnownCount = currentCount.count; // Update the last known count
            return res.json({ respond: true, data: updateInfo });
        } else {
            return res.json({ respond: false });
        }
    } catch (error) {
        console.error('Error checking updates:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});




// Reassign an expert for an item
router.put('/authentication-requests/reassign', async (req, res) => {
    const { request_id, new_expert_id } = req.body;

    try {
        await knex('authentication_requests')
            .where({ item_id: request_id })
            .update({ new_expert_id: new_expert_id });

        res.json({ message: 'Expert reassigned successfully' });
    } catch (error) {
        console.error('Error reassigning expert:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Read if expert has been reassigned to an item
router.get('/authentication-requests/reassign', async (req, res) => {
    try {
        const reassignedRequests = await knex('authentication_requests')
            .select('item_id', 'new_expert_id')
            .whereNotNull('new_expert_id');

        res.json(reassignedRequests);
    } catch (error) {
        console.error('Error fetching reassigned requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
