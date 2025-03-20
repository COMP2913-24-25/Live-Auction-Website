import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const PaymentSuccess = ({ amount, itemTitle, paymentDetails }) => {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
      <p className="text-gray-600 mb-6">Your payment of £{amount} for "{itemTitle}" has been processed.</p>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
        <h3 className="font-semibold mb-2">Payment Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Transaction ID:</div>
          <div>{paymentDetails?.transactionId || 'pi_' + Math.random().toString(36).substring(2, 10)}</div>
          
          <div className="text-gray-600">Payment Method:</div>
          <div>{paymentDetails?.cardType || 'Credit Card'} ending in {paymentDetails?.last4 || '****'}</div>
          
          <div className="text-gray-600">Date:</div>
          <div>{new Date().toLocaleString()}</div>
          
          <div className="text-gray-600">Status:</div>
          <div className="text-green-600">Completed</div>
        </div>
      </div>
      
      <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
        <div className="mr-2">Secured by</div>
        <div className="font-bold text-blue-600">Stripe</div>
      </div>
      
      <button className="bg-gold text-white py-2 px-6 rounded hover:bg-yellow-600">
        View Receipt
      </button>
    </div>
  );
};

PaymentSuccess.propTypes = {
  amount: PropTypes.number.isRequired,
  itemTitle: PropTypes.string.isRequired,
  paymentDetails: PropTypes.object
};

export default PaymentSuccess; 