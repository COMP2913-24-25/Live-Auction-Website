const express = require('express');
const router = express.Router();
const knex = require('../db');
const { connectionConfig } = require('../database/knex');

// Initialize function - check and create necessary table fields
const initializeBidsRoutes = async () => {
  try {
    console.log('Initializing bids routes and checking database structure');
    
    // Check the database connection
    const dbTest = await knex.raw('SELECT 1 as result');
    console.log('Database connection test:', dbTest);
    
    // Check the items table structure
    const hasCurrentBid = await knex.schema.hasColumn('items', 'current_bid');
    const hasLastBidTime = await knex.schema.hasColumn('items', 'last_bid_time');
    
    if (!hasCurrentBid) {
      console.log('Adding current_bid column to items table');
      await knex.schema.table('items', table => {
        table.decimal('current_bid', 10, 2).defaultTo(0);
      });
    }
    
    if (!hasLastBidTime) {
      console.log('Adding last_bid_time column to items table');
      await knex.schema.table('items', table => {
        table.timestamp('last_bid_time').nullable();
      });
    }
    
    // Ensure the default user exists
    const defaultUserExists = await knex('users')
      .where({ id: 1 })
      .first();

    if (!defaultUserExists) {
      console.log('Creating default user for bid operations');
      try {
        await knex('users').insert({
          id: 1,
          username: 'DefaultUser',
          email: 'default@example.com',
          password_hash: 'defaultpassword',
          created_at: knex.fn.now()
        });
        console.log('Default user created successfully');
      } catch (userError) {
        console.error('Error creating default user:', userError);
      }
    }
    
    console.log('Bids routes initialized successfully');
  } catch (e) {
    console.error('Error initializing bids routes:', e);
  }
};

// Call the initialization function without blocking the route loading
initializeBidsRoutes().catch(err => console.error('Failed to initialize bids routes:', err));

// Completely replace the existing POST route
router.post('/', async (req, res) => {
  try {
    console.log('Bid request received:', req.body);
    
    const { item_id, bid_amount } = req.body;
    const user_id = req.user?.id || 1; // Fallback to default user if not authenticated

    if (!item_id || !bid_amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get the item information
    const item = await knex('items')
      .where('id', item_id)
      .first();

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Check if auction is still active
    if (item.auction_status !== 'Active') {
      return res.status(400).json({
        success: false,
        error: 'This auction is no longer active'
      });
    }

    // Check if bid is high enough
    const currentBid = item.current_bid || item.min_price;
    if (bid_amount <= currentBid) {
      return res.status(400).json({
        success: false,
        error: `Bid must be higher than current price £${currentBid}`
      });
    }

    // Begin transaction
    const trx = await knex.transaction();

    try {
      // Update item current price
      await trx('items')
        .where('id', item_id)
        .update({
          current_bid: bid_amount,
          last_bid_time: trx.fn.now()
        });

      // Record the bid
      await trx('bids').insert({
        user_id,
        item_id,
        bid_amount,
        bid_time: trx.fn.now()
      });

      await trx.commit();

      res.json({
        success: true,
        message: 'Bid placed successfully',
        current_bid: bid_amount
      });
    } catch (trxError) {
      await trx.rollback();
      throw trxError;
    }
  } catch (error) {
    console.error('Bid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bid. Please try again.'
    });
  }
});

// Get the item bid history
router.get('/history/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log('Fetching bid history for item ID:', itemId);

    // Use the Knex query builder instead of raw SQL
    try {
      const bids = await knex('bids')
        .select('bids.id', 'bids.user_id', 'bids.item_id', 'bids.bid_amount', 'bids.bid_time', 'users.username')
        .leftJoin('users', 'bids.user_id', 'users.id') 
        .where('bids.item_id', itemId)
        .orderBy('bids.bid_time', 'desc');

      console.log('Query result:', bids);
      
      res.json({
        success: true,
        bids: bids
      });
    } catch (joinError) {
      console.error('Join query failed, falling back to simpler query:', joinError);
      
      // Backup方案：只从bids表获取数据
      const simpleBids = await knex('bids')
        .select('*')
        .where('item_id', itemId)
        .orderBy('bid_time', 'desc');
        
      console.log('Simple query result:', simpleBids);
      
      // Add a default username for each record
      const bidsWithUsername = simpleBids.map(bid => ({
        ...bid,
        username: 'User ' + bid.user_id
      }));
      
      res.json({
        success: true,
        bids: bidsWithUsername
      });
    }
  } catch (error) {
    console.error('Error fetching bid history:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'An error occurred while retrieving bid history'
    });
  }
});

// Test route
router.get('/test', async (req, res) => {
  try {
    // Test the database connection
    const testResult = await knex.raw('SELECT 1+1 as result');
    const dbConnected = testResult ? true : false;
    
    // Test if the bids table exists
    let bidsTableExists = false;
    try {
      await knex.schema.hasTable('bids').then(exists => {
        bidsTableExists = exists;
      });
    } catch (tableError) {
      console.error('Error checking bids table:', tableError);
    }
    
    res.json({
      success: true,
      message: 'Bids API is working!',
      dbConnected,
      bidsTableExists,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test database route
router.get('/db-test', async (req, res) => {
  try {
    // Test the database connection
    const dbResult = await knex.raw('SELECT 1 as result');
    
    // Get all table names
    const tables = await knex.raw("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    
    // Check the bids table
    let bidsColumns = [];
    if (tableNames.includes('bids')) {
      const columnInfo = await knex('bids').columnInfo();
      bidsColumns = Object.keys(columnInfo);
    }
    
    // Check the items table
    let itemsColumns = [];
    if (tableNames.includes('items')) {
      const columnInfo = await knex('items').columnInfo();
      itemsColumns = Object.keys(columnInfo);
    }
    
    res.json({
      success: true,
      dbConnection: !!dbResult,
      dbResult,
      tables: tableNames,
      bidsTable: {
        exists: tableNames.includes('bids'),
        columns: bidsColumns
      },
      itemsTable: {
        exists: tableNames.includes('items'),
        columns: itemsColumns
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 获取所有出价
router.get('/', async (req, res) => {
  try {
    const bids = await knex('bids')
      .select('*');
    res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

module.exports = router;