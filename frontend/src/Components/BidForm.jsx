import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './BidForm.css';

const BidForm = ({ itemId, currentBid, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [bidAmount, setBidAmount] = useState(currentBid + 5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Submit a bid
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Check whether the user is logged in
    if (!user) {
      setError('Please login before bidding');
      setSubmitting(false);
      return;
    }

    if (bidAmount <= currentBid) {
      setError(`Bid must be higher than current price £${currentBid}`);
      setSubmitting(false);
      return;
    }

    try {
      console.log('Submitting bid:', { item_id: itemId, bid_amount: bidAmount });
      const response = await axios.post('/api/bids', {
        item_id: itemId,
        bid_amount: bidAmount
      });
      
      console.log('Bid response:', response.data);
      
      if (response.data.success) {
        // Reset the form
        setBidAmount(response.data.current_bid + 5);
        // Notify the parent component
        if (onSuccess) onSuccess();
      } else {
        setError(response.data.error || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Bid error:', error);
      let errorMessage = 'An error occurred while placing your bid';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to place a bid';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bid-form">
      <div className="bid-input-container">
        <input
          type="number"
          className="bid-amount-input"
          value={bidAmount}
          onChange={(e) => setBidAmount(parseFloat(e.target.value))}
          min={currentBid + 0.01}
          step="0.01"
          placeholder={`£${currentBid + 5} or higher`}
          required
        />
        
        <button 
          className="place-bid-button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Place Bid'}
        </button>
      </div>
      
      {error && <div className="bid-error-message">{error}</div>}
      
      {!user && (
        <div className="login-reminder">
          Please <a href="/login">login</a> to place a bid
        </div>
      )}
    </div>
  );
};

export default BidForm; 