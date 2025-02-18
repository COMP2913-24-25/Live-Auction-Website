import { useEffect, useState } from "react";
import axios from "axios";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Star } from "lucide-react";
import { useParams } from "react-router-dom";

const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

const AuctionDetails = () => {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    axios.get(`/api/auctions/${id}`)
      .then(response => {
        setAuction(response.data);
        setBidAmount(response.data.current_bid + 5);
      })
      .catch(error => console.error("Error fetching auction details:", error));
  }, [id]);

  if (!auction) return <p>Loading auction details...</p>;

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="flex flex-col md:flex-row items-center gap-6 p-4 max-w-3xl w-full mx-auto">
        {/* Section 1 - Carousel */}
        <div className="flex justify-center items-center w-full md:w-1/2 border-black border p-2">
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
                  className="w-full h-auto max-h-80 object-contain"
                />
              ))
            ) : (
              <p>No images available</p>
            )}
          </Carousel>
        </div>
  
        {/* Section 2 - Auction Details */}
        <div className="flex flex-col w-full md:w-1/2 gap-2 text-center md:text-left">
          <h2 className="text-2xl font-semibold">{auction.title}</h2>
          <p className="text-gray-600">{auction.description}</p>
          <p className="text-sm text-gray-500">Posted on {new Date(auction.posting_date).toLocaleDateString()}</p>
          
          <div className="border border-gray-300 p-4 rounded-md mt-2">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-gray-600">Current Bid</p>
                <p className="text-xl font-bold">${auction.current_bid}</p>
              </div>
              <button onClick={() => setIsFavorite(!isFavorite)}>
                <Star size={24} className={isFavorite ? "text-yellow-400" : "text-gray-400"} fill={isFavorite ? "#facc15" : "none"} />
              </button>
            </div>
            <input
              type="number"
              className="w-full p-2 border rounded mt-2"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <button className="w-full bg-yellow-500 text-white py-2 rounded mt-2 hover:bg-yellow-600">
              Place Bid
            </button>
            <p className="text-center text-gray-600 mt-2">Selected by <span className="underline">{auction.seller_name}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default AuctionDetails;
