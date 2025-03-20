import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import './AuctionSuccessModal.css';

const AuctionSuccessModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="auction-success-modal-overlay">
      <div className="auction-success-modal">
        <div className="success-header">
          <CheckCircle className="success-icon" size={48} color="#10b981" />
            <h2>Congratulations!</h2>
        </div>
        
        <div className="success-content">
          <p className="success-message">
            You have won the auction for <span className="item-name">{item.title}</span>
          </p>
          
          <div className="item-details">
            <div className="item-image">
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0]} alt={item.title} />
              ) : (
                <div className="no-image">No image</div>
              )}
            </div>
            
            <div className="item-info">
              <p><strong>Transaction price:</strong> £{item.current_bid}</p>
              <p><strong>Item description</strong> {item.description}</p>
            </div>
          </div>
          
          <div className="next-steps">
            <p>The auction has ended and you are the highest bidder. You can view auction details in the Personal Center and contact the seller to complete the transaction.</p>
          </div>
        </div>
        
        <div className="success-actions">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
          <Link to="/dashboard" className="dashboard-button">
          Go to personal center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuctionSuccessModal; 