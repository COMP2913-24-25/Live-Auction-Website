const express = require('express');
const knex = require('../db');
const router = express.Router();
const cron = require('node-cron');
const { sendWinningBidEmail } = require('./email');
const { calculatePostingFee, deductPostingFee } = require('../utils/feeCalculator');

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

    let auctions = await query;

    // 为每个拍卖获取最高出价
    const auctionIds = auctions.map(auction => auction.id);
    
    // 获取所有拍卖项目的最高出价
    const highestBids = await knex('bids')
      .select('item_id')
      .max('bid_amount as highest_bid')
      .whereIn('item_id', auctionIds)
      .groupBy('item_id');
    
    // 创建一个映射表，方便查找
    const bidMap = {};
    highestBids.forEach(bid => {
      bidMap[bid.item_id] = bid.highest_bid;
    });
    
    // 为每个拍卖添加当前出价
    auctions = auctions.map(auction => {
      return {
        ...auction,
        current_bid: bidMap[auction.id] || auction.min_price // 如果有出价使用最高出价，否则使用最低价
      };
    });

    res.json(auctions);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
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

// Route for placing bids
router.post('/:id/bid', async (req, res) => {
  const trx = await knex.transaction();

  try {
    const { id } = req.params;
    const { user_id, bid_amount } = req.body;

    // Get current highest bid
    const currentHighestBid = await trx('bids')
      .where('item_id', id)
      .orderBy('bid_amount', 'desc')
      .first();

    // Get auction details
    const auction = await trx('items')
      .where('id', id)
      .first();

    if (!auction) {
      throw new Error('Auction not found');
    }

    // Validate bid amount
    const minimumBid = currentHighestBid
      ? currentHighestBid.bid_amount + 5
      : auction.min_price;

    if (bid_amount < minimumBid) {
      throw new Error(`Bid must be at least £${minimumBid}`);
    }

    // Place new bid
    await trx('bids').insert({
      user_id,
      item_id: id,
      bid_amount,
      created_at: knex.fn.now()
    });

    // Notify previous highest bidder if exists
    if (currentHighestBid) {
      await trx('notifications').insert({
        user_id: currentHighestBid.user_id,
        auction_id: id,
        type: 'OUTBID',
        message: `You have been outbid on "${auction.title}". New highest bid: £${bid_amount}`,
        created_at: knex.fn.now()
      });
    }

    // Check if auction is ending soon (within 1 hour)
    const endTime = new Date(auction.end_time);
    const now = new Date();
    const hoursRemaining = (endTime - now) / (1000 * 60 * 60);

    if (hoursRemaining <= 1) {
      // Get all unique bidders
      const bidders = await trx('bids')
        .where('item_id', id)
        .select('user_id')
        .distinct();

      // Notify all bidders about auction ending soon
      for (const bidder of bidders) {
        await trx('notifications').insert({
          user_id: bidder.user_id,
          auction_id: id,
          type: 'ENDING_SOON',
          message: `Auction "${auction.title}" is ending soon! Current highest bid: £${bid_amount}`,
          created_at: knex.fn.now()
        });
      }
    }

    await trx.commit();

    res.json({
      success: true,
      message: 'Bid placed successfully',
      newHighestBid: bid_amount,
      previousHighestBid: currentHighestBid ? currentHighestBid.bid_amount : null
    });

  } catch (error) {
    await trx.rollback();
    console.error('Error placing bid:', error);
    res.status(500).json({
      error: 'Failed to place bid',
      message: error.message
    });
  }
});

// In the cron job section
cron.schedule('* * * * *', async () => {
  try {
    console.log('Checking and updating expired auctions...');

    await knex.transaction(async (trx) => {
      // Find expired auctions
      const expiredAuctions = await trx('items')
        .where('auction_status', 'Active')
        .where('end_time', '<=', knex.fn.now());

      for (const auction of expiredAuctions) {
        const highestBid = await trx('bids')
          .where('item_id', auction.id)
          .orderBy('bid_amount', 'desc')
          .first();

        if (highestBid) {
          try {
            // Deduct posting fee from seller
            const postingFee = await deductPostingFee(
              auction.user_id,
              auction.id,
              highestBid.bid_amount
            );

            // Update auction status and record fee
            await trx('items')
              .where('id', auction.id)
              .update({
                auction_status: 'Ended - Sold',
                final_price: highestBid.bid_amount,
                posting_fee: postingFee
              });

            // Notify seller about fee deduction
            await trx('notifications').insert({
              user_id: auction.user_id,
              type: 'FEE_DEDUCTION',
              message: `A posting fee of £${postingFee.toFixed(2)} has been deducted for your auction "${auction.title}" (final price: £${highestBid.bid_amount.toFixed(2)})`,
              auction_id: auction.id,
              created_at: knex.fn.now()
            });

          } catch (feeError) {
            console.error('Error processing posting fee:', feeError);
          }
        } else {
          await trx('items')
            .where('id', auction.id)
            .update({ auction_status: 'Ended - Unsold' });
        }
      }
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
  
  // 如果前端代码尝试直接POST到/api/auctions，我们可以返回清晰的错误信息
  res.status(400).json({
    error: 'To create an auction item, you need to upload an image, please use /api/upload/create-listing interface',
    correctEndpoint: '/api/upload/create-listing'
  });
});

module.exports = router;
