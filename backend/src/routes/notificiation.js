const express = require('express');
const knex = require('../db');
const router = express.Router();

const createNotification = async (userId, auctionId, type) => {
  try {
    await knex('notifications').insert({
      user_id: userId,
      auction_id: auctionId,
      type,
      read: false,
      deleted: false,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Get user's notifications 
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const notifications = await knex('notifications')
      .select(
        'notifications.*',
        'items.title as auction_title',
        'items.description as auction_description',
        'items.min_price',
        'items.end_time as auction_end_time',
        'item_current_bids.current_bid',
        knex.raw('GROUP_CONCAT(item_images.image_url) as image_urls')
      )
      .leftJoin('items', 'notifications.auction_id', 'items.id')
      .leftJoin('item_current_bids', 'items.id', 'item_current_bids.item_id')
      .leftJoin('item_images', 'items.id', 'item_images.item_id')
      .where({ 
        'notifications.user_id': userId,
        'notifications.deleted': false 
      })
      .groupBy('notifications.id')
      .orderBy('notifications.created_at', 'desc');
    
    const formattedNotifications = notifications.map(notification => {
      const createdAt = new Date(notification.created_at);
      const now = new Date();
      const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));
      
      let timeAgo;
      if (diffInMinutes < 1) {
        timeAgo = 'Just now';
      } else if (diffInMinutes < 60) {
        timeAgo = `${diffInMinutes}m ago`;
      } else if (diffInMinutes < 1440) {
        timeAgo = `${Math.floor(diffInMinutes / 60)}h ago`;
      } else {
        timeAgo = createdAt.toLocaleDateString();
      }

      let message;
      switch(notification.type) {
        case 'outbid':
          message = `You have been outbid on "${notification.auction_title}"`;
          break;
        case 'won':
          message = `You won the auction for "${notification.auction_title}"`;
          break;
        case 'ending_soon':
          message = `Auction "${notification.auction_title}" is ending in 1 hour`;
          break;
        case 'ended':
          message = `Auction "${notification.auction_title}" has ended`;
          break;
        default:
          message = notification.message;
      }
      
      return {
        ...notification,
        message,
        timeAgo
      };
    }); 

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await knex('notifications')
      .where('id', id)
      .update({ read: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await knex('notifications')
      .where('id', id)
      .update({ deleted: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all notifications
router.delete('/all', async (req, res) => {
  try {
    const userId = req.user.id;
    await knex('notifications').where({ user_id: userId }).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

//route to handle bid notifications
router.post('/bid-notification', async (req, res) => {
  const { userId, auctionId, type } = req.body;
  await createNotification(userId, auctionId, type);
  res.json({ success: true });
});

module.exports = router;