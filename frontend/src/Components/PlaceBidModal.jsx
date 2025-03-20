import { useState, useEffect } from 'react';
import axios from 'axios';
import './PlaceBidModal.css';

const PlaceBidModal = ({ isOpen, onClose, currentBid, itemId, itemTitle, historyOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidHistory, setBidHistory] = useState([]);

  // Get the bid history
  useEffect(() => {
    if (isOpen && itemId) {
      setLoading(true);
      console.log('Fetching bid history for item:', itemId);
      axios.get(`/api/bids/history/${itemId}`)
        .then(response => {
          console.log('Bid history response:', response.data);
          if (response.data.success) {
            setBidHistory(response.data.bids || []);
            setError(''); // Clear previous errors
          } else {
            setError('Failed to obtain bid history');
          }
        })
        .catch(error => {
          console.error('Full error details:', error.response || error);
          // Provide more specific error information
          let errorMsg = 'An error occurred while obtaining bid history';
          if (error.response?.status === 404) {
            errorMsg = 'Bid history not found';
          } else if (error.response?.data?.error) {
            errorMsg = error.response.data.error;
          } else if (error.message) {
            errorMsg = `Error: ${error.message}`;
          }
          setError(errorMsg);
          console.error('Error fetching bid history:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, itemId]);

  if (!isOpen) return null;

  // Format the date time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bid-modal-overlay" onClick={onClose}>
      <div className="bid-modal-content" onClick={e => e.stopPropagation()}>
        <button className="bid-modal-close" onClick={onClose}>&times;</button>
        
        <h2>{itemTitle}</h2>
        
        <h3 className="bid-history-title">Bid History</h3>
        
        <div className="bid-history-container">
          <div className="current-price-display">
            <span>Current Bid:</span>
            <span className="price-value">£{currentBid}</span>
          </div>
          
          {loading ? (
            <div className="bid-loading">Loading...</div>
          ) : error && bidHistory.length === 0 ? (
            <div className="bid-error">{error}</div>
          ) : bidHistory.length > 0 ? (
            <div className="bid-history">
              <table className="bid-history-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Bid</th>
                  </tr>
                </thead>
                <tbody>
                  {bidHistory.map((bid, index) => (
                    <tr key={index} className={index === 0 ? 'highest-bid' : ''}>
                      <td>{formatDateTime(bid.bid_time)}</td>
                      <td>{bid.username || 'Anonymous user'}</td>
                      <td className="bid-amount">£{bid.bid_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-bids-message">
              <p>There is no bidding record</p>
              <p>Be the first to bid!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceBidModal; 