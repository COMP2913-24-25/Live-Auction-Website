import React from 'react';
import { Link } from 'react-router-dom';
import ConversationList from '../components/Messages/ConversationList';
import { useAuth } from '../context/AuthContext';

const MessagesPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Message Center</h1>
        
        {user && (
          <Link 
            to="/experts"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Contact Experts
          </Link>
        )}
      </div>
      
      <div className="max-w-3xl mx-auto">
        <ConversationList />
      </div>
    </div>
  );
};

export default MessagesPage; 