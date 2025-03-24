import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ConversationList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!user || !localStorage.getItem('user')) {
          console.log('User not logged in or no token, not fetching conversations');
          return;
        }

        let token;
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          token = userData?.token;
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }

        if (!token) {
          console.error('Authentication token not found');
          return;
        }

        console.log('Fetching conversation list, token:', token ? 'exists' : 'not found');

        const response = await axios.get('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data.success) {
          setConversations(response.data.conversations);
        } else {
          setError(response.data.error || 'Failed to load conversation list');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversation list:', err);
        setError('Failed to load conversation list');
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p className="text-gray-600">Please log in to view messages</p>
        <Link to="/login" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          Login
        </Link>
      </div>
    );
  }

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <h2 className="p-4 bg-gray-100 font-semibold border-b">My Conversations</h2>

      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No conversation history
        </div>
      ) : (
        <div className="divide-y">
          {conversations.map(conversation => {
            const otherUser = conversation.other_user || {};
            const lastMessage = conversation.last_message || {};
            const hasUnread = lastMessage.receiver_id === user.id && !lastMessage.is_read;

            return (
              <Link 
                key={conversation.id} 
                to={`/messages/${conversation.id}`}
                className={`block p-4 hover:bg-gray-50 ${hasUnread ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mr-3">
                    {otherUser.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
                  </div>

                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{otherUser.username || 'Unknown User'}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(lastMessage.created_at || conversation.last_message_time).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate mt-1">
                      {lastMessage.content || 'No messages'}
                    </p>
                  </div>

                  {hasUnread && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full ml-2 mt-2"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
