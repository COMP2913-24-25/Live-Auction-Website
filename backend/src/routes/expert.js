const express = require("express");
const knex = require("../db");
const router = express.Router();

// Get all pending authentication requests for an expert
router.get("/pending/:expertId", async (req, res) => {
    const { expertId } = req.params;
    try {
        const requests = await knex("authentication_requests as ar")
            .select(
                "ar.id",
                "ar.request_time",
                "i.title as item_title",
                "i.description as item_description",
                "c.name as category",
                knex.raw("GROUP_CONCAT(ii.image_url) as image_urls"),
                "i.user_id as seller_id"
            )
            .leftJoin("items as i", "ar.item_id", "i.id")
            .leftJoin("categories as c", "i.category_id", "c.id")
            .leftJoin("item_images as ii", "i.id", "ii.item_id")
            .where(function () {
                this.where("ar.expert_id", expertId).andWhere("ar.second_opinion_requested", false)
                    .orWhere("ar.new_expert_id", expertId).andWhere("ar.second_opinion_requested", true);
            })
            .andWhere("ar.status", "Pending")
            .groupBy("ar.id");

        res.json(requests);
    } catch (error) {
        console.error("Error fetching pending authentication requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all past completed authentication requests for an expert
router.get("/completed/:expertId", async (req, res) => {
    const { expertId } = req.params;
    try {
        const requests = await knex("authentication_requests as ar")
            .select(
                "ar.id",
                "ar.request_time",
                "ar.decision_timestamp",
                "ar.comments",
                "i.title as item_title",
                "i.description as item_description",
                knex.raw("GROUP_CONCAT(ii.image_url) as item_images"),
                "ar.comments",
                "ar.decision_timestamp",
                "i.user_id as seller_id"
            )
            .leftJoin("items as i", "ar.item_id", "i.id")
            .leftJoin("item_images as ii", "i.id", "ii.item_id")
            .where(function () {
                this.where("ar.expert_id", expertId).andWhere("ar.second_opinion_requested", false)
                    .orWhere("ar.new_expert_id", expertId).andWhere("ar.second_opinion_requested", true);
            })
            .andWhere("ar.status", "!=", "Pending")
            .groupBy("ar.id");

        res.json(requests);
    } catch (error) {
        console.error("Error fetching completed authentication requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;