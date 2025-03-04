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
        const completedRequests = await knex('authentication_requests')
            .select(
                'authentication_requests.id',
                'items.id as item_id',
                'items.title as item_name',
                'categories.name as category',
                'authentication_requests.status',
                'users.username as assigned_expert_username',
                'authentication_requests.comments',
                'authentication_requests.decision_timestamp',
            )
            .join('items', 'authentication_requests.item_id', 'items.id')
            .join('categories', 'items.category_id', 'categories.id')
            .leftJoin('users', 'authentication_requests.expert_id', 'users.id')
            .whereIn('authentication_requests.status', ['Approved', 'Rejected']);

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
            .where({ item_id: item_id })
            .update({ expert_id });

        res.json({ message: 'Expert assigned successfully' });
    } catch (error) {
        console.error('Error assigning expert:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reassign an expert for an item
router.put('/authentication-requests/reassign', async (req, res) => {
    const { request_id, new_expert_id } = req.body;

    try {
        await knex('authentication_requests')
            .where({ item_id: request_id })
            .update({ expert_id: new_expert_id });

        res.json({ message: 'Expert reassigned successfully' });
    } catch (error) {
        console.error('Error reassigning expert:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
