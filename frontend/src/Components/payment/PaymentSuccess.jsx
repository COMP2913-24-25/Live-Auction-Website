import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const PaymentSuccess = ({ amount, itemTitle, paymentDetails }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
      <p className="text-lg mb-2">You have successfully paid £{amount} for the item</p>
      <p className="text-xl font-semibold mb-4">"{itemTitle}"</p>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4 w-full max-w-md text-left">
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
        
        <p className="text-gray-700 mt-4">The transaction details have been sent to your email.</p>
        <p className="text-gray-700 mt-2">The seller will arrange delivery after confirming the payment.</p>
      </div>
      
      <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
        <div className="mr-2">Secured by</div>
        <div className="font-bold text-blue-600">Stripe</div>
      </div>
      
      <div className="mt-4 flex space-x-4">
        <button className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
          View Receipt
        </button>
        
        <Link to="/profile/purchases" className="px-6 py-2 bg-gold text-white rounded-md hover:bg-yellow-600">
          View my purchases
        </Link>
      </div>
    </div>
  );
};

PaymentSuccess.propTypes = {
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  itemTitle: PropTypes.string.isRequired,
  paymentDetails: PropTypes.shape({
    transactionId: PropTypes.string,
    cardType: PropTypes.string,
    last4: PropTypes.string
  })
};

export default PaymentSuccess; 