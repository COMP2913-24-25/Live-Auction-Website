const express = require("express");
const knex = require("../db"); // Ensure you have a Knex instance set up

const router = express.Router();

// Route to save external image URLs
router.post("/upload-url", async (req, res) => {
    try {
        const { item_id, image_url } = req.body;

        if (!item_id || !image_url) {
            return res.status(400).json({ error: "Item ID and image URL required" });
        }

        await knex("item_images").insert({ item_id, image_url });

        res.json({ message: "Image URL saved successfully", image_url });
    } catch (error) {
        console.error("Error saving image URL:", error);
        res.status(500).json({ error: "Failed to save image URL" });
    }
});

module.exports = router;
