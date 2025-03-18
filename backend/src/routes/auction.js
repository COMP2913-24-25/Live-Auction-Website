const express = require('express');
const knex = require('../db'); // Assuming you have a Knex setup in db/knex.js
const router = express.Router();
const cron = require('node-cron');

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
  const { id } = req.params;

  try {
    const auction = await knex('items as i')
      .select(
        'i.id',
        'i.title',
        'i.description',
        'i.min_price',
        'i.authentication_status',
        'i.auction_status',
        'i.end_time',
        'i.min_price as current_bid'
      )
      .where('i.id', id)
      .first();

    if (!auction) {
      return res.status(404).json({ error: 'Auction item not found' });
    }

    const seller = await knex('items')
      .select('users.id AS seller_id', 'users.username AS seller_name', 'items.created_at')
      .join('users', 'items.user_id', 'users.id')
      .where('items.id', id)
      .first();

    const images = await knex('item_images')
      .select('image_url')
      .where({ item_id: id });

    res.json({
      ...auction,
      seller_id: seller?.seller_id,
      seller_name: seller?.seller_name || "Unknown",
      posting_date: seller?.created_at || "Unknown",
      images: images.map(img => img.image_url)
    });
  } catch (error) {
    console.error('Error fetching auction item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Runs every minute to check for expired auctions
cron.schedule('* * * * *', async () => {
  try {
    console.log('Checking and updating expired auctions...');

    await knex.transaction(async (trx) => {
      // Update auctions that have ended but have bids
      await trx('items')
        .where('end_time', '<=', knex.raw("datetime('now')"))
        .where('auction_status', '=', 'Active')
        .whereNotExists(function () {
          this.select('*')
            .from('bids')
            .whereRaw('bids.item_id = items.id');
        })
        .update({ auction_status: 'Ended - Unsold' });

      // Update auctions that have ended and have at least one bid
      await trx('items')
        .where('end_time', '<=', knex.raw("datetime('now')"))
        .where('auction_status', '=', 'Active')
        .whereExists(function () {
          this.select('*')
            .from('bids')
            .whereRaw('bids.item_id = items.id');
        })
        .update({ auction_status: 'Ended - Sold' });
    });

    console.log('Expired auctions updated successfully.');
  } catch (error) {
    console.error('Error updating auction statuses:', error);
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
