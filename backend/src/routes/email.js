const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const db = require('../db'); // 数据库连接对象

// 创建邮件传输器 - 使用 Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gmail 邮箱
    pass: process.env.EMAIL_PASSWORD // Gmail 密码或应用专用密码
  }
});

// 添加验证
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection successful');
  }
});

// 发送中标通知邮件
const sendWinningBidEmail = async (userEmail, auctionTitle, finalPrice) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Congratulations! You won the auction!',
      html: `
        <h1>Congratulations!</h1>
        <p>You have won the auction for "${auctionTitle}"</p>
        <p>Final price: £${finalPrice}</p>
        <p>Automatically paid from the account you selected.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Winning bid email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending winning bid email:', error);
    return false;
  }
};

// 测试邮件发送的路由（可选）
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    await sendWinningBidEmail(email, 'Test Item', 100);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// 为当前出价最高的用户发送测试邮件
router.post('/test-highest-bidder/:auctionId', async (req, res) => {
  const { auctionId } = req.params;
  
  try {
    // 获取拍卖信息和最高出价者 - 使用knex查询
    const auctionResult = await db('auctions')
      .leftJoin('users', 'auctions.highest_bidder_id', 'users.id')
      .where('auctions.id', auctionId)
      .select(
        'auctions.*', 
        'users.email', 
        'users.username'
      )
      .first();
    
    if (!auctionResult) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    const auction = auctionResult;
    
    // 检查是否有最高出价者
    if (!auction.highest_bidder_id || !auction.email) {
      return res.status(400).json({ 
        error: 'No highest bidder found for this auction',
        auction: {
          id: auction.id,
          title: auction.title,
          current_bid: auction.current_bid,
          highest_bidder_id: auction.highest_bidder_id || 'None'
        }
      });
    }
    
    // 发送邮件
    const success = await sendWinningBidEmail(
      auction.email,
      auction.title,
      auction.current_bid
    );
    
    if (success) {
      res.json({ 
        message: 'Test winning email sent successfully',
        to: auction.email,
        auction: {
          id: auction.id,
          title: auction.title,
          final_price: auction.current_bid
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Error in test highest bidder route:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// 添加一个获取拍卖的出价历史路由，方便测试
router.get('/auction-bids/:auctionId', async (req, res) => {
  const { auctionId } = req.params;
  
  try {
    // 使用knex查询
    const bidResults = await db('bids')
      .join('users', 'bids.user_id', 'users.id')
      .where('bids.item_id', auctionId)
      .orderBy('bids.bid_amount', 'desc')
      .select(
        'bids.*',
        'users.username',
        'users.email'
      );
    
    res.json({
      auction_id: auctionId,
      bids: bidResults
    });
  } catch (error) {
    console.error('Error fetching auction bids:', error);
    res.status(500).json({ error: 'Failed to fetch auction bids' });
  }
});

// 添加一个基于bids表获取最高出价信息的路由
router.post('/send-to-highest-bidder/:itemId', async (req, res) => {
  const { itemId } = req.params;
  
  try {
    console.log(`Attempting to send email to the highest bidder for item ID=${itemId}`);
    
    // 从bids表获取该商品的最高出价记录 - 使用knex查询
    const highestBid = await db('bids')
      .join('users', 'bids.user_id', 'users.id')
      .leftJoin('items', 'bids.item_id', 'items.id')
      .where('bids.item_id', itemId)
      .orderBy('bids.bid_amount', 'desc')
      .select(
        'bids.*',
        'users.email',
        'users.username',
        'items.title as auction_title'
      )
      .first();
    
    if (!highestBid) {
      return res.status(404).json({ 
        error: 'No bids found for this item',
        item_id: itemId
      });
    }
    
    // 检查是否有邮箱
    if (!highestBid.email) {
      return res.status(400).json({ 
        error: 'Highest bidder has no email address',
        user_id: highestBid.user_id,
        username: highestBid.username
      });
    }
    
    console.log(`Found the highest bid: User ID=${highestBid.user_id}, email=${highestBid.email}, bid amount=${highestBid.bid_amount}`);
    
    // 发送邮件
    const success = await sendWinningBidEmail(
      highestBid.email,
      highestBid.auction_title || `Auction #${itemId}`, // 如果没有标题就用ID
      highestBid.bid_amount
    );
    
    if (success) {
      res.json({ 
        message: 'Email sent to highest bidder successfully',
        to: highestBid.email,
        username: highestBid.username,
        bid_amount: highestBid.bid_amount,
        item_id: itemId
      });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending email to highest bidder:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = {
  router,
  sendWinningBidEmail
}; 