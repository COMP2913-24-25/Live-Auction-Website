const express = require('express');
const knex = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let { 
      query, 
      categories, 
      minPrice, 
      maxPrice, 
      authenticatedOnly,
      daysRemaining,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Convert string parameters to proper types
    minPrice = minPrice ? parseFloat(minPrice) : null;
    maxPrice = maxPrice ? parseFloat(maxPrice) : null;
    daysRemaining = daysRemaining ? parseInt(daysRemaining) : null;

    let queryBuilder = knex('items as i')
      .select(
        'i.*',
        'u.username as seller_name',
        'c.name as category_name',
        knex.raw('GROUP_CONCAT(DISTINCT ii.image_url) as image_urls'),
        knex.raw('COALESCE(MAX(b.bid_amount), i.min_price) as current_bid') // Changed from b.amount to b.bid_amount
      )
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('categories as c', 'i.category_id', 'c.id')
      .leftJoin('item_images as ii', 'i.id', 'ii.item_id')
      .leftJoin('bids as b', 'i.id', 'b.item_id')
      .where('i.auction_status', 'Active')
      .groupBy('i.id');

    // Apply all filters
    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : [categories];
      queryBuilder.whereIn('i.category_id', categoryArray);
    }

    if (query) {
      queryBuilder.where(builder => 
        builder.whereRaw('LOWER(i.title) LIKE ?', [`%${query.toLowerCase()}%`])
               .orWhereRaw('LOWER(i.description) LIKE ?', [`%${query.toLowerCase()}%`])
      );
    }

    if (minPrice) queryBuilder.having('current_bid', '>=', minPrice);
    if (maxPrice) queryBuilder.having('current_bid', '<=', maxPrice);
    if (authenticatedOnly === 'true') queryBuilder.where('i.authentication_status', 'Approved');
    
    if (daysRemaining) {
      queryBuilder
        .where('i.end_time', '>', knex.raw('datetime("now")'))
        .where('i.end_time', '<=', knex.raw(`datetime("now", "+${daysRemaining} days")`));
    }

    // Apply sorting
    const validSortFields = ['created_at', 'end_time', 'min_price', 'current_bid'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (sortField === 'current_bid') {
      queryBuilder.orderByRaw(`COALESCE(MAX(b.bid_amount), i.min_price) ${sortOrder}`); // Changed from b.amount to b.bid_amount
    } else {
      queryBuilder.orderBy(`i.${sortField}`, sortOrder);
    }

    const results = await queryBuilder;

    // Format the results to handle image_urls properly
    const formattedResults = results.map(item => ({
      ...item,
      image_urls: item.image_urls ? item.image_urls.split(',') : [],
      current_bid: parseFloat(item.current_bid || item.min_price)
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

module.exports = router;