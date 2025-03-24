const express = require('express');
const knex = require('../db'); 
const router = express.Router();
const cron = require('node-cron');
const { calculatePostingFee } = require('../utils/feeCalculator');

// Fetch all active auctions
router.get('/active', async (req, res) => {
  try {
    const auctions = await knex('item_current_bids as icb')
      .select(
        'icb.item_id as id',
        'icb.title',
        'icb.description',
        'icb.min_price',
        'icb.end_time',
        'icb.authentication_status',
        'icb.auction_status',
        'icb.current_bid',
        knex.raw('GROUP_CONCAT(ii.image_url) as image_urls'),
        'u.username as seller_name'
      )
      .leftJoin('items as i', 'icb.item_id', 'i.id')
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'icb.item_id', 'ii.item_id')
      .where('icb.end_time', '>', knex.raw("datetime('now')"))
      .where('icb.auction_status', '=', 'Active')
      .groupBy('icb.item_id')
      .orderBy('i.created_at', 'desc');
    if (auctions.length === 0) {
      return res.status(404).json({ error: 'No active auctions found' });
    }
    res.json(auctions);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route to get a single auction item
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // First, check if the item exists and get current bid in one query
    const item = await knex('items')
      .select(
        'items.*',
        'users.username as seller_name',
        'item_current_bids.current_bid',
        knex.raw('GROUP_CONCAT(DISTINCT item_images.image_url) as image_urls')
      )
      .leftJoin('users', 'items.user_id', 'users.id')
      .leftJoin('item_current_bids', 'items.id', 'item_current_bids.item_id')
      .leftJoin('item_images', 'items.id', 'item_images.item_id')
      .where('items.id', id)
      .groupBy('items.id')
      .first();
    if (!item) {
      return res.status(404).json({ error: 'Auction item not found' });
    }
    // Format the response
    const response = {
      id: item.id,
      title: item.title,
      description: item.description,
      min_price: item.min_price,
      current_bid: item.current_bid || item.min_price,
      authentication_status: item.authentication_status,
      auction_status: item.auction_status,
      seller_name: item.seller_name || "Unknown",
      posting_date: item.created_at,
      end_time: item.end_time,
      images: item.image_urls ? item.image_urls.split(',') : []
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching auction item:', error);
    res.status(500).json({ 
      error: 'Failed to fetch auction details',
      details: error.message 
    });
  }
});

// In your bid placement route
router.post('/:id/bid', async (req, res) => {
  try {
    // Notify previous highest bidder
    if (previousHighestBid) {
      await axios.post('/api/notifications/bid-notification', {
        userId: previousHighestBid.user_id,
        auctionId: req.params.id,
        type: 'outbid'
      });
    }
    // Check if auction is ending soon
    const auction = await knex('items').where('id', req.params.id).first();
    const endTime = new Date(auction.end_time);
    const now = new Date();
    const hoursRemaining = (endTime - now) / (1000 * 60 * 60);
    if (hoursRemaining <= 1) {
      const bidders = await knex('bids')
        .where('item_id', req.params.id)
        .select('user_id')
        .distinct();
      for (const bidder of bidders) {
        await axios.post('/api/notifications/bid-notification', {
          userId: bidder.user_id,
          auctionId: req.params.id,
          type: 'ending_soon'
        });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

// Modify the cron job to include fee notification
cron.schedule('* * * * *', async () => {
  try {
    console.log('Checking and updating expired auctions...');

    await knex.transaction(async (trx) => {
      // Get the current fee structure
      const feeStructure = await trx('posting_fees').first();

      // Find auctions that just ended and have bids
      const endedAuctions = await trx('items')
        .select(
          'items.id',
          'items.user_id as seller_id',
          'users.username as seller_name',
          'item_current_bids.current_bid as final_price'
        )
        .join('users', 'items.user_id', 'users.id')
        .join('item_current_bids', 'items.id', 'item_current_bids.item_id')
        .where('items.end_time', '<=', knex.raw("datetime('now')"))
        .where('items.auction_status', '=', 'Active')
        .whereExists(function () {
          this.select('*')
            .from('bids')
            .whereRaw('bids.item_id = items.id');
        });

      // Process each ended auction
      for (const auction of endedAuctions) {
        // Calculate posting fee
        const postingFee = calculatePostingFee(auction.final_price, feeStructure);

        // Update auction status and store fee
        await trx('items')
          .where('id', auction.id)
          .update({ 
            auction_status: 'Ended - Sold',
            posting_fee: postingFee
          });

        // Send notifications
        await trx('notifications').insert([
          {
            user_id: auction.seller_id,
            type: 'auction_ended',
            message: `Your auction has ended with a final price of £${auction.final_price.toFixed(2)}`,
            auction_id: auction.id,
            created_at: knex.fn.now()
          },
          {
            user_id: auction.seller_id,
            type: 'posting_fee',
            message: `Your posting fee for this auction is £${postingFee.toFixed(2)}`,
            auction_id: auction.id,
            created_at: knex.fn.now()
          }
        ]);
      }

      // Update unsold auctions (no change needed here)
      await trx('items')
        .where('end_time', '<=', knex.raw("datetime('now')"))
        .where('auction_status', '=', 'Active')
        .whereNotExists(function () {
          this.select('*')
            .from('bids')
            .whereRaw('bids.item_id = items.id');
        })
        .update({ auction_status: 'Ended - Unsold' });
    });

    console.log('Expired auctions and notifications updated successfully.');
  } catch (error) {
    console.error('Error updating auction statuses and sending notifications:', error);
  }
});

module.exports = router;
