export const validateBidAmount = (amount, currentBid, minPrice) => {
  const numAmount = parseFloat(amount);
  const numCurrentBid = parseFloat(currentBid);
  const numMinPrice = parseFloat(minPrice);
  
  // check if amount is a valid number
  if (isNaN(numAmount)) {
    return "Please enter a valid amount";
  }
  
  // check if amount is a positive number
  if (numCurrentBid === numMinPrice) {
    // first bid must be at least minPrice + 5
    if (numAmount < numMinPrice + 5) {
      return `First bid must be at least £${numMinPrice + 5}`;
    }
  } else {
    // subsequent bids must be higher than current bid
    if (numAmount <= numCurrentBid) {
      return `Bid must be higher than current bid (£${numCurrentBid})`;
    }
  }
  
  return null; 
}; 