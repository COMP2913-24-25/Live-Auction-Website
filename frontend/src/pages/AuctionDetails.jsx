import { useEffect, useState, useRef, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Star } from "lucide-react";
import { useParams } from "react-router-dom";
import authenticatedIcon from "../assets/authenticatedIcon.png";
import AuthRequestForm from '../Components/authentication/AuthRequestForm';
import PlaceBidModal from '../Components/PlaceBidModal';
import BidForm from '../Components/BidForm';
import { AuthContext } from '../context/AuthContext';
import AuctionSuccessModal from '../Components/AuctionSuccessModal';

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


const AuctionDetails = () => {
  const { user, devMode, skipAuthentication } = useContext(AuthContext);
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [maxHeight, setMaxHeight] = useState("auto");
  const [remainingTime, setRemainingTime] = useState("");
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidError, setBidError] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const section1Ref = useRef(null);
  const section2Ref = useRef(null);

  console.log("当前用户状态:", user);
  console.log("localStorage中的数据:", localStorage.getItem('user'));

  useEffect(() => {
    // 设置请求头中的令牌
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    axios
      .get(`/api/auctions/${id}`)
      .then((response) => {
        setAuction(response.data);
        setBidAmount(response.data.current_bid + 5);
      })
      .catch((error) =>
        console.error("Error fetching auction details:", error)
      );
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
    if (auction && user) {
      // 检查拍卖是否已结束
      const now = new Date().getTime();
      const endTime = new Date(auction.end_time).getTime();
      const isAuctionEnded = now > endTime;
      
      // 检查当前用户是否是最高出价者
      if (isAuctionEnded && auction.highest_bidder_id === user.id) {
        // 如果拍卖已结束且当前用户是最高出价者，显示成功模态窗口
        setShowSuccessModal(true);
      }
    }
  }, [auction, user]);

  useEffect(() => {
    // 强制从localStorage刷新用户状态
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('重新加载用户数据:', userData);
        // 这里我们可以直接使用userData，
        // 或者您可以调用全局的login函数来更新context
      } catch (e) {
        console.error('解析用户数据错误:', e);
      }
    }
  }, [user]);

  const handleAuthRequest = () => {
    setShowAuthForm(true);
  };

  const openBidModal = () => {
    setShowBidModal(true);
  };

  const closeBidModal = () => {
    setShowBidModal(false);
  };

  const handleBidSubmit = async () => {
    // 恢复登录检查
    if (!user) {
      setBidError("Please login first");
      return;
    }
    
    if (bidAmount <= auction.current_bid) {
      setBidError(`The bid must be higher than the current price £${auction.current_bid}`);
      return;
    }
    
    setSubmittingBid(true);
    setBidError("");
    setBidSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/bids', {
        item_id: auction.id,
        bid_amount: bidAmount
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setBidSuccess(true);
        setBidError("");
        
        // Refresh product data
        fetchAuctionDetails();
        
        // Automatically open the bid history after success
        setTimeout(() => {
          setShowBidModal(true);  
        }, 1000);
        
        setTimeout(() => {
          setBidSuccess(false);
        }, 3000);
      } else {
        setBidSuccess(false);
        setBidError(response.data.error || "Bid failed, please try again");
      }
    } catch (error) {
      console.error("Bidding error:", error);
      setBidSuccess(false);
      setBidError(
        error.response?.data?.error || 
        (error.response?.status === 401 ? "Please login first" : "An error occurred during the bidding process")
      );
    } finally {
      setSubmittingBid(false);
    }
  };

  const fetchAuctionDetails = () => {
    axios
      .get(`/api/auctions/${id}`)
      .then((response) => {
        setAuction(response.data);
        setBidAmount(response.data.current_bid + 5);
      })
      .catch((error) =>
        console.error("Error fetching auction details:", error)
      );
  };

  console.log("渲染竞价按钮前，user值:", !!user);

  if (!auction) return <p>Loading auction details...</p>;

  return (
    <div className="flex justify-center items-center min-h-screen p-4 -mt-16">
      <div className="flex flex-col md:flex-row items-stretch gap-6 p-4 max-w-5xl w-full mx-auto mt-16">
        {/* Section 1 - Carousel */}
        <div
          ref={section1Ref}
          className="relative flex justify-center items-center w-full md:w-1/2 border border-black p-2"
          style={{ minHeight: maxHeight }}
        >
          {auction.authentication_status == 'Approved' == true ? (
            <img
              src={authenticatedIcon}
              alt="Authenticated Icon"
              className="absolute top-2 left-2 w-12 h-12 z-10 opacity-90"
            />
          ) : null }
          <Carousel
            responsive={responsive}
            showDots={true}
            infinite={true}
            autoPlay={false}
            className="w-full max-w-sm"
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
            {/* If timer runs out, show Ended instead of Active. On reload, will display real auction_status */}
            {remainingTime == 'Active' ? "Ended" : remainingTime}
          </div>
        </div>

        {/* Section 2 - Auction Details */}
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
            <input
              type="number"
              className="w-full p-2 mt-2 bg-gray-200 placeholder-gray-400"
              placeholder={`£ ${auction.current_bid + 5} or up`}
              value={bidAmount}
              onChange={(e) => setBidAmount(parseFloat(e.target.value))}
            />
            <div>
              {/* 显示调试信息 */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="text-xs text-gray-500 mb-2">
                  User status: {user ? 'Logged in as ' + user.username : 'Not logged in'}
                </div>
              )}
              
              {/* 修改条件渲染逻辑，确保只渲染一个元素 */}
              {user ? (
                <button 
                  className="w-full bg-yellow-700 hover:bg-yellow-800 text-white py-2 px-4 rounded"
                  onClick={handleBidSubmit}
                  disabled={submittingBid}
                >
                  {submittingBid ? "Processing..." : "Place Bid"}
                </button>
              ) : (
                <div className="bg-pink-100 text-red-500 p-4 text-center rounded-md">
                  Please login before bidding
                </div>
              )}
            </div>
            
            {bidError && (
              <div className="text-red-500 bg-red-100 p-2 mt-2 rounded text-center">
                {bidError}
              </div>
            )}
            
            {bidSuccess && (
              <div className="text-green-700 bg-green-100 p-2 mt-2 rounded text-center">
                Bid successful! Your bid has been accepted.
              </div>
            )}
            
            {!auction.authenticated && (
              <div className="mt-4 border-t pt-4">
                <button 
                  onClick={handleAuthRequest}
                  className="w-full bg-blue-500 text-white py-2 hover:bg-blue-600 rounded"
                >
                  Submit authentication request
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-gray-600 mt-2">
            Selected by <span className="underline">{auction.seller_name}</span>
          </p>
        </div>
      </div>

      {showAuthForm && (
        <AuthRequestForm
          itemId={auction.id}
          onClose={() => setShowAuthForm(false)}
          onSuccess={() => {
            setShowAuthSuccess(true);
            setShowAuthForm(false);
          }}
        />
      )}

      {auction && (
        <PlaceBidModal
          isOpen={showBidModal}
          onClose={closeBidModal}
          currentBid={auction.current_bid}
          itemId={auction.id}
          itemTitle={auction.title}
          historyOnly={true}
        />
      )}

      {auction && (
        <AuctionSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          item={auction}
        />
      )}
    </div>
  );
};

export default AuctionDetails;
