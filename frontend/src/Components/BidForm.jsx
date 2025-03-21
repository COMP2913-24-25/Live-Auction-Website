export const validateBidAmount = (amount, currentBid, minPrice) => {
  const numAmount = parseFloat(amount);
  const numCurrentBid = parseFloat(currentBid);
  const numMinPrice = parseFloat(minPrice);
  
  // 检查是否为有效数字
  if (isNaN(numAmount)) {
    return "Please enter a valid amount";
  }
  
  // 检查是否为第一次出价（当前出价等于起拍价）
  if (numCurrentBid === numMinPrice) {
    // 第一次出价需要比起拍价至少高 5 元
    if (numAmount < numMinPrice + 5) {
      return `First bid must be at least £${numMinPrice + 5}`;
    }
  } else {
    // 后续出价只需要比当前最高价高
    if (numAmount <= numCurrentBid) {
      return `Bid must be higher than current bid (£${numCurrentBid})`;
    }
  }
  
  return null; // 验证通过
}; 