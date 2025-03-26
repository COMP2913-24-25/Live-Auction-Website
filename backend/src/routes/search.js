const express = require('express');
const knex = require('../db');
const router = express.Router();

// Remove '/search' from here since it's already mounted with '/api/search' in app.js
router.get('/', async (req, res) => {
  try {
    const { query, categories, minPrice, maxPrice, authenticatedOnly, daysRemaining } = req.query;

    let queryBuilder = knex('item_current_bids as icb')
      .select(
        'icb.item_id as id',
        'icb.title',
        'icb.description',
        'icb.min_price',
        'icb.end_time',
        'icb.authentication_status',
        'icb.auction_status',
        'icb.current_bid',
        knex.raw('GROUP_CONCAT(DISTINCT ii.image_url) as image_urls'),
        'u.username as seller_name'
      )
      .leftJoin('items as i', 'icb.item_id', 'i.id')
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'icb.item_id', 'ii.item_id')
      .where('icb.auction_status', 'Active')
      .where('icb.end_time', '>', knex.raw("datetime('now')"));

    // Search query
    if (query) {
      queryBuilder.whereRaw('LOWER(icb.title) LIKE ?', [`%${query.toLowerCase()}%`]);
    }

    // Categories filter
    if (categories) {
      const categoryList = categories.split(',');
      queryBuilder.whereIn('i.category_id', categoryList);
    }

    // Price range filter
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      console.log('Filtering by minPrice:', minPriceNum);
      queryBuilder.where('icb.current_bid', '>=', minPriceNum);
    }
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      console.log('Filtering by maxPrice:', maxPriceNum);
      queryBuilder.where('icb.current_bid', '<=', maxPriceNum);
    }

    // Authenticated only
    if (authenticatedOnly === 'true') {
      queryBuilder.where('icb.authentication_status', 'Approved');
    }

    // Time remaining filter
    if (daysRemaining) {
      const timeValue = parseFloat(daysRemaining);
      
      if (timeValue === 1 && req.query.unit === 'hours') {
        // 特殊处理24小时选项
        const secondsRemaining = 24 * 60 * 60;
        queryBuilder.whereRaw(`
          ROUND(
            (JULIANDAY(icb.end_time) - JULIANDAY(datetime('now'))) * 86400
          ) <= ?
        `, [secondsRemaining]);
      } else {
        // 正常处理天数选项
        const secondsRemaining = timeValue * 24 * 60 * 60;
        queryBuilder.whereRaw(`
          ROUND(
            (JULIANDAY(icb.end_time) - JULIANDAY(datetime('now'))) * 86400
          ) BETWEEN 0 AND ?
        `, [secondsRemaining]);
      }
    }

    queryBuilder.groupBy('icb.item_id').orderBy('i.created_at', 'desc');

    // 在查询执行前添加调试信息
    const rawQuery = queryBuilder.toString();
    console.log('Executing SQL:', rawQuery);

    const results = await queryBuilder;

    // 添加调试信息
    console.log(`Found ${results.length} auctions with price filter, first few items:`, 
      results.slice(0, 3).map(item => ({ 
        id: item.id, 
        title: item.title, 
        current_bid: item.current_bid
      }))
    );

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;