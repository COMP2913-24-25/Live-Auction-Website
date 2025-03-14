import { useEffect, useState } from 'react';
import axios from 'axios';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { useNavigate } from 'react-router-dom';
import authenticatedIcon from '../assets/authenticatedIcon.png';

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

const AuctionList = ({ filters }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('query', filters.search);
        if (filters.categories.length > 0) params.append('categories', filters.categories.join(','));
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.authenticatedOnly) params.append('authenticatedOnly', 'true');
        if (filters.daysRemaining) params.append('daysRemaining', filters.daysRemaining);

        const response = await axios.get(`/api/search?${params.toString()}`);
        
        if (!response.data) throw new Error('No data received');

        const formattedAuctions = response.data.map(auction => ({
          ...auction,
          imageUrls: auction.image_urls ? auction.image_urls.split(',') : [],
          remainingTime: calculateTimeRemaining(auction.end_time, auction.auction_status)
        }));

        setAuctions(formattedAuctions);
        setLoading(false);
<<<<<<< HEAD
      })
      .catch(error => {
        if (error.response && error.response.status === 404) {
          setError('No active auctions available.');
        } else {
          setError('Something went wrong. Please try again later.');
        }
=======
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.message);
>>>>>>> origin/sprint-2
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAuctions(prevAuctions => prevAuctions.map(auction => ({
        ...auction,
        remainingTime: calculateTimeRemaining(auction.end_time, auction.auction_status)
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
<<<<<<< HEAD
    <div className="w-full max-w-7xl mx-auto px-12 pb-20">
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
              {auction.authentication_status == 'Approved' ? (
                <img
                  src={authenticatedIcon}
                  alt="Authenticated Icon"
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
              <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-100">
                {/* If timer runs out, show Ended instead of Active. On reload, will display real auction_status */}
                {(auction.remainingTime) == "Active" ? "Ended" : auction.remainingTime}
              </div>
            </div>
            <div className="p-4 text-center" onClick={() => navigate(`/auctions/${auction.id}`)}>
              <h2 className="text-2xl font-semibold text-navy">{auction.title}</h2>
              <p className="text-sm text-gray-600">Current bid: £{auction.current_bid}</p>
            </div>
=======
    <div className="bg-white rounded-lg shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-6 py-6">
        {auctions.length === 0 ? (
          <div className="text-center text-gray-500 p-6 bg-gray-200 rounded-lg shadow-lg">
            <p className="text-2xl font-semibold text-gray-700">
              There are no active auctions ongoing.
            </p>
            <p className="text-sm text-gray-600">
              Please check back later for new listings.
            </p>
>>>>>>> origin/sprint-2
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
                    {/* If timer runs out, show Ended instead of Active. On reload, will display real auction_status */}
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
