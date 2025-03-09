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
                const response = await axios.get('/api/manager/authentication-requests/assign');
                const assignedRequests = response.data;

                const itemPromises = assignedRequests
                    .filter((request) => request.expert_id === user.id) // Match expert_id with user.id
                    .map(async (request) => {
                        const { item_id } = request;
                        try {
                            const itemResponse = await axios.get(`/api/auction/${item_id}`);
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


    return (

        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Notification Center</h2>
            {notifications.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border">Item ID</th>
                            <th className="py-2 px-4 border">Title</th>
                            <th className="py-2 px-4 border">Description</th>
                            <th className="py-2 px-4 border">Current Bid</th>
                            <th className="py-2 px-4 border">Minimum Price</th>
                            <th className="py-2 px-4 border">End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notifications.map((item) => (
                            <tr key={item.id} className="odd:bg-gray-100">
                                <td className="py-2 px-4 border">{item.id}</td>
                                <td className="py-2 px-4 border">{item.title}</td>
                                <td className="py-2 px-4 border">{item.description}</td>
                                <td className="py-2 px-4 border">{item.current_bid}</td>
                                <td className="py-2 px-4 border">{item.min_price}</td>
                                <td className="py-2 px-4 border">{new Date(item.end_time).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No notifications available.</p>
            )}
        </div>

        // <>
        //     {/* Notification Details Display */}
        //     <div className="p-4">
        //         {notifications.map((notification) => (
        //             <div key={notification.id} className="border rounded-lg p-4 mb-4 shadow-lg bg-white">
        //                 <h2 className="text-xl font-semibold">{notification.title}</h2>
        //                 <p className="text-gray-500">Seller: {notification.seller_name}</p>
        //                 <div className="flex gap-4 my-4">
        //                     <div className="flex flex-wrap gap-2">
        //                         <p className="font-semibold">Item Images:</p>
        //                         {notification.image_urls?.split(',').map((url, index) => (
        //                             <img
        //                                 key={index}
        //                                 src={url}
        //                                 alt={`Item image ${index + 1}`}
        //                                 className="w-24 h-24 object-cover border"
        //                             />
        //                         ))}
        //                     </div>
        //                     <div className="flex-1">
        //                         <p><strong>Description:</strong> {notification.description}</p>
        //                         <p><strong>Minimum Price:</strong> ${notification.min_price}</p>
        //                         <p><strong>End Time:</strong> {notification.end_time}</p>
        //                         <div className="flex gap-2 mt-4">
        //                             <button className="px-4 py-2 bg-red-500 text-white rounded-md">Reject</button>
        //                             <button className="px-4 py-2 bg-black text-white rounded-md">Approve</button>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>
        //         ))}
        //     </div>
        // </>
    );
}

export default NotificationBell;
