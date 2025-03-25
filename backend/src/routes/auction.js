const express = require('express');
const knex = require('../db'); // Assuming you have a Knex setup in db/knex.js
const router = express.Router();
const cron = require('node-cron');
const { sendWinningBidEmail } = require('./email');

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
    const auctionId = req.params.id;
    
    // 获取拍卖项目的基本信息
    const query = knex('items as i')
      .select(
        'i.*',
        'u.username as seller_name',
        'c.name as category_name'
      )
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('categories as c', 'i.category_id', 'c.id')
      .where('i.id', auctionId)
      .first();
    
    const auction = await query;
    
    if (!auction) {
      return res.status(404).json({ error: 'The auction item does not exist' });
    }
    
    // 获取当前最高出价
    const highestBid = await knex('bids')
      .where('item_id', auctionId)
      .orderBy('bid_amount', 'desc')
      .first();
    
    // 设置当前出价，如果没有出价则使用最低价
    auction.current_bid = highestBid ? highestBid.bid_amount : auction.min_price;
    
    // 获取拍卖项目的图片
    const images = await knex('item_images')
      .select('image_url')
      .where('item_id', auctionId);
      
    auction.images = images.map(img => img.image_url);
    
    return res.json(auction);
  } catch (error) {
    console.error('Error obtaining auction item details:', error);
    return res.status(500).json({ error: 'Server error, unable to obtain auction item details' });
  }
});

// Runs every minute to check for expired auctions
cron.schedule('* * * * *', async () => {
  try {
    console.log('Checking and updating expired auctions...');

    await knex.transaction(async (trx) => {
      // 找到刚刚结束的拍卖
      const endedAuctions = await trx('items')
        .where('end_time', '<=', knex.raw("datetime('now')"))
        .where('auction_status', '=', 'Active')
        .whereExists(function () {
          this.select('*')
            .from('bids')
            .whereRaw('bids.item_id = items.id');
        });

      for (const auction of endedAuctions) {
        // 获取最高出价者信息
        const winningBid = await trx('bids')
          .select('bids.*', 'users.email')
          .join('users', 'bids.user_id', 'users.id')
          .where('item_id', auction.id)
          .orderBy('bid_amount', 'desc')
          .first();

        if (winningBid) {
          // 更新拍卖状态
          await trx('items')
            .where('id', auction.id)
            .update({ auction_status: 'Ended - Sold' });

          // 发送获胜邮件
          await sendWinningBidEmail(
            winningBid.email,
            auction.title,
            winningBid.bid_amount
          );
        } else {
          // 如果没有出价，标记为流拍
          await trx('items')
            .where('id', auction.id)
            .update({ auction_status: 'Ended - Unsold' });
        }
      }
    });

    console.log('Expired auctions updated successfully.');
  } catch (error) {
    console.error('Error updating auction statuses:', error);
  }
});

// 添加一个简单的POST路由来处理/api/auctions请求
// 这个路由将转发请求到/api/upload/create-listing
router.post('/', (req, res) => {
  console.log('Received POST /api/auctions request, forwarding to /api/upload/create-listing');
  
  // 这个路由应该检查请求是否包含文件，如果包含，应该返回指导信息
  if (req.files && req.files.length > 0) {
    return res.status(400).json({
      error: 'File upload should not be handled by this route, please use /api/upload/create-listing',
      correctEndpoint: '/api/upload/create-listing'
    });
  }
  
  // 如果前端代码尝试直接POST到/api/auctions，我们可以返回清晰的错误信息
  res.status(400).json({
    error: 'To create an auction item, you need to upload an image, please use /api/upload/create-listing interface',
    correctEndpoint: '/api/upload/create-listing'
  });
});

module.exports = router;
