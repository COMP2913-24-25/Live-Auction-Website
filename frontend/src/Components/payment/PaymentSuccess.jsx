import React from 'react';
import { CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const PaymentSuccess = ({ amount, itemTitle }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">payment success!</h2>
      <p className="text-lg mb-2">You have successfully paid £{amount} for the item</p>
      <p className="text-xl font-semibold mb-4">"{itemTitle}"</p>
      <div className="bg-gray-100 p-4 rounded-md mb-4 w-full max-w-md">
        <p className="text-gray-700">The transaction details have been sent to your email.</p>
        <p className="text-gray-700 mt-2">The seller will arrange delivery after confirming the payment.</p>
      </div>
      <button 
        className="mt-4 px-6 py-2 bg-gold text-white rounded-md hover:bg-yellow-600"
        onClick={() => window.location.href = '/profile/purchases'}
      >
        View my purchases
      </button>
    </div>
  );
};

PaymentSuccess.propTypes = {
  amount: PropTypes.number.isRequired,
  itemTitle: PropTypes.string.isRequired,
};

export default PaymentSuccess; 