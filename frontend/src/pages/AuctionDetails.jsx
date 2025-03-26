import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/authContext";
import axios from "axios";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Star } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import PaymentCardSelector from '../components/payment/PaymentCardSelector';
import authenticatedIcon from "../assets/authenticatedIcon.png";
import { submitBid, fetchAuctionById } from '../api/bid';
import { getSocket, joinAuctionRoom, leaveAuctionRoom } from '../socket';

const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

const calculateTimeRemaining = (endTime, auctionStatus) => {
  if (!endTime) return "Auction Ended";

  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const difference = end - now;

  if (difference <= 0) return auctionStatus;

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  
  if (days >= 1) {
    return `${days} day${days > 1 ? "s" : ""} left`;
  }

  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const validateBidAmount = (bidAmount, currentBid, minPrice) => {
  if (!bidAmount || isNaN(parseFloat(bidAmount))) {
    return "Please enter a valid bid amount";
  }
  
  const amount = parseFloat(bidAmount);
  const minimumBid = Math.max(currentBid, minPrice) + 5;
  
  if (amount < minimumBid) {
    return `The bid must be at least £${minimumBid}`;
  }
  
  return null; // 没有错误
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// 保留这个安全访问函数
const safeAccess = (obj, path, defaultValue = null) => {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    return result === undefined ? defaultValue : result;
  } catch (error) {
    console.error(`Error accessing path ${path}:`, error);
    return defaultValue;
  }
};

const AuctionDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [maxHeight, setMaxHeight] = useState("auto");
  const [remainingTime, setRemainingTime] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidError, setBidError] = useState("");
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [placingBid, setPlacingBid] = useState(false);
  const [bidPlaced, setBidPlaced] = useState(false);
  
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);

  useEffect(() => {
    console.log('[Debug] Component mounted, starting to fetch auction data');
    fetchAuctionData();
  }, [id]);

  useEffect(() => {
    console.log('[Debug] auction state updated:', auction);
    if (auction) {
      console.log('[Debug] Setting bidAmount to:', auction.current_bid + 5);
      setBidAmount(auction.current_bid + 5);
    }
  }, [auction]);

  useEffect(() => {
    if (bidPlaced) {
      console.log('[Debug] Detected bidPlaced as true, fetching auction data again');
      fetchAuctionData();
      setBidPlaced(false);
    }
  }, [bidPlaced]);

  useEffect(() => {
    if (!auction?.end_time) return;

    const updateRemainingTime = () => {
      setRemainingTime(calculateTimeRemaining(auction.end_time, auction.auction_status));
    };

    updateRemainingTime();

    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [auction?.end_time]);

  useEffect(() => {
    const adjustHeight = () => {
      if (section1Ref.current && section2Ref.current) {
        const height1 = section1Ref.current.clientHeight;
        const height2 = section2Ref.current.clientHeight;
        setMaxHeight(`${Math.max(height1, height2)}px`);
      }
    };

    adjustHeight();
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, [auction]);

  useEffect(() => {
    console.log('[Debug] Setting up socket connection for auction:', id);
    const socket = getSocket();
    
    // 加入特定拍卖的房间
    joinAuctionRoom(id);
    
    // 监听出价更新事件
    socket.on('bid_updated', (data) => {
      console.log('[Debug] Received bid_updated event:', data);
      if (data.item_id === parseInt(id)) {
        // 更新当前出价
        setAuction(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            current_bid: parseFloat(data.bid_amount),
            highest_bidder_id: data.bidder_id
          };
        });
        
        // 更新建议的出价金额
        setBidAmount(parseFloat(data.bid_amount) + 5);
        
        // 根据需要可以显示通知
        if (user?.id !== data.bidder_id) {
          setSuccess(`New bid of £${data.bid_amount} by ${data.bidder_name}`);
          setTimeout(() => setSuccess(""), 3000);
        }
      }
    });
    
    // 清理函数
    return () => {
      console.log('[Debug] Cleaning up socket connection for auction:', id);
      socket.off('bid_updated');
      leaveAuctionRoom(id);
    };
  }, [id, user]);

  const handlePlaceBid = () => {
    setBidError("");
    
    const minimumBid = auction.current_bid + 5;
    if (parseFloat(bidAmount) < minimumBid) {
      setBidError(`Your bid must be at least £${minimumBid}`);
      return;
    }
    
    if (!paymentMethod) {
      setShowBidForm(true);
      return;
    }
    
    console.log(`Placing bid of £${bidAmount} on item ${id}`);
    setAuction({
      ...auction,
      current_bid: parseFloat(bidAmount)
    });
  };

  const handlePaymentSuccess = (paymentInfo) => {
    setPaymentMethod(paymentInfo);
    setShowBidForm(false);
    setAuction({
      ...auction,
      current_bid: parseFloat(bidAmount),
      highest_bidder_id: user?.id
    });
  };

  const handleWinPayment = () => {
    setTimeout(() => {
      setPaymentSuccess(true);
    }, 1500);
  };

  const handleBidAmountChange = (e) => {
    const newAmount = e.target.value;
    setBidAmount(newAmount);
    setBidError("");
    
    if (paymentMethod && parseFloat(newAmount) !== auction.current_bid) {
      setPaymentMethod(null);
    }
  };

  const handleBidSubmit = (e) => {
    e.preventDefault();
    console.log('Bid submit clicked', bidAmount, auction.current_bid, auction.min_price);
    
    const bidError = validateBidAmount(bidAmount, auction.current_bid, auction.min_price);
    if (bidError) {
      setBidError(bidError);
      console.log('Bid validation error:', bidError);
      return;
    }
    
    setShowPaymentSelector(true);
  };

  const handleCardSelected = async (card) => {
    try {
      console.log('[Debug] handleCardSelected started:', card);
      if (!card) {
        console.log('[Debug] No payment card selected, closing selector');
        setShowPaymentSelector(false);
        return; 
      }
      
      setShowPaymentSelector(false);
      setPlacingBid(true);
      
      console.log('[Debug] Selected payment card:', card);
      
      const token = localStorage.getItem('token');
      let userId;
      
      if (user && user.id) {
        userId = user.id;
        console.log('[Debug] User ID obtained from useAuth:', userId);
      } else if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          userId = payload.id;
          console.log('[Debug] User ID obtained from JWT token:', userId);
        } catch (error) {
          console.error('[Debug] Error parsing JWT token:', error);
          setError('Unable to determine your identity, please log in again');
          setPlacingBid(false);
          return;
        }
      }
      
      if (!userId) {
        console.error('[Debug] Unable to get user ID');
        setError('You need to be logged in to bid');
        setPlacingBid(false);
        return;
      }
      
      const bidData = {
        user_id: userId,
        item_id: parseInt(id),
        bid_amount: parseFloat(bidAmount)
      };
      
      console.log('[Debug] Preparing to submit bid:', bidData);
      
      // 显示加载状态至少1秒，提供更好的用户体验
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 只使用/api/bids路径发送请求
      console.log('[Debug] Submitting bid to /api/bids');
      const response = await axios.post('/api/bids', bidData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[Debug] Bid response:', response.data);
      
      setPaymentMethod(card);
      
      const currentBidAmount = bidAmount;
      
      console.log('[Debug] Before updating auction state, current auction:', auction);
      
      setAuction(prev => {
        if (!prev) {
          console.error('[Debug] auction is null, cannot update');
          return null;
        }
        console.log('[Debug] Updating auction state', {
          ...prev,
          current_bid: parseFloat(bidAmount),
          highest_bidder_id: userId
        });
        return {
          ...prev,
          current_bid: parseFloat(bidAmount),
          highest_bidder_id: userId
        };
      });
      
      console.log('[Debug] Setting new bid amount');
      setBidAmount(parseFloat(bidAmount) + 5);
      
      console.log('[Debug] Setting success message');
      setSuccess(`Your bid of £${currentBidAmount} has been successfully submitted!`);
      setTimeout(() => setSuccess(""), 3000);
      
      console.log('[Debug] Setting bidPlaced to true');
      setBidPlaced(true);
      
    } catch (error) {
      console.error('[Debug] Bid error:', error);
      
      let errorMessage = 'Bid failed, please try again';
      
      if (error.response) {
        // 服务器返回了错误状态码
        errorMessage = error.response.data?.error || 
                       error.response.data?.message || 
                       `Server error (${error.response.status})`;
        console.error('[Debug] Server error:', error.response.data);
      } else if (error.request) {
        // 请求发出但没有收到响应
        errorMessage = 'Unable to connect to the server, please check your network connection';
        console.error('[Debug] Request error:', error.request);
      } else {
        // 其他错误
        errorMessage = error.message || errorMessage;
        console.error('[Debug] Unknown error:', error.message);
      }
      
      setError(errorMessage);
    } finally {
      console.log('[Debug] Bid processing completed, setting placingBid to false');
      setPlacingBid(false);
    }
  };

  const fetchAuctionData = async () => {
    console.log('[Debug] Fetching auction data:', id);
    try {
      const auctionData = await fetchAuctionById(id);
      console.log('[Debug] Auction data fetched successfully:', auctionData);
      
      // 检查关键数据
      console.log('[Debug] Checking auction data structure:');
      console.log('  - id:', safeAccess(auctionData, 'id'));
      console.log('  - title:', safeAccess(auctionData, 'title'));
      console.log('  - current_bid:', safeAccess(auctionData, 'current_bid'));
      console.log('  - images type:', Array.isArray(safeAccess(auctionData, 'images')) ? 'array' : typeof safeAccess(auctionData, 'images'));
      console.log('  - images length:', Array.isArray(safeAccess(auctionData, 'images')) ? safeAccess(auctionData, 'images').length : 'N/A');

      setAuction(auctionData);
      setBidAmount((safeAccess(auctionData, 'current_bid', 0) + 5));
    } catch (error) {
      console.error("[Debug] Error fetching auction details:", error);
      setError("Unable to get auction information");
    }
  };

  console.log('[Debug] Current rendering state:', {
    auction: auction ? 'loaded' : 'not loaded',
    bidAmount,
    showPaymentSelector,
    placingBid,
    success: success ? 'has message' : 'no message',
    error: error ? 'has error' : 'no error',
    paymentMethod: paymentMethod ? 'selected' : 'not selected',
  });

  if (!auction) {
    console.log('[Debug] auction is empty, showing loading');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gold"></div>
        <p className="ml-4 text-xl">Loading auction information...</p>
      </div>
    );
  }

  console.log('[Debug] Preparing to render full interface');
  console.log('[Debug] auction.images:', auction.images);
  
  // 检查images是否为数组
  if (!Array.isArray(auction.images)) {
    console.error('[Debug] auction.images is not an array:', auction.images);
    // 确保images始终是数组
    auction.images = auction.images || [];
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4 -mt-16">
      <div className="flex flex-col md:flex-row items-stretch gap-6 p-4 max-w-5xl w-full mx-auto mt-16">
        {success && (
          <div className="fixed top-20 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 z-50 rounded shadow-md">
            {success}
          </div>
        )}
        {error && (
          <div className="fixed top-20 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 z-50 rounded shadow-md">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
          </div>
        )}
        
        <div
          ref={section1Ref}
          className="relative flex justify-center items-center w-full md:w-1/2 border border-black p-2"
          style={{ minHeight: maxHeight }}
        >
          {/* 使用防御性检查 */}
          {safeAccess(auction, 'authentication_status') === 'Approved' ? (
            <img
              src={authenticatedIcon}
              alt="Authenticated Icon"
              className="absolute top-2 left-2 w-12 h-12 z-10 opacity-90"
            />
          ) : null}
          
          <Carousel
            responsive={responsive}
            showDots={true}
            infinite={true}
            autoPlay={false}
            className="w-full bg-black"
          >
            {Array.isArray(auction.images) && auction.images.length > 0 ? (
              auction.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Auction Item ${index + 1}`}
                  className="w-full max-h-80 object-contain"
                />
              ))
            ) : (
              <p>No images available</p>
            )}
          </Carousel>
          <div className="absolute bottom-4 right-4 bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-100">
            {remainingTime == 'Active' ? "Ended" : remainingTime}
          </div>
        </div>

        <div
          ref={section2Ref}
          className="flex flex-col w-full md:w-1/2 gap-2 text-center md:text-left flex-grow"
          style={{ minHeight: maxHeight }}
        >
          <h2 className="text-2xl font-semibold">{safeAccess(auction, 'title', '')}</h2>
          <p className="text-gray-600 mb-2">{safeAccess(auction, 'description', '')}</p>
          <p className="text-sm text-gray-500">
            Posted on {formatDate(safeAccess(auction, 'posting_date', new Date()))}
          </p>

          <div className="border border-gray-300 p-4 flex-grow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-gray-600">Current Bid</p>
                <p className="text-3xl font-bold">£ {safeAccess(auction, 'current_bid', 0)}</p>
              </div>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="cursor-pointer"
              >
                <Star
                  size={24}
                  className={isFavorite ? "text-yellow-400" : "text-gray-400"}
                  fill={isFavorite ? "#facc15" : "none"}
                />
              </button>
            </div>
            
            {paymentMethod && (
              <div className="bg-gray-100 p-3 rounded mb-3">
                <p className="font-semibold">Payment Method</p>
                <p className="text-sm">
                  {safeAccess(paymentMethod, 'cardType', 'Unknown')} card ending in {
                    safeAccess(paymentMethod, 'last4') || 
                    (safeAccess(paymentMethod, 'cardNumber') ? 
                      safeAccess(paymentMethod, 'cardNumber').slice(-4) : 
                      '****')
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">Your card will be charged automatically if you win the auction</p>
              </div>
            )}
            
            {isAuctionEnded ? (
              <div className="mt-4">
                <div className="bg-gray-100 p-3 rounded mb-3 text-center">
                  <p className="font-semibold">This auction has ended</p>
                  {user && user.id === safeAccess(auction, 'highest_bidder_id', null) && (
                    <p className="text-green-600 mt-2">Congratulations! You won this auction.</p>
                  )}
                </div>
                
                {user && user.id === safeAccess(auction, 'highest_bidder_id', null) && (
                  <button 
                    className="w-full bg-gold text-white py-2 mt-2 hover:bg-yellow-600 cursor-pointer"
                    onClick={handleWinPayment}
                  >
                    Complete Purchase
                  </button>
                )}
              </div>
            ) : (
              <>
                <input
                  type="number"
                  className="w-full p-2 mt-2 bg-gray-200 placeholder-gray-400"
                  placeholder={`£ ${safeAccess(auction, 'current_bid', 0) + 5} or up`}
                  value={bidAmount}
                  onChange={handleBidAmountChange}
                  min={safeAccess(auction, 'current_bid', 0) + 5}
                  step="5"
                />
                {bidError && (
                  <div className="bg-red-100 text-red-700 p-2 mt-2 rounded text-sm">
                    {bidError}
                  </div>
                )}
                <button 
                  className="w-full bg-gold text-white py-2 mt-2 hover:bg-yellow-600 cursor-pointer"
                  onClick={handleBidSubmit}
                >
                  Place Bid
                </button>
              </>
            )}
            
            <p className="text-center text-gray-600 mt-2">
              Selected by <span className="underline">{safeAccess(auction, 'seller_name', 'Seller')}</span>
            </p>
          </div>
        </div>
      </div>

      {showPaymentSelector && (
        <>
          {/* 半透明背景 */}
          <div 
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => {
              console.log('[Debug] Clicked background to close payment selector');
              setShowPaymentSelector(false);
            }}
          ></div>
          
          {/* 模态框内容 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-xl">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Select Payment Method</h3>
                <button 
                  onClick={() => {
                    console.log('[Debug] Clicked X to close payment selector');
                    setShowPaymentSelector(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <PaymentCardSelector
                  onCardSelected={(card) => {
                    console.log('[Debug] PaymentCardSelector component selected card:', card);
                    handleCardSelected(card);
                  }}
                  amount={parseFloat(bidAmount)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {placingBid && (
        <>
          {/* 半透明背景 */}
          <div 
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          ></div>
          
          {/* 模态框内容 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-xl">
            <div className="bg-white p-8 rounded-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gold mb-4"></div>
              <p className="text-gray-800 text-xl font-medium">Processing your bid...</p>
              <p className="text-gray-600 mt-2">Please wait a moment, do not refresh the page</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuctionDetails;
