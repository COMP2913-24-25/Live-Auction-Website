import { useEffect, useState } from 'react';
import axios from 'axios';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { useNavigate, useLocation } from 'react-router-dom';
import authenticatedIcon from '../assets/authenticatedIcon.png';
import { getSocket } from '../socket';

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

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAuctions = async (queryParams) => {
    try {
      const response = await axios.get(`/api/auctions/active?${queryParams.toString()}`);
      
      if (!response.data) throw new Error('No data received');

      const formattedAuctions = response.data.map(auction => ({
        ...auction,
        imageUrls: auction.image_urls ? auction.image_urls.split(',') : [],
        remainingTime: calculateTimeRemaining(auction.end_time, auction.auction_status)
      }));

      setAuctions(formattedAuctions);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (!queryParams.has('_t')) {
      queryParams.append('_t', Date.now());
    }
    if (!queryParams.has('sort')) {
      queryParams.append('sort', 'created_at');
    }
    if (!queryParams.has('order')) {
      queryParams.append('order', 'desc');
    }
    fetchAuctions(queryParams);
  }, [location.search]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAuctions(prevAuctions => prevAuctions.map(auction => ({
        ...auction,
        remainingTime: calculateTimeRemaining(auction.end_time, auction.auction_status)
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('Setting up socket connection for auction list');
    const socket = getSocket();
    
    // 添加出价更新监听事件
    const onBidUpdated = (data) => {
      console.log('接收到bid_updated事件:', data);
      
      // 确保类型一致，将item_id转为数字类型
      const updatedItemId = parseInt(data.item_id);
      
      // 直接使用函数式更新，不依赖auctions的闭包值
      setAuctions(prevAuctions => {
        // 记录调试信息
        console.log('更新前的拍卖列表:', prevAuctions.map(a => ({ id: a.id, current_bid: a.current_bid })));
        
        const updatedAuctions = prevAuctions.map(auction => {
          // 将auction.id转为数字进行比较
          const auctionId = parseInt(auction.id);
          
          // 如果是被更新的拍卖项，更新价格
          if (auctionId === updatedItemId) {
            console.log(`找到匹配的拍卖项 ID:${auctionId}，更新价格从 ${auction.current_bid} 到 ${data.bid_amount}`);
            return {
              ...auction,
              current_bid: parseFloat(data.bid_amount)
            };
          }
          return auction;
        });
        
        console.log('更新后的拍卖列表:', updatedAuctions.map(a => ({ id: a.id, current_bid: a.current_bid })));
        return updatedAuctions;
      });
    };
    
    // 监听连接状态
    const onConnect = () => {
      console.log('AuctionList socket connected successfully');
    };
    
    // 监听新拍卖创建事件
    const onNewAuction = (auctionData) => {
      console.log('Received new_auction event:', auctionData);
      
      // 处理收到的拍卖数据
      const formattedAuction = {
        ...auctionData,
        imageUrls: auctionData.imageUrls || [],
        remainingTime: auctionData.remainingTime || calculateTimeRemaining(auctionData.end_time, auctionData.auction_status)
      };
      
      // 将新拍卖添加到列表中
      setAuctions(prevAuctions => {
        // 如果拍卖已经存在，则不添加
        if (prevAuctions.some(a => a.id === formattedAuction.id)) {
          return prevAuctions;
        }
        
        // 将新拍卖添加到列表最前面
        return [formattedAuction, ...prevAuctions];
      });
    };
    
    // 添加事件监听
    socket.on('connect', onConnect);
    socket.on('new_auction', onNewAuction);
    socket.on('bid_updated', onBidUpdated);
    
    // 清理函数
    return () => {
      console.log('Cleaning up socket connection for auction list');
      socket.off('connect', onConnect);
      socket.off('new_auction', onNewAuction);
      socket.off('bid_updated', onBidUpdated);
    };
  }, []); // 保持空依赖数组，但确保函数内部不依赖闭包中的状态

  const responsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 640 }, items: 1 },
    mobile: { breakpoint: { max: 640, min: 0 }, items: 1 }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className='flex justify-center items-center'>
        <div className='text-4xl text-center font-bold'>{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-6 py-6">
        {auctions.length === 0 ? (
          <div className="text-center text-gray-500 p-6">
            No items found in this category
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctions.map(auction => (
              <div 
                key={auction.id} 
                className="bg-white shadow-lg overflow-hidden cursor-pointer" 
                onClick={(e) => {
                  if (e.target.closest('object-cover') && !e.target.closest('.react-multi-carousel-arrow') && !e.target.closest('.react-multi-carousel-dot')) {
                    navigate(`/auctions/${auction.id}`);
                  }
                }}
              >
                <div className="relative">
                  {auction.authentication_status === 'Approved' ? (
                    <img
                      src={authenticatedIcon}
                      alt="Authenticated Badge"
                      className="absolute top-2 left-2 w-12 h-12 z-10 opacity-90"
                    />
                  ) : null}
                  {auction.imageUrls.length > 0 && (
                    <Carousel
                      responsive={responsive}
                      infinite={true}
                      autoPlay={false}
                      showDots={true}
                      itemClass="w-full"
                      containerClass="relative"
                    >
                      {auction.imageUrls.map((url, index) => (
                        <div key={index} className="flex justify-center">
                          <img
                            src={url}
                            alt={`${auction.title} image ${index + 1}`}
                            className="object-cover h-96 w-full cursor-pointer"
                            onClick={() => navigate(`/auctions/${auction.id}`)}
                          />
                        </div>
                      ))}
                    </Carousel>
                  )}
                  <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-sm px-2 py-1 rounded">
                    {(auction.remainingTime) == "Active" ? "Ended" : auction.remainingTime}
                  </div>
                </div>
                <div className="p-4 text-center" onClick={() => navigate(`/auctions/${auction.id}`)}>
                  <h2 className="text-2xl font-semibold text-navy">{auction.title}</h2>
                  <p className="text-sm text-gray-600">Current bid: £{auction.current_bid}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionList;
