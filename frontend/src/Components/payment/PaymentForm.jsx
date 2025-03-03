import { useState } from 'react';
import PropTypes from 'prop-types';

const PaymentForm = ({ amount, itemId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 简单验证
    if (!cardNumber || !expiry || !cvc) {
      setError('Please fill in all card details');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // 模拟支付处理
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        cardNumber,
        expiry,
        cvc
      });
    }, 2000);
  };

  const formatCardNumber = (value) => {
    // 移除所有非数字字符
    const v = value.replace(/\D/g, '');
    // 添加空格分隔
    return v.length > 0 
      ? v.match(/.{1,4}/g).join(' ').substr(0, 19) 
      : '';
  };

  const formatExpiry = (value) => {
    // 移除所有非数字字符
    const v = value.replace(/\D/g, '');
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Amount</label>
        <div className="text-2xl font-bold">£{amount}</div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          className="w-full p-2 border rounded"
          maxLength="19"
        />
      </div>
      
      <div className="flex space-x-4 mb-4">
        <div className="w-1/2">
          <label className="block text-gray-700 mb-2">Expiry Date</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className="w-full p-2 border rounded"
            maxLength="5"
          />
        </div>
        <div className="w-1/2">
          <label className="block text-gray-700 mb-2">CVC</label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
            placeholder="123"
            className="w-full p-2 border rounded"
            maxLength="3"
          />
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button 
        type="submit" 
        className="w-full bg-gold text-white py-2 rounded hover:bg-yellow-600 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>This is a simulated payment form.</p>
        <p>In production, this would use Stripe's secure payment processing.</p>
      </div>
    </form>
  );
};

PaymentForm.propTypes = {
  amount: PropTypes.number.isRequired,
  itemId: PropTypes.number.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default PaymentForm; 