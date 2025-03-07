import { useEffect, useState, useRef } from 'react';


function NotificationBell() {
    const [isNewNotification, setIsNewNotification] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notificationRef = useRef(null);

    useEffect(() => {
        // Fetch notifications from the backend using the correct endpoint
        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auction/active`);
                const data = await response.json();
                if (data.length > notifications.length) {
                    setIsNewNotification(true);
                }
                setNotifications(data); //assign data
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [notifications.length]);


    return (
        <>
            {/* Notification Details Display */}
            <div className="p-4">
                {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4 mb-4 shadow-lg bg-white">
                        <h2 className="text-xl font-semibold">{notification.title}</h2>
                        <p className="text-gray-500">Seller: {notification.seller_name}</p>
                        <div className="flex gap-4 my-4">
                            <div className="flex flex-wrap gap-2">
                                <p className="font-semibold">Item Images:</p>
                                {notification.image_urls?.split(',').map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`Item image ${index + 1}`}
                                        className="w-24 h-24 object-cover border"
                                    />
                                ))}
                            </div>
                            <div className="flex-1">
                                <p><strong>Description:</strong> {notification.description}</p>
                                <p><strong>Minimum Price:</strong> ${notification.min_price}</p>
                                <p><strong>End Time:</strong> {notification.end_time}</p>
                                <div className="flex gap-2 mt-4">
                                    <button className="px-4 py-2 bg-red-500 text-white rounded-md">Reject</button>
                                    <button className="px-4 py-2 bg-black text-white rounded-md">Approve</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default NotificationBell;
