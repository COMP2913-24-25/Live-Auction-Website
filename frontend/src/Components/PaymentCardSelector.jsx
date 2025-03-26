import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/authContext';
import PaymentForm from './payment/PaymentForm';
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const PaymentCardSelector = ({ onSelectCard, onCancel, itemId, bidAmount }) => {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // get all payment methods
  const fetchCards = async () => {
    try {
      setLoading(true);
      setError('');
      
      // check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, user may not be logged in');
        navigate('/login');
        return;
      }
      
      // get API of payment methods
      const response = await axios.get('/api/payment/methods', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Cards retrieved from API:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setCards(response.data);
        if (response.data.length > 0) {
          setSelectedCardId(response.data[0].id); // select the first card by default
        }
      } else {
        console.error('Invalid response format:', response.data);
        setError('Failed to load payment methods: Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch payment cards:', error);
      setError('Failed to load payment methods. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // get all payment methods
  useEffect(() => {
    fetchCards();
  }, []);
  
  const handleCardSelect = (cardId) => {
    setSelectedCardId(cardId);
  };
  
  const handleAddCardClick = () => {
    setShowAddCard(true);
  };
  
  // handle new card added
  const handleCardAdded = (newCard) => {
    console.log('New card added:', newCard);
    
    // add new card to the list
    fetchCards();
    
    // close the modal
    setShowAddCard(false);
  };
  
  const handlePlaceBid = () => {
    if (selectedCardId) {
      // get the selected card
      const selectedCard = cards.find(card => card.id === selectedCardId);
      onSelectCard(selectedCardId, selectedCard);
    }
  };
  
  if (showAddCard) {
    return (
      <>
        {/* Opaque background */}
        <div 
          className="fixed inset-0 z-40" 
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setShowAddCard(false)}
        ></div>
        
        {/* Modal content*/}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-xl">
          <div className="bg-white rounded-lg w-[600px] max-w-[90vw]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Add Payment Method</h3>
              <button 
                onClick={() => setShowAddCard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-8">
              <PaymentForm 
                onSave={handleCardAdded} 
                onCancel={() => setShowAddCard(false)} 
                amount={bidAmount}
                itemId={itemId}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <div className="bg-white rounded-lg p-5 w-full max-w-md">
      <h2 className="text-xl font-semibold mb-2">Secure Payment</h2>
      <p className="text-gray-600 text-sm mb-5">
        Enter your card details to place a bid. If you win, the amount will be charged automatically. If not, no charges will be made.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-5 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading payment methods...</p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            {cards.length > 0 ? (
              cards.map(card => (
                <div 
                  key={card.id} 
                  className={`flex items-center p-3 border rounded-md mb-2 cursor-pointer relative ${selectedCardId === card.id ? 'border-gold bg-yellow-50' : 'border-gray-300'}`}
                  onClick={() => handleCardSelect(card.id)}
                >
                  <div className="mr-3 font-bold">
                    {card.card_type === 'Visa' && <span className="text-blue-900">Visa</span>}
                    {card.card_type === 'MasterCard' && <span className="text-red-600">MC</span>}
                    {card.card_type === 'American Express' && <span className="text-blue-600">Amex</span>}
                    {!['Visa', 'MasterCard', 'American Express'].includes(card.card_type) && 
                      <span className="text-gray-700">{card.card_type}</span>}
                  </div>
                  <div>**** **** **** {card.last4}</div>
                  {selectedCardId === card.id && <div className="absolute right-3 text-gray-500 text-xs">default</div>}
                </div>
              ))
            ) : (
              <div className="text-center py-3 text-gray-500 border border-dashed border-gray-300 rounded-md mb-3">
                No payment methods found
              </div>
            )}
            
            <div 
              className="flex items-center p-3 border border-dashed border-gray-300 rounded-md cursor-pointer text-gray-600 hover:bg-gray-50"
              onClick={handleAddCardClick}
            >
              <span className="mr-2 text-lg">+</span>
              <span>Add New Card</span>
            </div>
          </div>
          
          <button 
            className="w-full py-3 rounded-md font-semibold bg-gold text-white hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500"
            onClick={handlePlaceBid}
            disabled={!selectedCardId}
          >
            Place Bid
          </button>
        </>
      )}
    </div>
  );
};

PaymentCardSelector.propTypes = {
  onSelectCard: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemId: PropTypes.number,
  bidAmount: PropTypes.number
};

export default PaymentCardSelector; 