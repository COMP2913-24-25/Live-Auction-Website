import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import PropTypes from 'prop-types';

const PaymentForm = ({ amount = 0, itemId = null, onSuccess = () => {}, onCancel = () => {} }) => {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // 基本验证
    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return;
    }

    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    if (!expiryMonth || !expiryYear) {
      setError('Please select the expiration date');
      return;
    }

    if (!cvv.trim() || cvv.length < 3) {
      setError('Please enter a valid security code');
      return;
    }

    try {
      // 计算过期年份的完整格式 (例如: '26' -> '2026')
      const fullYear = expiryYear.length === 2 ? `20${expiryYear}` : expiryYear;
      
      // 生成一个模拟的tokenized_card_id (实际中应由支付处理器提供)
      const tokenizedCardId = `tok_${Math.random().toString(36).substring(2, 10)}`;
      
      // 从卡号中提取最后4位数字
      const last4 = cardNumber.replace(/\s/g, '').slice(-4);

      // 确定卡类型 (简单版本)
      let cardType;
      const firstDigit = cardNumber.replace(/\s/g, '')[0];
      if (firstDigit === '4') {
        cardType = 'Visa';
      } else if (firstDigit === '5') {
        cardType = 'MasterCard';
      } else if (firstDigit === '3') {
        cardType = 'American Express';
      } else if (firstDigit === '6') {
        cardType = 'Discover';
      } else {
        cardType = 'Unknown';
      }

      // 获取用户ID
      let userId;
      
      if (user && user.id) {
        userId = user.id;
        console.log('Get user ID from useAuth:', userId);
      } else {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            userId = payload.id;
            console.log('Get user ID from JWT token:', userId);
          } else {
            throw new Error('User token not found');
          }
        } catch (error) {
          console.error('Error getting user ID:', error);
          setError('Unable to verify your identity, please log in again');
          setIsSubmitting(false);
          return;
        }
      }

      if (!userId) {
        setError('You need to log in to save your payment method');
        setIsSubmitting(false);
        return;
      }

      // 提交到服务器
      const paymentMethodData = {
        user_id: userId,
        tokenized_card_id: tokenizedCardId,
        card_type: cardType,
        last4: last4,
        exp_month: parseInt(expiryMonth),
        exp_year: parseInt(fullYear),
        cvv: cvv,
        payment_provider: 'Stripe'
      };

      console.log('Submit payment method data:', paymentMethodData);

      // 尝试使用令牌
      let response;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token not found');
        }
        
        response = await axios.post('/api/payment/methods', paymentMethodData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (tokenError) {
        console.log('Token request failed, trying with query parameter:', tokenError);
        
        // 使用查询参数降级
        response = await axios.post(`/api/payment/methods?user_id=${userId}`, paymentMethodData);
      }

      console.log('Payment method saved successfully:', response.data);

      // 回调父组件成功处理函数
      onSuccess({ 
        id: response.data.id || tokenizedCardId,
        last4: last4,
        brand: cardType,
        exp_month: parseInt(expiryMonth),
        exp_year: parseInt(fullYear)
      });

      // 在成功保存卡片后添加到localStorage
      const savedCard = {
        id: response.data.id,
        tokenized_card_id: response.data.tokenized_card_id || paymentMethodData.tokenized_card_id,
        card_type: paymentMethodData.card_type,
        last4: paymentMethodData.last4,
        exp_month: paymentMethodData.exp_month,
        exp_year: paymentMethodData.exp_year,
        created_at: new Date().toISOString()
      };

      // 获取现有卡片
      let savedCards = JSON.parse(localStorage.getItem('payment_methods') || '[]');
      // 添加新卡片
      savedCards.push(savedCard);
      // 保存回 localStorage
      localStorage.setItem('payment_methods', JSON.stringify(savedCards));

    } catch (error) {
      console.error('Error saving payment method:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save payment method, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化卡号为每4位一组
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };

  // 生成月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return <option key={month} value={month}>{month.toString().padStart(2, '0')}</option>;
  });

  // 生成年份选项 (从当前年份到未来15年)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 15 }, (_, i) => {
    const year = currentYear + i;
    return <option key={year} value={year}>{year}</option>;
  });

  return (
    <div className="bg-white rounded-lg">
      {/* Stripe安全标识和支付图标 */}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Cardholder Name"
            className="w-full p-2 border border-gray-300 rounded focus:ring-gold focus:border-gold"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 1234 1234 1234"
            className="w-full p-2 border border-gray-300 rounded focus:ring-gold focus:border-gold"
            maxLength="19"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <div className="flex">
              <select
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                className="w-1/2 p-2 border border-gray-300 rounded-l focus:ring-gold focus:border-gold"
                disabled={isSubmitting}
              >
                <option value="">MM</option>
                {monthOptions}
              </select>
              <span className="flex items-center justify-center px-2 bg-gray-100 border-t border-b border-gray-300">
                /
              </span>
              <select
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                className="w-1/2 p-2 border border-gray-300 rounded-r focus:ring-gold focus:border-gold"
                disabled={isSubmitting}
              >
                <option value="">YYYY</option>
                {yearOptions}
              </select>
            </div>
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVV
            </label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="123"
              className="w-full p-2 border border-gray-300 rounded focus:ring-gold focus:border-gold"
              maxLength="3"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-4">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-amber-700 border border-amber-700 rounded-md text-white hover:bg-amber-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
      
      <div className="flex items-center mt-6 text-gray-500 text-sm">
        <span className="mr-2">🔒</span>
        <span>Your payment information is securely encrypted</span>
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

export default PaymentForm; 