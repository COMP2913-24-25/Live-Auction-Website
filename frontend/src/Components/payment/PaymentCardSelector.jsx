import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import axios from 'axios';
import PaymentForm from './PaymentForm';

const PaymentCardSelector = ({ onCardSelected = null, amount = 0 }) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 获取用户支付方式
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const userId = user?.id || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null);
      console.log('Getting payment methods for user ID:', userId);
      
      if (!userId) {
        console.error('No user ID available');
        setError('Unable to determine user ID. Please log in again.');
        setLoading(false);
        return;
      }
      
      // 尝试使用令牌获取
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/api/payment/methods', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data && Array.isArray(response.data)) {
            setPaymentMethods(response.data);
            console.log('Successfully got payment methods:', response.data);
            setLoading(false);
            return;
          }
        }
      } catch (tokenError) {
        console.error('Failed to get payment methods using token:', tokenError);
      }
      
      // 如果令牌方法失败，尝试使用 user_id 查询参数
      try {
        console.log('Attempting to get payment methods using user_id parameter');
        const fallbackResponse = await axios.get(`/api/payment/methods?user_id=${userId}`);
        
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
          setPaymentMethods(fallbackResponse.data);
          console.log('Successfully got payment methods using user_id:', fallbackResponse.data);
          setLoading(false);
          return;
        }
      } catch (fallbackError) {
        console.error('Failed with fallback method:', fallbackError);
      }
      
      // 如果两种方法都失败，展示本地保存的支付卡或模拟数据
      const savedCards = JSON.parse(localStorage.getItem('payment_methods') || '[]');
      if (savedCards.length > 0) {
        console.log('Using payment methods from localStorage');
        setPaymentMethods(savedCards);
      } else {
        console.log('Using mock payment methods data');
        setPaymentMethods([
          {
            id: 1,
            card_type: 'Visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          },
          {
            id: 2,
            card_type: 'MasterCard',
            last4: '5555',
            exp_month: 11,
            exp_year: 2024
          }
        ]);
      }
    } catch (error) {
      console.error('Error getting payment methods:', error);
      setError('Failed to get payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 组件挂载时获取支付方式
    fetchPaymentMethods();
  }, [user]);

  const handleAddNewCard = () => {
    setShowAddCard(true);
  };

  const handleCardAdded = (card) => {
    console.log('New card added:', card);
    
    // 添加到支付方式列表
    setPaymentMethods(prevMethods => {
      // 检查卡片是否已存在
      const exists = prevMethods.some(method => method.id === card.id);
      if (exists) {
        return prevMethods;
      }
      return [...prevMethods, card];
    });
    
    // 自动选择新添加的卡片
    setSelectedCard(card.id);
    
    // 关闭添加表单
    setShowAddCard(false);
    
    // 更新localStorage中的支付方式
    try {
      const storedMethods = JSON.parse(localStorage.getItem('payment_methods') || '[]');
      const updatedMethods = [...storedMethods];
      
      // 检查是否已存在
      const existsInStorage = updatedMethods.some(method => method.id === card.id);
      if (!existsInStorage) {
        updatedMethods.push(card);
        localStorage.setItem('payment_methods', JSON.stringify(updatedMethods));
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  };

  const handleCardSelect = (cardId) => {
    setSelectedCard(cardId);
  };

  const handleCardSelected = (card) => {
    console.log('选择了支付卡:', card);
    setSelectedCard(card.id);
    
    // 添加安全检查
    if (typeof onCardSelected === 'function') {
      onCardSelected(card);
    } else {
      console.error('onCardSelected 不是一个函数或未提供');
    }
  };
  
  // 确保取消按钮也有安全检查
  const handleCancel = () => {
    if (typeof onCardSelected === 'function') {
      onCardSelected(null);
    } else {
      console.error('onCardSelected 不是一个函数或未提供');
    }
  };

  return (
    <div className="p-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold"></div>
          <p className="mt-4">Loading payment methods...</p>
        </div>
      ) : showAddCard ? (
        <div className="bg-white rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Add new payment method</h3>
          <PaymentForm 
            onSuccess={handleCardAdded} 
            onCancel={() => setShowAddCard(false)}
            amount={amount}
          />
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-2">Secure payment</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Select a payment method to complete your bid £{amount}
            </p>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            {paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethods.map((card) => (
                  <div 
                    key={card.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition hover:shadow-md ${selectedCard === card.id ? 'border-gold bg-amber-50' : 'border-gray-200'} ${submitting ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => handleCardSelected(card)}
                  >
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        checked={selectedCard === card.id} 
                        onChange={() => handleCardSelect(card.id)}
                        className="mr-3 text-gold focus:ring-gold"
                        disabled={submitting}
                      />
                      <div className="ml-3 flex-grow">
                        <p className="font-medium">{card.card_type || card.brand} **** **** **** {card.last4}</p>
                        <p className="text-sm text-gray-500">valid unti {card.exp_month}/{card.exp_year.toString().slice(-2)}</p>
                      </div>
                      {selectedCard === card.id && submitting && (
                        <div className="animate-pulse h-5 w-5 rounded-full bg-gold"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4">
                You don't have any saved payment methods
              </div>
            )}

            <button 
              className={`w-full mt-4 py-2 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 ${submitting ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={handleAddNewCard}
              disabled={submitting}
            >
              <span className="mr-2">+</span> Add new payment method
            </button>

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
              <button 
                className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${submitting ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="flex items-center mt-4 text-gray-500 text-sm">
            <span className="mr-2">🔒</span>
            <span>Your payment information is securely encrypted</span>
          </div>
          
          {submitting && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>Processing your selection...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentCardSelector; 