import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/authContext';
import PaymentForm from './payment/PaymentForm';

const PaymentCardSelector = ({ onSelectCard, onCancel, itemId, bidAmount }) => {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  
  useEffect(() => {
    // 获取用户已保存的支付卡
    const fetchCards = async () => {
      try {
        // 模拟 API 响应，不进行实际 API 调用
        const mockCards = [
          {
            id: 1,
            last4: '4242',
            card_type: 'Visa',
            exp_month: 12,
            exp_year: 24
          },
          {
            id: 2,
            last4: '5678',
            card_type: 'MasterCard',
            exp_month: 10,
            exp_year: 25
          }
        ];
        
        console.log('Cards retrieved:', mockCards);
        setCards(mockCards);
        if (mockCards.length > 0) {
          setSelectedCardId(mockCards[0].id); // 默认选择第一张卡
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch payment cards:', error);
        setLoading(false);
      }
    };
    
    fetchCards();
  }, []);
  
  const handleCardSelect = (cardId) => {
    setSelectedCardId(cardId);
  };
  
  const handleAddCardClick = () => {
    setShowAddCard(true);
  };
  
  const handleCardAdded = (newCard) => {
    console.log('New card added:', newCard);
    setCards([...cards, newCard]);
    setSelectedCardId(newCard.id);
    setShowAddCard(false);
  };
  
  const handlePlaceBid = () => {
    if (selectedCardId) {
      // 查找所选卡的详细信息
      const selectedCard = cards.find(card => card.id === selectedCardId);
      onSelectCard(selectedCardId, selectedCard);
    }
  };
  
  if (showAddCard) {
    return (
      <>
        {/* 半透明背景 */}
        <div 
          className="fixed inset-0 z-40" 
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setShowAddCard(false)}
        ></div>
        
        {/* 模态框内容 */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-xl">
          <div className="bg-white rounded-lg w-[600px] max-w-[50vw]">
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
      
      {loading ? (
        <div className="text-center py-5 text-gray-600">Loading...</div>
      ) : (
        <>
          <div className="mb-5">
            {cards.map(card => (
              <div 
                key={card.id} 
                className={`flex items-center p-3 border rounded-md mb-2 cursor-pointer relative ${selectedCardId === card.id ? 'border-gold bg-yellow-50' : 'border-gray-300'}`}
                onClick={() => handleCardSelect(card.id)}
              >
                <div className="mr-3 font-bold">
                  {card.card_type === 'Visa' && <span className="text-blue-900">Visa</span>}
                  {card.card_type === 'MasterCard' && <span className="text-red-600">MC</span>}
                  {card.card_type === 'American Express' && <span className="text-blue-600">Amex</span>}
                </div>
                <div>**** **** **** {card.last4}</div>
                {selectedCardId === card.id && <div className="absolute right-3 text-gray-500 text-xs">default</div>}
              </div>
            ))}
            
            <div 
              className="flex items-center p-3 border border-dashed border-gray-300 rounded-md cursor-pointer text-gray-600"
              onClick={handleAddCardClick}
            >
              <span className="mr-2 text-lg">+</span>
              <span>Add New Card</span>
            </div>
          </div>
          
          <button 
            className="w-full py-3 rounded-md font-semibold bg-gold text-white hover:bg-yellow-600"
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

export default PaymentCardSelector; 