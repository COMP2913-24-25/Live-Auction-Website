import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MessagePage = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockMessages, setMockMessages] = useState([]);

  // Get conversation information and message history
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mockMode = searchParams.get('mock') === 'true';
    setIsMockMode(mockMode);
    
    if (mockMode) {
      // Gets mock session data from localStorage
      try {
        const mockConversations = JSON.parse(localStorage.getItem('mockConversations')) || [];
        const mockConversation = mockConversations.find(c => c.id === Number(conversationId));
        
        if (mockConversation) {
          setMockMessages(mockConversation.messages || []);
          // Set other necessary states...
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to read mock conversation data:', e);
      }
    } else {
      const fetchConversation = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/conversations/${conversationId}/messages`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.data.success) {
            setMessages(response.data.messages);
            setConversation(response.data.conversation);
            
            // Determine the other party user in the conversation
            const otherUserId = user.id === response.data.conversation.user_id
              ? response.data.conversation.expert_id
              : response.data.conversation.user_id;
            
            // Get the other party user information
            try {
              const userResponse = await axios.get(`/api/users/${otherUserId}`);
              if (userResponse.data.success) {
                setOtherUser(userResponse.data.user);
              } else {
                // Use default values instead of failed user information request
                console.log('Using default user information');
                setOtherUser({
                  id: otherUserId,
                  username: otherUserId === response.data.conversation.expert_id ? 'Expert User' : 'Regular User',
                  role: otherUserId === response.data.conversation.expert_id ? 2 : 1
                });
              }
            } catch (userErr) {
              console.error('Failed to get user information, using default values:', userErr);
              setOtherUser({
                id: otherUserId,
                username: otherUserId === response.data.conversation.expert_id ? 'Expert User' : 'Regular User',
                role: otherUserId === response.data.conversation.expert_id ? 2 : 1
              });
            }
          } else {
            setError(response.data.error || 'Failed to get conversation information');
          }
        } catch (err) {
          console.error('Failed to get conversation information:', err);
          setError('Failed to load conversation content');
        } finally {
          setLoading(false);
        }
      };

      if (user && conversationId) {
        fetchConversation();
      }
    }
  }, [conversationId, user]);

  // Automatically scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    if (isMockMode) {
      // Handle simulated message sending
      const newMockMessage = {
        id: Date.now(),
        conversation_id: Number(conversationId),
        sender_id: user?.id || 1,
        receiver_id: otherUser?.id || 2,
        content: newMessage,
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      // Update local state
      setMockMessages([...mockMessages, newMockMessage]);
      setNewMessage('');
      
      // Update mock data in localStorage
      try {
        const mockConversations = JSON.parse(localStorage.getItem('mockConversations')) || [];
        const updatedMockConversations = mockConversations.map(c => {
          if (c.id === Number(conversationId)) {
            return {
              ...c,
              messages: [...(c.messages || []), newMockMessage]
            };
          }
          return c;
        });
        localStorage.setItem('mockConversations', JSON.stringify(updatedMockConversations));
      } catch (e) {
        console.error('Failed to update mock conversation data:', e);
      }
      
      // Simulate a delay and add an automatic reply
      setTimeout(() => {
        const autoReply = {
          id: Date.now() + 1,
          conversation_id: Number(conversationId),
          sender_id: otherUser?.id || 2,
          receiver_id: user?.id || 1,
          content: 'Hello, I have received your consultation. What can I help you with?',
          created_at: new Date().toISOString(),
          is_read: false
        };
        
        setMockMessages(prev => [...prev, autoReply]);
        
        // Also update localStorage
        try {
          const mockConversations = JSON.parse(localStorage.getItem('mockConversations')) || [];
          const updatedMockConversations = mockConversations.map(c => {
            if (c.id === Number(conversationId)) {
              return {
                ...c,
                messages: [...(c.messages || []), autoReply]
              };
            }
            return c;
          });
          localStorage.setItem('mockConversations', JSON.stringify(updatedMockConversations));
        } catch (e) {
          console.error('Failed to update mock conversation data:', e);
        }
      }, 1000);
      
      return;
    }
    
    if (!newMessage.trim() || !user || !otherUser) return;
    
    try {
      setSending(true);
      
      const response = await axios.post('/api/messages', {
        conversation_id: conversationId,
        receiver_id: otherUser.id,
        content: newMessage
      });
      
      if (response.data.success) {
        setMessages([...messages, response.data.message]);
        setNewMessage('');
      } else {
        setError(response.data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600 mb-4">Please login to view messages</p>
        <div className="text-center">
          <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
  if (!conversation) return <div className="text-center p-8">Conversation does not exist or cannot be accessed</div>;

  const messagesToDisplay = isMockMode ? mockMessages : messages;

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-md overflow-hidden">
      {/* Conversation header */}
      <div className="bg-gray-100 p-4 border-b flex items-center">
        <Link to="/messages" className="mr-4 text-blue-500 hover:text-blue-700">
          &larr; Back
        </Link>
        
        <div className="flex items-center flex-grow">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3">
            {otherUser?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-medium">{otherUser?.username || 'Unknown user'}</h2>
            <p className="text-xs text-gray-500">
              {otherUser?.role === 2 ? 'Expert' : 'User'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Message list */}
      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {messagesToDisplay.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No messages yet, start sending your first message
          </div>
        ) : (
          <div className="space-y-4">
            {messagesToDisplay.map(message => {
              const isOwnMessage = message.sender_id === user.id;
              console.log('Message:', message, 'Current user:', user.id, 'Is own message:', isOwnMessage);
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs sm:max-w-sm md:max-w-md rounded-lg p-3 ${
                      isOwnMessage 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div>{message.content}</div>
                    <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input box */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter message..."
            className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessagePage; 