import { useEffect } from 'react';
import { useNotifications } from '../context/notificationContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Bell, Check, Clock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Notifications() {
  const { notifications, markAsRead, deleteNotification, fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      if (notification.auction_id) {
        navigate(`/auctions/${notification.auction_id}`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'outbid': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'won': return <Check className="h-5 w-5 text-green-500" />;
      case 'ending_soon': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'ended': return <Bell className="h-5 w-5 text-gray-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const renderImages = (imageUrls) => {
    if (!imageUrls) return null;
    
    const urls = Array.isArray(imageUrls) ? imageUrls : imageUrls.split(',');
    
    return (
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {urls.map((url, index) => (
          <img 
            key={index}
            src={url}
            alt={`Auction image ${index + 1}`}
            className="h-20 w-20 object-cover rounded-md"
            onError={(e) => {
              e.target.src = '/placeholder-image.jpg'; // Add a placeholder image
              e.target.onerror = null;
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pt-20">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          {notifications.length > 0 && (
            <button
              onClick={() => notifications.forEach(n => markAsRead(n.id))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="divide-y divide-gray-200">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 flex items-start justify-between gap-4 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-4 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div
                      className="cursor-pointer group"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className="text-gray-900 font-medium group-hover:text-blue-600">
                        {notification.message}
                      </p>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()} at{' '}
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </p>
                        {notification.auction_title && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            View auction details <ArrowRight className="h-4 w-4" />
                          </p>
                        )}
                      </div>
                      {/* Auction Details Card */}
                      <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="font-medium text-gray-900">{notification.auction_title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.auction_description}</p>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Starting Price</p>
                            <p className="font-medium">{formatCurrency(notification.min_price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Current Bid</p>
                            <p className="font-medium">{formatCurrency(notification.current_bid || notification.min_price)}</p>
                          </div>
                        </div>

                        {/* Show auction images if available */}
                        {renderImages(notification.image_urls)}
                        
                        <button 
                          onClick={() => handleNotificationClick(notification)}
                          className="mt-3 w-full flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 p-2 rounded-md transition-colors"
                        >
                          View Auction Details
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications to display</p>
              <p className="text-gray-400 text-sm mt-1">
                New notifications will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}