import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function NotificationBell() {
    
    const { user } = useAuth(); 
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchAssignedItems = async () => {
            try {
                // Fetch all authentication requests assigned to the logged-in expert
                const response = await axios.get('/api/manager/authentication-requests/check-updates');
                const { updateInfo } = response.data;


                const itemPromises = updateInfo
                    .filter((request) => request.expert_id === user.id) // Match expert_id with user.id
                    .map(async (request) => {
                        const { item_id } = request;
                        try {
                            const itemResponse = await axios.get(`/api/auctions/${item_id}`);
                            return itemResponse.data; // Return the auction item data
                        } catch (error) {
                            console.error(`Failed to fetch item ID ${item_id}:`, error);
                            return null;
                        }
                    });

                // Resolve all promises and filter out null responses
                const items = await Promise.all(itemPromises);
                setNotifications((prev) => [...prev, ...items.filter(Boolean)]);
            } catch (error) {
                console.error('Error fetching assigned requests:', error);
            }
        };

        if (user?.id) {
            fetchAssignedItems();
        }
    }, [user?.id]);

    const handleRequestAction = async (itemId, status) => {
        try {
            await axios.put('/api/manager/authentication-requests/completed', {
                item_id: itemId,
                status: status,
            });
            alert(`Item ${status} successfully!`);
            
            // Optionally, refresh the notifications list or remove the item
            setNotifications((prev) => prev.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error(`Failed to ${status} item ID ${itemId}:`, error);
            alert('Failed to update item status. Please try again.');
        }
    };


    return (

    <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Item Authentication Requests</h1>
            {notifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notifications.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
                        <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <div className="mb-2">
                            <strong>Current Bid:</strong> ${item.current_bid}<br />
                            <strong>Minimum Price:</strong> ${item.min_price}<br />
                            <strong>End Time:</strong> {new Date(item.end_time).toLocaleString()}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {item.images && item.images.length > 0 ? (
                                item.images.map((imageUrl, index) => (
                                    <img
                                        key={index}
                                        src={imageUrl}
                                        alt={`Item ${item.id} Image ${index + 1}`}
                                        className="w-24 h-24 object-cover border rounded-md"
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500">No images available</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => handleRequestAction(item.id, 'Rejected')}
                                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleRequestAction(item.id, 'Approved')}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">No notifications available.</p>
            )}
    </div>

    
    );
}

export default NotificationBell;
