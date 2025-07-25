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

// Update the status of an authentication request
router.post("/authenticate/:requestId", async (req, res) => {
    const { requestId } = req.params;
    const { action, comment } = req.body;
    try {
        const request = await knex("authentication_requests")
            .where("id", requestId)
            .first();

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ error: "Request has already been processed" });
        }

        // Get item details for notification
        const item = await knex('items')
            .where('id', request.item_id)
            .first();

        const update = {
            status: action,
            comments: comment,
            decision_timestamp: knex.fn.now()
        };

        await knex.transaction(async (trx) => {
            // Update authentication request
            await trx("authentication_requests")
                .where("id", requestId)
                .update(update);

            // Update item status
            await trx("items")
                .where("id", request.item_id)
                .update({ authentication_status: action });

            // Create notification for the seller
            await createNotification(item.user_id, item.id, `authentication_${action.toLowerCase()}`, {
                itemTitle: item.title
            });

            // Create notification for the expert
            await createExpertNotification(request.expert_id, item.id, 'review_completed', {
                itemTitle: item.title,
                status: action
            });
        });

        res.json({ message: "Authentication status updated successfully" });
    } catch (error) {
        console.error("Error updating authentication status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add this to handle expert assignment notifications
router.post("/assign/:expertId/:itemId", async (req, res) => {
    const { expertId, itemId } = req.params;
    try {
        const item = await knex('items')
            .where('id', itemId)
            .first();

        await createExpertNotification(expertId, itemId, 'review_request', {
            itemTitle: item.title
        });

        res.json({ message: "Expert notified successfully" });
    } catch (error) {
        console.error("Error notifying expert:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Request reallocation for an authentication request
router.post("/request-reallocation/:requestId", async (req, res) => {
    const { requestId } = req.params;
    try {
        const request = await knex("authentication_requests")
            .where("id", requestId)
            .first();

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ error: "Request has already been processed" });
        }

        await knex("authentication_requests")
            .where("id", requestId)
            .update({ second_opinion_requested: true });

        res.json({ message: "Second opinion requested successfully" });
    } catch (error) {
        console.error("Error requesting second opinion:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Received itemas authenticated by expert
router.get('/reviewed/:expertId', async (req, res) => {
  try {
    const { expertId } = req.params;
    console.log('Received request for reviewed items with expertId:', expertId);
    
    // Check authenticated items
    const reviewedItems = await knex("authentication_requests as ar")
      .select(
        "ar.id",
        "ar.request_time",
        "ar.decision_timestamp",
        "ar.comments",
        "i.title as item_title",
        "i.description as item_description",
        "c.name as category",
        knex.raw("GROUP_CONCAT(ii.image_url) as image_urls"),
        "ar.status as authentication_status",
        "i.user_id as seller_id"
      )
      .leftJoin("items as i", "ar.item_id", "i.id")
      .leftJoin("categories as c", "i.category_id", "c.id")
      .leftJoin("item_images as ii", "i.id", "ii.item_id")
      .where(function () {
        this.where("ar.expert_id", expertId).andWhere("ar.second_opinion_requested", false)
          .orWhere("ar.new_expert_id", expertId).andWhere("ar.second_opinion_requested", true);
      })
      .whereIn("ar.status", ["Approved", "Rejected"])
      .groupBy("ar.id")
      .orderBy("ar.decision_timestamp", "desc");
    
    res.json(reviewedItems);
  } catch (error) {
    console.error('Error fetching reviewed items:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

router.get('/requests/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await knex('items as i')
      .select(
        'i.*',
        'u.username as seller_name',
        knex.raw('GROUP_CONCAT(DISTINCT ii.image_url) as image_urls')
      )
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'i.id', 'ii.item_id')
      .where('i.id', requestId)
      .groupBy('i.id')
      .first();

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

module.exports = router;