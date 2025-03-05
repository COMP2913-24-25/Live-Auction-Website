import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/authContext';

const AuthRequestForm = ({ itemId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('Please log in first');
      return;
    }

    try {
      const response = await axios.post('/api/authentication/request', {
        item_id: itemId
      });
      
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred while submitting the authentication request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Submit authentication request</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-gray-600">
            Do you want to apply for certification for this product?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              - Certification requests will be reviewed by experts<br/>
              - Certification Status: Pending<br/>
              - Goods will receive a certification mark upon approval<br/>
              - You can check the certification progress in your personal center
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Under submission...' : 'Confirm the application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthRequestForm; 