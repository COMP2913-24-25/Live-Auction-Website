import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

// Create axios instance with proper config
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      console.log('Fetching notifications for user:', user.id);
      const { data } = await api.get(`/api/auctions/active`);
      
      // Only accept notifications with valid types
      const validNotifications = data.filter(n => 
        n.type && ['outbid', 'won', 'ending_soon', 'ended'].includes(n.type)
      );
      
      console.log('Received notifications:', validNotifications);
      setNotifications(validNotifications);
      setUnreadCount(validNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      if (!user) return;
      
      await api.put(`/api/notifications/${notificationId}/read`);
      
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
      
      await api.delete(`/api/notifications/${notificationId}`);
      
      setNotifications(notifications.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Force clear notifications
  const clearAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

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