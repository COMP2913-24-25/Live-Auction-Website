import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Bell, Check, Clock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Notifications() {
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    if (notification.auction_id) {
      navigate(`/auctions/${notification.auction_id}`);
    }
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

  return (
    <div className="max-w-4xl mx-auto p-4 pt-20">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
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