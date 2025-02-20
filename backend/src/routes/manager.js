const express = require("express");
const knex = require("../db");
const router = express.Router();

// Fetch pending authentication requests
router.get("/pending-requests", async (req, res) => {
    try {
        const pendingRequests = await knex("authentication_requests as ar")
            .select(
                "ar.id",
                "i.title as item_name",
                "c.name as category",
                "ar.status"
            )
            .join("items as i", "ar.item_id", "i.id")
            .join("categories as c", "i.category_id", "c.id")
            .where("ar.status", "Pending");

        res.json(pendingRequests);
    } catch (error) {
        console.error("Error fetching pending authentication requests:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch experts available for a specific category
router.get("/experts/:category_id", async (req, res) => {
    try {
        const { category_id } = req.params;
        const experts = await knex("expert_categories as ec")
            .select("u.id", "u.username")
            .join("users as u", "ec.expert_id", "u.id")
            .where("ec.category_id", category_id);

        res.json(experts);
    } catch (error) {
        console.error("Error fetching experts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Assign an expert to an item
router.post("/assign-expert", async (req, res) => {
    try {
        const { request_id, expert_id } = req.body;

        const updated = await knex("authentication_requests")
            .where("id", request_id)
            .update({
                expert_id,
                status: "Approved",
            });

        if (updated) {
            res.json({ success: true, message: "Expert assigned successfully" });
        } else {
            res.status(400).json({ error: "Invalid request ID" });
        }
    } catch (error) {
        console.error("Error assigning expert:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch approved and rejected items
router.get("/authenticated-items", async (req, res) => {
    try {
        const authenticatedItems = await knex("authentication_requests as ar")
            .select(
                "i.title as item_name",
                "c.name as category",
                "ar.status",
                "u.username as expert"
            )
            .join("items as i", "ar.item_id", "i.id")
            .join("categories as c", "i.category_id", "c.id")
            .leftJoin("users as u", "ar.expert_id", "u.id")
            .whereNot("ar.status", "Pending");

        res.json(authenticatedItems);
    } catch (error) {
        console.error("Error fetching authenticated items:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
