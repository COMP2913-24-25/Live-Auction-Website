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

const createExpertNotification = async (userId, itemId, type, data = {}) => {
  try {
    const notification = {
      user_id: userId,
      auction_id: itemId,
      type,
      read: false,
      deleted: false,
      created_at: new Date()
    };

    // Add custom message based on type
    switch (type) {
      case 'review_request':
        notification.message = `New authentication request for "${data.itemTitle}"`;
        break;
      case 'review_reminder':
        notification.message = `Reminder: Authentication pending for "${data.itemTitle}"`;
        break;
      case 'review_reassigned':
        notification.message = `You have been assigned to review "${data.itemTitle}"`;
        break;
      default:
        notification.message = data.message || 'New notification';
    }

    await knex('notifications').insert(notification);
  } catch (error) {
    console.error('Error creating expert notification:', error);
    throw error;
  }
};

// Get user's notifications 
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const notifications = await knex('notifications as n')
      .select(
        'n.*',
        'i.title as auction_title',
        'i.description as auction_description',
        'i.min_price',
        'i.end_time as auction_end_time',
        'i.authentication_status',
        'i.auction_status',
        knex.raw('COALESCE(MAX(b.bid_amount), i.min_price) as current_bid'),
        knex.raw(`GROUP_CONCAT(DISTINCT im.image_url) as image_urls`)
      )
      .leftJoin('items as i', 'n.auction_id', 'i.id')
      .leftJoin('bids as b', 'i.id', 'b.item_id')
      .leftJoin('item_images as im', 'i.id', 'im.item_id')
      .where({ 
        'n.user_id': userId,
        'n.deleted': false 
      })
      .groupBy('n.id')
      .orderBy('n.created_at', 'desc');

    const formattedNotifications = notifications.map(notification => {
      // Format time ago
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

      // Format images
      const imageUrls = notification.image_urls 
        ? notification.image_urls.split(',')
        : [];

      // Format notification message
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
        case 'bid_placed':
          message = `Your bid has been placed on "${notification.auction_title}"`;
          break;
        case 'posting_fee':
          message = `Posting fee required for "${notification.auction_title}"`;
          break;
        case 'authentication_requested':
          message = `Authentication requested for "${notification.auction_title}"`;
          break;
        case 'authentication_approved':
          message = `Authentication approved for "${notification.auction_title}"`;
          break;
        case 'authentication_rejected':
          message = `Authentication rejected for "${notification.auction_title}"`;
          break;
        default:
          message = notification.message;
      }

      return {
        ...notification,
        message,
        timeAgo,
        image_urls: imageUrls,
        auction_details: {
          id: notification.auction_id,
          title: notification.auction_title,
          description: notification.auction_description,
          current_bid: parseFloat(notification.current_bid),
          end_time: notification.auction_end_time,
          status: notification.auction_status,
          authentication_status: notification.authentication_status
        }
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
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