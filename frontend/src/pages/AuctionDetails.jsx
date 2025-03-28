import React, { useEffect, useState, useRef, useContext } from "react";
import { useAuth } from "../context/authContext";
import axios from "../api/axios";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Star } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import PaymentForm from '../components/payment/PaymentForm';
import PaymentSuccess from '../components/payment/PaymentSuccess';
import PaymentCardSelector from '../components/payment/PaymentCardSelector';
import { validateBidAmount } from '../components/BidForm';
import authenticatedIcon from "../assets/authenticatedIcon.png";
import { submitBid, fetchAuctionById } from '../api/bid';
import { getSocket, joinAuctionRoom, leaveAuctionRoom, joinUserRoom } from '../socket';

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

const safeAccess = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
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
    const fetchAuctionDetails = async () => {
      try {
        const response = await axios.get(`/api/auctions/${id}`);
        console.log('Received auction details:', response.data);
        
        if (response.data) {
          setAuction(response.data);
          setBidAmount(response.data.current_bid + 5);
          setRemainingTime(calculateTimeRemaining(response.data.end_time, response.data.auction_status));
        }
      } catch (error) {
        console.error('Error fetching auction details:', error);
        setError(error.response?.data?.error || 'Failed to load auction details');
      }
    };

    if (id) {
      fetchAuctionDetails();
    }
  }, [id]);

  useEffect(() => {
    if (!auction?.end_time) return; // Ensure end_time exists before setting the interval

    const updateRemainingTime = () => {
      setRemainingTime(calculateTimeRemaining(auction.end_time, auction.auction_status));
    };

    updateRemainingTime(); // Set initial value immediately

    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [auction?.end_time]); // Run effect when auction.end_time changes

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
        // 确保使用函数式更新，保证基于最新状态更新
        setAuction(prev => {
          if (!prev) return null;
          
          const updatedAuction = {
            ...prev,
            current_bid: parseFloat(data.bid_amount),
            highest_bidder_id: data.bidder_id
          };
          
          console.log('[Debug] Updating auction with new data:', updatedAuction);
          return updatedAuction;
        });
        
        // 立即更新出价金额建议
        setBidAmount(prev => parseFloat(data.bid_amount) + 5);
        
        // 显示更新通知
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

  useEffect(() => {
    if (auction) {
      console.log('[Debug] Auction state changed:', { 
        id: auction.id,
        current_bid: auction.current_bid,
        highest_bidder_id: auction.highest_bidder_id,
        bidAmount: bidAmount
      });
    }
  }, [auction, bidAmount]);

  const handlePlaceBid = () => {
    // 清除之前的错误
    setBidError("");
    
    // 检查出价是否满足最低要求
    const minimumBid = auction.current_bid + 5;
    if (parseFloat(bidAmount) < minimumBid) {
      setBidError(`Your bid must be at least £${minimumBid}`);
      return;
    }
    
    if (!paymentMethod) {
      // 如果用户还没有添加支付方式，先显示支付表单
      setShowBidForm(true);
      return;
    }
    
    // 实际实现中会调用API提交出价
    console.log(`Placing bid of £${bidAmount} on item ${id}`);
    // 模拟成功出价
    setAuction(prev => {
      if (!prev) return null;
      
      const updatedAuction = {
        ...prev,
        current_bid: parseFloat(bidAmount),
        highest_bidder_id: user?.id
      };
      
      console.log('[Debug] Updating auction state to:', updatedAuction);
      return updatedAuction;
    });
  };

  const handlePaymentSuccess = (paymentInfo) => {
    // 保存支付方式信息
    setPaymentMethod(paymentInfo);
    // 关闭支付表单
    setShowBidForm(false);
    // 提交出价
    setAuction(prev => {
      if (!prev) return null;
      
      const updatedAuction = {
        ...prev,
        current_bid: parseFloat(bidAmount),
        highest_bidder_id: user?.id
      };
      
      console.log('[Debug] Updating auction state to:', updatedAuction);
      return updatedAuction;
    });
  };

  const handleWinPayment = () => {
    // 模拟自动支付处理
    setTimeout(() => {
      setPaymentSuccess(true);
    }, 1500);
  };

  // 当用户更改出价时，清除已保存的支付方式，要求重新输入
  const handleBidAmountChange = (e) => {
    const newAmount = e.target.value;
    setBidAmount(newAmount);
    setBidError(""); // 清除错误消息
    
    // 如果金额变化，清除已保存的支付方式
    if (paymentMethod && parseFloat(newAmount) !== auction.current_bid) {
      setPaymentMethod(null);
    }
  };

  const handleBidSubmit = (e) => {
    e.preventDefault();
    console.log('Bid submit clicked', bidAmount, auction.current_bid, auction.min_price);
    
    // 验证出价
    const bidError = validateBidAmount(bidAmount, auction.current_bid, auction.min_price);
    if (bidError) {
      setBidError(bidError);
      console.log('Bid validation error:', bidError);
      return;
    }
    
    console.log('Showing payment selector');
    // 显示支付卡选择界面
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
      
      // 在客户端先检查是否是自己的商品 - 如果auction对象包含seller_id或user_id
      if (auction.user_id && userId === auction.user_id) {
        console.log('[Debug] Cannot bid on your own item');
        setError('You cannot bid on your own auction item');
        setPlacingBid(false);
        return;
      }
      
      const bidData = {
        user_id: userId,
        item_id: parseInt(id),
        bid_amount: parseFloat(bidAmount),
        payment_method_id: card.id
      };
      
      console.log('[Debug] Preparing to submit bid:', bidData);
      
      // 显示加载状态至少1秒
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 使用submitBid函数发送请求
      const result = await submitBid(bidData);
      console.log('[Debug] Bid result:', result);
      
      // 保存支付方式
      setPaymentMethod(card);
      
      // 更新拍卖信息
      setAuction(prev => {
        if (!prev) return null;
        return {
          ...prev,
          current_bid: parseFloat(bidAmount),
          highest_bidder_id: userId
        };
      });
      
      // 更新下一次出价建议
      setBidAmount(parseFloat(bidAmount) + 5);
      
      // 显示成功消息
      setSuccess(`Your bid of £${bidAmount} has been successfully submitted!`);
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (error) {
      console.error('[Debug] Bid error:', error);
      
      // 设置错误消息，显示在界面上
      setError(error.message || "Failed to place bid");
    } finally {
      setPlacingBid(false);
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!auction) return <p>Loading auction details...</p>;

  return (
    <div className="flex justify-center items-center min-h-screen p-4 -mt-16">
      {/* 添加通知栏 */}
      {success && (
        <div className="fixed top-20 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded max-w-md shadow-md">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="ml-auto">×</button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed top-20 right-4 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded max-w-md shadow-md">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto">×</button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-stretch gap-6 p-4 max-w-5xl w-full mx-auto mt-16">
        <div
          ref={section1Ref}
          className="relative flex justify-center items-center w-full md:w-1/2 border border-black p-2"
          style={{ minHeight: maxHeight }}
        >
          {auction.authentication_status == 'Approved' ? (
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
            {auction.images.length > 0 ? (
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
          <h2 className="text-2xl font-semibold">{auction.title}</h2>
          <p className="text-gray-600 mb-2">{auction.description}</p>
          <p className="text-sm text-gray-500">
            Posted on {new Date(auction.posting_date).toLocaleDateString()}
          </p>

          <div className="border border-gray-300 p-4 flex-grow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-gray-600">Current Bid</p>
                <p className="text-3xl font-bold">£ {auction.current_bid}</p>
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
                  {paymentMethod.cardType || paymentMethod.card_type || 'Card'} 
                  ending in 
                  {paymentMethod.cardNumber 
                    ? paymentMethod.cardNumber.slice(-4) 
                    : (paymentMethod.last4 || '****')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Your card will be charged automatically if you win the auction</p>
              </div>
            )}
            
            {isAuctionEnded ? (
              <div className="mt-4">
                <div className="bg-gray-100 p-3 rounded mb-3 text-center">
                  <p className="font-semibold">This auction has ended</p>
                  {user && user.id === auction.highest_bidder_id && (
                    <p className="text-green-600 mt-2">Congratulations! You won this auction.</p>
                  )}
                </div>
                
                {user && user.id === auction.highest_bidder_id && (
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
                  placeholder={`£ ${auction.current_bid + 5} or up`}
                  value={bidAmount}
                  onChange={handleBidAmountChange}
                  min={auction.current_bid + 5}
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
              Selected by <span className="underline">{auction.seller_name}</span>
            </p>
          </div>
        </div>
      </div>

      {showBidForm && !paymentMethod && (
        <>
          {/* 半透明背景 */}
          <div 
            className="fixed inset-0 z-40" 
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setShowBidForm(false)}
          ></div>
          
          {/* 模态框内容 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-xl">
            <div className="bg-white rounded-lg w-[1000px] max-w-[90vw]">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Add Payment Method to Bid</h3>
                <button 
                  onClick={() => setShowBidForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-8">
                <p className="mb-4 text-gray-700">To participate in this auction, please add a payment method. Your card will only be charged if you win the auction.</p>
                <PaymentForm 
                  amount={parseFloat(bidAmount)} 
                  itemId={auction.id}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {paymentSuccess && (
        <>
          {/* 半透明背景 */}
          <div 
            className="fixed inset-0 z-40" 
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          ></div>
          
          {/* 模态框内容 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-xl">
            <div className="bg-white rounded-lg w-[1000px] max-w-[90vw] p-12">
              <PaymentSuccess 
                amount={parseFloat(bidAmount)}
                itemTitle={auction.title}
              />
            </div>
          </div>
        </>
      )}

      {showPaymentSelector && (
        <>
          {/* 半透明背景 */}
          <div 
            className="fixed inset-0 z-40" 
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setShowPaymentSelector(false)}
          ></div>
          
          {/* 模态框内容 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-xl">
            <div className="bg-white rounded-lg w-[1000px] max-w-[90vw]">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Select Payment Method</h3>
                <button 
                  onClick={() => setShowPaymentSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-8">
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

      {/* Processing Modal */}
      {placingBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mb-4"></div>
            <p className="text-gray-700">Processing payment...</p>
            <p className="text-xs text-gray-500 mt-2">Connecting to Stripe...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDetails;
