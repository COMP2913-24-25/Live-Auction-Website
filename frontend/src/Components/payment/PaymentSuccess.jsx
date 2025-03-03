import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const PaymentSuccess = ({ amount, itemTitle }) => {
  return (
    <div className="text-center p-6 bg-white rounded-lg shadow-md">
      <div className="text-green-500 text-5xl mb-4">✓</div>
      <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
      <p className="mb-4">Your payment of <span className="font-bold">£{amount}</span> for <span className="font-bold">{itemTitle}</span> has been processed.</p>
      <p className="mb-6 text-gray-600">A confirmation email has been sent to your registered email address.</p>
      <div className="flex justify-center space-x-4">
        <Link to="/dashboard" className="px-4 py-2 bg-teal text-white rounded hover:bg-teal-600">
          View Dashboard
        </Link>
        <Link to="/browse" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

PaymentSuccess.propTypes = {
  amount: PropTypes.number.isRequired,
  itemTitle: PropTypes.string.isRequired
};

export default PaymentSuccess; 