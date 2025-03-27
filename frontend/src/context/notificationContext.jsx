import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';  // Use the configured axios instance
import { useAuth } from './authContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const updateUnreadCount = (notifs) => {
    const count = notifs.filter(n => !n.read).length;
    setUnreadCount(count);
    // Update favicon badge if needed
    if (count > 0) {
      document.title = `(${count}) Auction Site`;
    } else {
      document.title = 'Auction Site';
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data } = await axios.get(`/api/notifications/${user.id}`);
      
      const formattedNotifications = data.map(notification => ({
        ...notification,
        image_urls: notification.image_urls 
          ? Array.isArray(notification.image_urls)
            ? notification.image_urls
            : notification.image_urls.split(',')
          : [],
        current_bid: parseFloat(notification.current_bid || notification.min_price)
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      if (!user) return;
      
      await axios.put(`/api/notifications/${notificationId}/read`);
      
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      if (!user) return;
      
      await axios.delete(`/api/notifications/${notificationId}`);
      
      setNotifications(notifications.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const formatNotificationMessage = (notification) => {
    const { type, auction_title } = notification;
    
    // Expert-specific notifications
    if (user?.role === 2) {
      switch(type) {
        case 'review_request':
          return `New authentication request for "${auction_title}"`;
        case 'review_reminder':
          return `Reminder: Authentication pending for "${auction_title}"`;
        case 'review_reassigned':
          return `You have been assigned to review "${auction_title}"`;
        case 'review_completed':
          return `Review completed for "${auction_title}"`;
        default:
          break;
      }
    }

    // Regular user notifications
    switch(type) {
      // ... existing notification types ...
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
  
      // Handle expert notifications
      if (notification.type.startsWith('review_')) {
        navigate(`/expert-dashboard/pending/${notification.auction_id}`);
        return;
      }
  
      // Handle regular auction notifications
      if (notification.auction_id) {
        navigate(`/auctions/${notification.auction_id}`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    updateUnreadCount(notifications);
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      deleteNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}