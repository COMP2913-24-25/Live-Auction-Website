const express = require('express');
const knex = require('../db');
const router = express.Router();
const cron = require('node-cron');
const { calculatePostingFee } = require('../utils/feeCalculator');

// Fetch all active auctions
router.get('/active', async (req, res) => {
  try {
    const {
      sort = 'created_at',
      order = 'desc',
      categories,
      minPrice,
      maxPrice,
      search,
      authenticatedOnly
    } = req.query;

    // Construct the basic query
    let query = knex('items as i')
      .select(
        'i.id',
        'i.title',
        'i.description',
        'i.min_price',
        'i.end_time',
        'i.authentication_status',
        'i.auction_status',
        'i.min_price as current_bid',
        knex.raw('GROUP_CONCAT(ii.image_url) as image_urls'),
        'u.username as seller_name'
      )
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'i.id', 'ii.item_id')
      .where('i.end_time', '>', knex.raw("datetime('now')"))
      .where('i.auction_status', '=', 'Active');

    // Filter categories
    if (categories && categories.length > 0) {
      const categoryIds = Array.isArray(categories)
        ? categories
        : categories.split(',').map(Number);
      query = query.whereIn('i.category_id', categoryIds);
    }

    // Filter price range
    if (minPrice) {
      query = query.where('i.min_price', '>=', minPrice);
    }
    if (maxPrice) {
      query = query.where('i.min_price', '<=', maxPrice);
    }

    // Filter search term
    if (search) {
      query = query.where(function () {
        this.where('i.title', 'like', `%${search}%`)
          .orWhere('i.description', 'like', `%${search}%`);
      });
    }

    // Filter authenticated items
    if (authenticatedOnly === 'true') {
      query = query.where('i.authentication_status', '=', 'Approved');
    }

    // Group and order the results
    query = query
      .groupBy('i.id')
      .orderBy('i.created_at', order.toLowerCase());

    const auctions = await query;

    res.json(auctions);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Failed to fetch active auctions' });
  }
});

// Route to get a single auction item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First fetch the auction details
    const auction = await knex('items as i')
      .select(
        'i.*',
        'u.username as seller_name',
        knex.raw('GROUP_CONCAT(DISTINCT ii.image_url) as image_urls')
      )
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'i.id', 'ii.item_id')
      .where('i.id', id)
      .groupBy('i.id')
      .first();

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Get the highest bid
    const highestBid = await knex('bids')
      .where('item_id', id)
      .orderBy('bid_amount', 'desc')
      .first();

    // Format the response
    const response = {
      ...auction,
      current_bid: highestBid ? highestBid.bid_amount : auction.min_price,
      images: auction.image_urls ? auction.image_urls.split(',') : [],
      seller_name: auction.seller_name || 'Unknown Seller'
    };

    console.log('Sending auction details:', response);
    res.json(response);

  } catch (error) {
    console.error('Error fetching auction:', error);
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

// Remove the second cron job and fix the first one
cron.schedule('* * * * *', async () => {
  try {
    console.log('Checking and updating expired auctions...');

    await knex.transaction(async (trx) => {
      // Find expired auctions
      const expiredAuctions = await trx('items')
        .where('auction_status', 'Active')
        .where('end_time', '<=', knex.fn.now());

      for (const auction of expiredAuctions) {
        // Get highest bid
        const highestBid = await trx('bids')
          .where('item_id', auction.id)
          .orderBy('bid_amount', 'desc')
          .first();

        // Update auction status
        await trx('items')
          .where('id', auction.id)
          .update({
            auction_status: highestBid ? 'Ended - Sold' : 'Ended - Unsold'
          });

        // Create end notification
        await trx('notifications').insert({
          user_id: auction.user_id,
          type: 'ended',
          message: `Your auction has ended with a final price of £${highestBid?.bid_amount || auction.min_price}`,
          auction_id: auction.id,
          created_at: knex.fn.now()
        });

        // If sold, create winner notification
        if (highestBid) {
          await trx('notifications').insert({
            user_id: highestBid.user_id,
            auction_id: auction.id,
            type: 'won',
            message: `You won the auction for "${auction.title}"`
          });
        }
      }

      // Update any remaining unsold auctions
      await trx('items')
        .where('end_time', '<=', knex.fn.now())
        .where('auction_status', 'Active')
        .whereNotExists(function () {
          this.select('*')
            .from('bids')
            .whereRaw('bids.item_id = items.id');
        })
        .update({ auction_status: 'Ended - Unsold' });
    });

    console.log('Auction updates completed successfully');
  } catch (error) {
    console.error('Error updating expired auctions:', error);
  }
});

// Create a new auction item
router.post('/', async (req, res) => {
  try {
    console.log('Received auction creation request body:', req.body);
    console.log('Received files:', req.files);

    // Get data from the request
    const {
      user_id,
      title,
      description,
      min_price,
      category,
      end_time,
      auction_status
    } = req.body;

    // Create the auction item
    const [itemId] = await knex('items').insert({
      user_id,
      title,
      description,
      min_price,
      category_id: category,
      end_time,
      auction_status,
      authentication_status: 'Not Requested',
      created_at: knex.raw("datetime('now')")
    });

    console.log('Created item with ID:', itemId);

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      console.log('Processing images:', req.files);

      // Save image URLs
      await Promise.all(req.files.map(file => {
        // Construct basic image URL
        const imageUrl = `${process.env.VITE_API_URL}/uploads/${file.filename}`;
        return knex('item_images').insert({
          item_id: itemId,
          image_url: imageUrl
        });
      }));
    }

    // Get the created item data
    const createdItem = await knex('items as i')
      .select(
        'i.id',
        'i.title',
        'i.description',
        'i.min_price',
        'i.end_time',
        'i.authentication_status',
        'i.auction_status',
        knex.raw('GROUP_CONCAT(ii.image_url) as image_urls'),
        'u.username as seller_name'
      )
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'i.id', 'ii.item_id')
      .where('i.id', itemId)
      .groupBy('i.id')
      .first();

    console.log('Created item details:', createdItem);

    res.json({ message: 'Auction item created successfully', item: createdItem });
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an existing auction item
router.post('/', async (req, res) => {
  try {
    console.log('Received auction creation request body:', req.body);
    console.log('Received files:', req.files);

    // Get data from the request
    const {
      user_id,
      title,
      description,
      min_price,
      category,
      end_time,
      auction_status
    } = req.body;

    // Create the auction item
    const [itemId] = await knex('items').insert({
      user_id,
      title,
      description,
      min_price,
      category_id: category,
      end_time,
      auction_status,
      authentication_status: 'Not Requested',
      created_at: knex.raw("datetime('now')")
    });

    console.log('Created item with ID:', itemId);

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      console.log('Processing images:', req.files);

      // Save image URLs
      await Promise.all(req.files.map(file => {
        // Construct basic image URL
        const imageUrl = `${process.env.VITE_API_URL}/uploads/${file.filename}`;
        return knex('item_images').insert({
          item_id: itemId,
          image_url: imageUrl
        });
      }));
    }

    // Get the created item data
    const createdItem = await knex('items as i')
      .select(
        'i.id',
        'i.title',
        'i.description',
        'i.min_price',
        'i.end_time',
        'i.authentication_status',
        'i.auction_status',
        knex.raw('GROUP_CONCAT(ii.image_url) as image_urls'),
        'u.username as seller_name'
      )
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'i.id', 'ii.item_id')
      .where('i.id', itemId)
      .groupBy('i.id')
      .first();

    console.log('Created item details:', createdItem);

    res.json({ message: 'Auction item created successfully', item: createdItem });
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
