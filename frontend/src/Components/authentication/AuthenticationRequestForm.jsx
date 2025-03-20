import React, { useState } from 'react';
import { submitAuthRequest } from '../../api/authentication';

const AuthenticationRequestForm = ({ itemId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await submitAuthRequest(itemId);
      if (response.success) {
        onSuccess && onSuccess();
      } else {
        setError('Failed to submit the authentication request. Please try again later');
      }
    } catch (error) {
      setError('An error occurred while submitting the authentication request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authentication-request-container">
      <button 
        onClick={handleSubmit}
        disabled={loading}
        className="auth-request-btn"
      >
        {loading ? 'Under submission...' : 'Request product certification'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default AuthenticationRequestForm; 