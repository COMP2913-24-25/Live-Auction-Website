import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/authContext';
import PropTypes from 'prop-types';

const PaymentForm = ({ amount, itemId, onSuccess, onSave, onCancel }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useContext(AuthContext);

  // Format card number input
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formattedValue);
  };

  // Format expiry date input
  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      setExpiry(value);
    } else {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    }
  };

  // Format CVC input
  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvc(value.slice(0, 3));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!cardNumber || !expiry || !cvc || !name) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // 显示处理中状态
      setLoading(true);
      
      // 模拟 API 延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟 Stripe API 响应
      const stripeResponse = {
        id: `tok_${Math.random().toString(36).substring(2, 15)}`,
        object: 'token',
        card: {
          id: `card_${Math.random().toString(36).substring(2, 15)}`,
          object: 'card',
          brand: cardNumber.startsWith('4') ? 'Visa' : 
                 cardNumber.startsWith('5') ? 'MasterCard' : 
                 cardNumber.startsWith('3') ? 'American Express' : 'Unknown',
          last4: cardNumber.replace(/\s/g, '').slice(-4),
          exp_month: parseInt(expiry.split('/')[0]),
          exp_year: parseInt(expiry.split('/')[1]),
          funding: 'credit',
          country: 'US',
          currency: 'usd'
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false
      };
      
      console.log('Stripe API response:', stripeResponse);
      
      // 生成随机 ID
      const newCardId = Math.floor(Math.random() * 10000);
      
      // 模拟保存支付方式到服务器
      console.log('Saving payment method to server...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟服务器响应
      const mockResponse = {
        id: newCardId,
        last4: cardNumber.replace(/\s/g, '').slice(-4),
        card_type: stripeResponse.card.brand,
        exp_month: parseInt(expiry.split('/')[0] || '0'),
        exp_year: parseInt(expiry.split('/')[1] || '0'),
        stripe_token_id: stripeResponse.id
      };
      
      console.log('Payment method saved successfully:', mockResponse);
      
      setLoading(false);
      
      // 如果是从 PaymentCardSelector 调用，则返回新卡信息
      if (onSave) {
        onSave(mockResponse);
      }
      
      // 如果是从 AuctionDetails 调用，则调用 onSuccess
      if (onSuccess) {
        onSuccess({
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiry,
          cvc,
          name,
          paymentMethodId: newCardId,
          cardType: stripeResponse.card.brand
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error saving payment method:', error);
      setError('Failed to save payment method');
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="text-sm text-gray-600 mr-2">Secured by</div>
          <div className="font-bold text-blue-600">Stripe</div>
        </div>
        <div className="flex items-center">
          <div className="mr-2">
            <img src="https://cdn.iconscout.com/icon/free/png-256/visa-3-226460.png" alt="Visa" className="h-6" />
          </div>
          <div className="mr-2">
            <img src="https://cdn.iconscout.com/icon/free/png-256/mastercard-3-226462.png" alt="MasterCard" className="h-6" />
          </div>
          <div>
            <img src="https://cdn.iconscout.com/icon/free/png-256/american-express-3-226461.png" alt="Amex" className="h-6" />
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Cardholder Name</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Card Number</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
            required
          />
        </div>
        
        <div className="flex gap-4">
          <div className="mb-4 flex-1">
            <label className="block text-gray-700 mb-2">Expiry Date (MM/YY)</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="MM/YY"
              value={expiry}
              onChange={handleExpiryChange}
              maxLength={5}
              required
            />
          </div>
          
          <div className="mb-4 flex-1">
            <label className="block text-gray-700 mb-2">CVC</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="123"
              value={cvc}
              onChange={handleCvcChange}
              maxLength={3}
              required
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          {onCancel && (
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 bg-gold text-white rounded hover:bg-yellow-600"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Save'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-500 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your payment information is encrypted and secure
      </div>
    </div>
  );
};

PaymentForm.propTypes = {
  amount: PropTypes.number,
  itemId: PropTypes.number,
  onSuccess: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func
};

PaymentForm.defaultProps = {
  amount: 0,
  itemId: 0,
  onSuccess: () => {},
  onSave: null,
  onCancel: null
};

export default PaymentForm; 