import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import axios from 'axios';
import './PlaceBidModal.css';

const PlaceBidModal = ({ isOpen, onClose, itemId, itemTitle }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidHistory, setBidHistory] = useState([]);

  // 获取竞价历史
  useEffect(() => {
    if (isOpen && itemId) {
      setLoading(true);
      axios.get(`/api/bids/history/${itemId}`)
        .then(response => {
          if (response.data.success) {
            setBidHistory(response.data.bids || []);
          } else {
            setError('Failed to obtain bid history');
          }
        })
        .catch(error => {
          setError('An error occurred while obtaining bid history');
          console.error('Error fetching bid history:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, itemId]);

  if (!isOpen) return null;

  // 格式化日期时间
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
        
        <h2>Bidding record</h2>
        {itemTitle && <p className="bid-item-title">{itemTitle}</p>}
        
        {loading ? (
          <div className="bid-loading">Loading...</div>
        ) : error ? (
          <div className="bid-error">{error}</div>
        ) : bidHistory.length > 0 ? (
          <div className="bid-history">
            <table className="bid-history-table">
              <thead>
                <tr>
                  <th>time</th>
                  <th>user</th>
                  <th>bid</th>
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
  );
};

export default PlaceBidModal; 