import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ExpertListPage = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch expert list
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        // Try fetching data from API
        const response = await axios.get('/api/users/experts');

        if (response.data.success) {
          setExperts(response.data.experts);
        } else {
          // If API fails, use mock data
          console.log('Using mock expert data');
          const mockExperts = [
            { id: 1, username: 'Expert Zhang', email: 'zhang@example.com', role: 2, specialization: 'Antique Appraisal' },
            { id: 2, username: 'Expert Li', email: 'li@example.com', role: 2, specialization: 'Art Appraisal' },
            { id: 3, username: 'Expert Wang', email: 'wang@example.com', role: 2, specialization: 'Jewelry Appraisal' }
          ];
          setExperts(mockExperts);
        }
      } catch (err) {
        console.error('Error fetching expert list:', err);
        // Use mock data as fallback
        const mockExperts = [
          { id: 1, username: 'Expert Zhang', email: 'zhang@example.com', role: 2, specialization: 'Antique Appraisal' },
          { id: 2, username: 'Expert Li', email: 'li@example.com', role: 2, specialization: 'Art Appraisal' },
          { id: 3, username: 'Expert Wang', email: 'wang@example.com', role: 2, specialization: 'Jewelry Appraisal' }
        ];
        setExperts(mockExperts);
        setError('');
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);

  // Start new conversation
  const handleStartConversation = async (expertId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Try creating conversation via API
      const response = await axios.post('/api/messages', {
        receiver_id: expertId,
        content: 'Hello, I would like to consult you about something.'
      });

      if (response.data.success) {
        navigate(`/messages/${response.data.conversation_id}`);
      } else {
        throw new Error(response.data.error || 'Failed to create conversation');
      }
    } catch (err) {
      console.error('Failed to create conversation via API, using mock fallback:', err);

      // Use mock fallback to create conversation for demo
      const mockConversationId = Math.floor(Math.random() * 10000) + 1;

      // You may choose to store some temporary conversation data to localStorage
      const mockConversation = {
        id: mockConversationId,
        expert_id: expertId,
        user_id: user?.id || 1,
        messages: [{
          id: 1,
          sender_id: user?.id || 1,
          receiver_id: expertId,
          content: 'Hello, I would like to consult you about something.',
          created_at: new Date().toISOString(),
          is_read: false
        }]
      };

      // Store mock conversation data (demo only)
      try {
        const existingMockData = JSON.parse(localStorage.getItem('mockConversations')) || [];
        localStorage.setItem('mockConversations', JSON.stringify([...existingMockData, mockConversation]));
      } catch (e) {
        console.error('Failed to store mock conversation data:', e);
      }

      // Navigate to conversation page
      navigate(`/messages/${mockConversationId}?mock=true`);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Expert List</h1>

      {experts.length === 0 ? (
        <p className="text-center text-gray-500">No experts available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map(expert => (
            <div key={expert.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center mr-4">
                    {expert.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{expert.username}</h3>
                    <p className="text-sm text-gray-600">{expert.specialization || 'Professional Appraiser'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartConversation(expert.id)}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Start Conversation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertListPage;
