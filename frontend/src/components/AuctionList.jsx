import { useEffect, useState } from 'react';
import axios from '../api/axios';  // Update this import
import Carousel from 'react-multi-carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Add this import
import 'react-multi-carousel/lib/styles.css';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  const navigate = useNavigate();
  const location = useLocation();

  // Pagination UI component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;

    // Calculate range of visible page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 my-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 border rounded-md hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-2 py-1 text-gray-500">...</span>
            )}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-md ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 py-1 text-gray-500">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 border rounded-md hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };

  // Get paginated auctions
  const getPaginatedAuctions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return auctions.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Update total pages when auctions change
    setTotalPages(Math.ceil(auctions.length / itemsPerPage));
  }, [auctions]);

  const fetchAuctions = async (queryParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = Object.keys(filters || {}).length > 0 ? '/api/search' : '/api/auctions/active';
      const response = await axios.get(`${endpoint}?${queryParams.toString()}`);
      
      if (!response.data) throw new Error('No data received');

      const formattedAuctions = response.data.map(auction => ({
        ...auction,
        imageUrls: auction.image_urls || [],
        remainingTime: calculateTimeRemaining(auction.end_time, auction.auction_status)
      }));

      setAuctions(formattedAuctions);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch auctions';
      console.error('Fetch error:', {
        endpoint: error.config?.url,
        params: queryParams.toString(),
        error: error.response?.data || error.message
      });
      setError(errorMessage);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Add filters if they exist
    if (filters) {
      if (filters.search) params.append('query', filters.search);
      if (filters.categories?.length > 0) params.append('categories', filters.categories.join(','));
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.authenticatedOnly) params.append('authenticatedOnly', 'true');
      if (filters.daysRemaining) params.append('daysRemaining', filters.daysRemaining);
    }

    // Add sorting parameters
    if (!params.has('sort')) params.append('sort', 'created_at');
    if (!params.has('order')) params.append('order', 'desc');
    params.append('_t', Date.now());

    fetchAuctions(params);
  }, [filters, location.search]);

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

  const paginatedAuctions = getPaginatedAuctions();

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-6 py-6">
        {auctions.length === 0 ? (
          <div className="text-center text-gray-500 p-6 bg-gray-200 rounded-lg shadow-lg">
            <p className="text-2xl font-semibold text-gray-700">
              {filters && Object.keys(filters).length > 0 
                ? "No items found matching your criteria"
                : "There are no active auctions ongoing"}
            </p>
            <p className="text-sm text-gray-600">
              {filters && Object.keys(filters).length > 0 
                ? "Try adjusting your search filters"
                : "Please check back later for new listings"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedAuctions.map(auction => (
                <div 
                  key={auction.id} 
                  className="bg-white shadow-lg overflow-hidden cursor-pointer" 
                  onClick={(e) => {
                    if (!e.target.closest('.react-multi-carousel-arrow') && 
                        !e.target.closest('.react-multi-carousel-dot') && e.target.closest('img')) {
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
                        renderArrow={({ onClick, ...props }) => (
                          <div
                            {...props}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent click from propagating to parent div
                              onClick(e);
                            }}
                          />
                        )}
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
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AuctionList;
