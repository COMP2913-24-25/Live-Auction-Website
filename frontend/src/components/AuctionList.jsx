import { useEffect, useState } from 'react';
import axios from 'axios';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { useNavigate } from 'react-router-dom';
import authenticated from '../assets/authenticated.png';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/auctions')
      .then(response => {
        const data = Array.isArray(response.data) ? response.data.map(auction => ({
          ...auction,
          imageUrls: auction.image_urls ? auction.image_urls.split(',') : [],
          remainingTime: calculateTimeRemaining(auction.end_time)
        })) : [];
        setAuctions(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAuctions(prevAuctions => prevAuctions.map(auction => ({
        ...auction,
        remainingTime: calculateTimeRemaining(auction.end_time)
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateTimeRemaining = (endTime) => {
    if (!endTime) return "Auction Ended";
  
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;
  
    if (difference <= 0) return "Auction Ended";
  
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    
    if (days >= 1) {
      return `${days} day${days > 1 ? "s" : ""} left`;
    }
  
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
  
    return `${hours}h ${minutes}m ${seconds}s`;
  };
  

  const responsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 640 }, items: 1 },
    mobile: { breakpoint: { max: 640, min: 0 }, items: 1 }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="w-full min-h-screen max-w-7xl mx-auto px-12 pb-20">
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
              {auction.authenticated == true ? (
                <img
                  src={authenticated}
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
                {auction.remainingTime}
              </div>
            </div>
            <div className="p-4 text-center" onClick={() => navigate(`/items/${auction.id}`)}>
              <h2 className="text-2xl font-semibold text-navy">{auction.title}</h2>
              <p className="text-sm text-gray-600">Current bid: £{auction.current_bid}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuctionList;
