import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/authContext';
import PropTypes from 'prop-types';

const PaymentForm = ({ amount, itemId, onSuccess, onSave, onCancel }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
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

  // 修改月份输入处理函数，添加自动跳转功能
  const handleExpMonthChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    
    // 只接受有效的月份值 (1-12)
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
      setExpMonth(value);
      
      // 当输入了两位数字或输入了大于等于1的单个数字时自动跳转
      if (value.length === 2 || (value.length === 1 && parseInt(value) > 1)) {
        // 使用 setTimeout 确保状态更新后再跳转
        setTimeout(() => {
          // 获取年份输入框并聚焦
          const yearInput = document.getElementById('exp-year-input');
          if (yearInput) {
            yearInput.focus();
          }
        }, 10);
      }
    }
  };

  // 处理年份输入，限制为两位数
  const handleExpYearChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setExpYear(value.slice(0, 2));
  };

  // Format CVC input
  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvv(value.slice(0, 3));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!cardNumber || !expMonth || !expYear || !cvv || !name) {
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
          exp_month: parseInt(expMonth),
          exp_year: parseInt(expYear),
          funding: 'credit',
          country: 'US',
          currency: 'usd'
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false
      };
      
      console.log('Stripe API response:', stripeResponse);
      
      // 在请求前添加日志
      console.log('Ready to send payment method save request...');
      console.log('Request data:', {
        payment_provider: 'Stripe',
        tokenized_card_id: stripeResponse.id,
        last4: stripeResponse.card.last4,
        card_type: stripeResponse.card.brand,
        exp_month: stripeResponse.card.exp_month,
        exp_year: stripeResponse.card.exp_year
      });
      
      // 向后端发送请求
      const token = localStorage.getItem('token');
      console.log('The authentication token used:', token);
      
      const response = await axios.post('/api/payment/methods', {
        payment_provider: 'Stripe',
        tokenized_card_id: stripeResponse.id,
        last4: stripeResponse.card.last4,
        card_type: stripeResponse.card.brand,
        exp_month: stripeResponse.card.exp_month,
        exp_year: stripeResponse.card.exp_year,
        cvv: cvv
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('The payment method is saved successfully:', response.data);
      
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
        exp_month: parseInt(expMonth),
        exp_year: parseInt(expYear),
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
          expMonth,
          expYear,
          cvv,
          name,
          paymentMethodId: newCardId,
          cardType: stripeResponse.card.brand
        });
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
        console.error('Response header:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Request setting error:', error.message);
      }
      setError(`Failed to save payment method: ${error.response?.data?.error || error.message}`);
      setLoading(false);
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
            <label className="block text-gray-700 mb-2">Expiration Date</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="MM"
                value={expMonth}
                onChange={handleExpMonthChange}
                maxLength={2}
                required
              />
              <div className="flex items-center text-gray-500">/</div>
              <input
                id="exp-year-input"
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="YY"
                value={expYear}
                onChange={handleExpYearChange}
                maxLength={2}
                required
              />
            </div>
          </div>
          
          <div className="mb-4 flex-1">
            <label className="block text-gray-700 mb-2">CVV</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="123"
              value={cvv}
              onChange={handleCvvChange}
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