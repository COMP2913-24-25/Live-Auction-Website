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

    // 构建基础查询
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

    // 应用分类筛选
    if (categories && categories.length > 0) {
      const categoryIds = Array.isArray(categories) 
        ? categories 
        : categories.split(',').map(Number);
      query = query.whereIn('i.category_id', categoryIds);
    }

    // 应用价格范围筛选
    if (minPrice) {
      query = query.where('i.min_price', '>=', minPrice);
    }
    if (maxPrice) {
      query = query.where('i.min_price', '<=', maxPrice);
    }

    // 应用搜索筛选
    if (search) {
      query = query.where(function() {
        this.where('i.title', 'like', `%${search}%`)
            .orWhere('i.description', 'like', `%${search}%`);
      });
    }

    // 应用认证筛选
    if (authenticatedOnly === 'true') {
      query = query.where('i.authentication_status', '=', 'Approved');
    }

    // 应用分组和排序
    query = query
      .groupBy('i.id')
      .orderBy('i.created_at', order.toLowerCase());

    const auctions = await query;

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

// 创建新的拍卖项目
router.post('/', async (req, res) => {
  try {
    console.log('Received auction creation request body:', req.body);
    console.log('Received files:', req.files);
    
    // 从请求中获取数据
    const {
      user_id,
      title,
      description,
      min_price,
      category,
      end_time,
      auction_status
    } = req.body;

    // 创建拍卖项目
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
    
    // 处理图片上传
    if (req.files && req.files.length > 0) {
      console.log('Processing images:', req.files);
      
      // 保存图片 URLs
      await Promise.all(req.files.map(file => {
        // 构建可访问的 URL
        const imageUrl = `${process.env.VITE_API_URL}/uploads/${file.filename}`;
        return knex('item_images').insert({
          item_id: itemId,
          image_url: imageUrl
        });
      }));
    }
    
    // 获取创建的项目数据
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

// 创建新的拍卖项目
router.post('/', async (req, res) => {
  try {
    console.log('Received auction creation request body:', req.body);
    console.log('Received files:', req.files);
    
    // 从请求中获取数据
    const {
      user_id,
      title,
      description,
      min_price,
      category,
      end_time,
      auction_status
    } = req.body;

    // 创建拍卖项目
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
    
    // 处理图片上传
    if (req.files && req.files.length > 0) {
      console.log('Processing images:', req.files);
      
      // 保存图片 URLs
      await Promise.all(req.files.map(file => {
        // 构建可访问的 URL
        const imageUrl = `${process.env.VITE_API_URL}/uploads/${file.filename}`;
        return knex('item_images').insert({
          item_id: itemId,
          image_url: imageUrl
        });
      }));
    }
    
    // 获取创建的项目数据
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
