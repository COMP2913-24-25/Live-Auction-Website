require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const express = require('express');
const knex = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 自定义认证中间件，确保使用正确的SECRET_KEY
const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Authentication Header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token && !req.body.user_id) {
      console.log('Authentication failed: No token or user ID provided');
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    
    if (token) {
      try {
        // 确保使用与路由相同的SECRET_KEY
        const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
        console.log('The JWT key used:', SECRET_KEY.substring(0, 3) + '...[hidden]');
        
        const user = jwt.verify(token, SECRET_KEY);
        console.log('Token verified successfully, user ID:', user.id);
        req.user = user;
        next();
      } catch (tokenError) {
        console.log('Token verification error:', tokenError);
        
        // 开发环境降级处理
        if (process.env.NODE_ENV !== 'production' && req.body.user_id) {
          console.log('Token verification failed, using the validated request body user ID:', req.body.user_id);
          req.user = { id: parseInt(req.body.user_id) };
          next();
          return;
        }
        
        return res.status(403).json({ error: 'Invalid token', details: tokenError.message });
      }
    } else if (req.body.user_id) {
      // 开发环境降级处理
      if (process.env.NODE_ENV !== 'production') {
        console.log('No token, using the request body user ID:', req.body.user_id);
        req.user = { id: parseInt(req.body.user_id) };
        next();
        return;
      }
      
      return res.status(401).json({ error: 'No authentication token provided' });
    }
  } catch (error) {
    console.error('Error during authentication processing:', error);
    return res.status(500).json({ error: 'Error during authentication processing', details: error.message });
  }
};

// 提交新出价
router.post('/', authenticateUser, async (req, res) => {
  try {
    // 从请求体获取数据
    const { item_id, bid_amount, user_id } = req.body;
    // 优先使用验证后的用户ID，如果没有则使用请求体中的
    const bidder_id = req.user ? req.user.id : user_id;
    
    // 记录请求数据
    console.log('Received bid request:', {
      user_id: bidder_id,
      item_id,
      bid_amount
    });
    
    // 验证必要的参数是否存在
    if (!item_id) {
      return res.status(400).json({ error: 'Missing auction item ID' });
    }
    
    if (!bid_amount) {
      return res.status(400).json({ error: 'Missing bid amount' });
    }
    
    if (!bidder_id) {
      return res.status(400).json({ error: 'Missing user ID' });
    }
    
    // 验证拍卖项目是否存在
    const item = await knex('items').where('id', item_id).first();
    if (!item) {
      return res.status(404).json({ error: 'Auction item does not exist' });
    }
    
    // 获取当前最高出价
    const highestBid = await knex('bids')
      .where('item_id', item_id)
      .orderBy('bid_amount', 'desc')
      .first();
    
    // 验证出价是否高于当前最高出价
    const currentBid = highestBid ? highestBid.bid_amount : (item.min_price || 0);
    if (parseFloat(bid_amount) <= parseFloat(currentBid)) {
      return res.status(400).json({ 
        error: `Bid must be higher than the current highest bid £${currentBid}` 
      });
    }
    
    // 验证用户不是拍卖项目的卖家 - 确保字符串转数字比较
    console.log('Check if it is your own auction:', { 
      item_user_id: item.user_id, 
      bidder_id: bidder_id,
      is_same: Number(item.user_id) === Number(bidder_id)
    });
    
    if (Number(item.user_id) === Number(bidder_id)) {
      return res.status(403).json({ error: 'You cannot bid on your own auction item' });
    }
    
    // 创建新的出价记录
    const [bid_id] = await knex('bids').insert({
      user_id: bidder_id,
      item_id,
      bid_amount,
      bid_time: knex.raw('CURRENT_TIMESTAMP')
    });
    
    // 在发送Socket.io事件时添加更多日志
if (global.io) {
  // 获取用户名
  const bidder = await knex('users').where('id', bidder_id).select('username').first();
  
  const eventData = {
    item_id,
    bid_amount,
    bidder_id,
    bidder_name: bidder?.username || 'Anonymous',
    bid_id,
    timestamp: new Date().toISOString()
  };
  
  console.log('Preparing to send bid_updated event, data:', eventData);
  console.log('Send to room:', `auction_${item_id}`);
  console.log('Number of currently connected clients:', Object.keys(global.io.sockets.sockets).length);
  
  // 向拍卖房间广播新出价
  global.io.to(`auction_${item_id}`).emit('bid_updated', eventData);
  
  // 同时向所有客户端广播，确保主页也能收到更新
  global.io.emit('bid_updated', eventData);
  
  console.log(`Sent 'bid_updated' event to auction_${item_id} and all clients`);
}
    
    // 返回成功响应
    console.log(`Bid saved successfully: ID=${bid_id}, amount=${bid_amount}, user=${bidder_id}`);
    return res.status(201).json({
      id: bid_id,
      user_id: bidder_id,
      item_id,
      bid_amount,
      message: 'Bid successful'
    });
    
  } catch (error) {
    console.error('Bid processing error:', error);
    return res.status(500).json({ 
      error: 'Server error, unable to process bid', 
      details: error.message 
    });
  }
});

// 获取拍卖项目的所有出价
router.get('/auction/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // 验证拍卖项目是否存在
    const item = await knex('items').where('id', itemId).first();
    if (!item) {
      return res.status(404).json({ error: 'Auction item does not exist' });
    }
    
    // 获取所有出价
    const bids = await knex('bids')
      .select('bids.*', 'users.username')
      .join('users', 'bids.user_id', 'users.id')
      .where('bids.item_id', itemId)
      .orderBy('bids.bid_amount', 'desc');
    
    return res.json(bids);
  } catch (error) {
    console.error('Error getting bids:', error);
    return res.status(500).json({ error: 'Server error, unable to get bids' });
  }
});

module.exports = router; 