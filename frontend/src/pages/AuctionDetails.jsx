import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Star } from "lucide-react";

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

  const handleBidChange = (e) => {
    setBidAmount(e.target.value);
  };

  const handlePlaceBid = () => {
    console.log("Bid placed:", bidAmount);
  };

  if (!auction) return <p className="text-center mt-10">Loading auction details...</p>;

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6">
      {/* Carousel Section */}
      <div className="md:w-1/2 border border-black p-2 overflow-hidden" style={{ maxWidth: "600px", height: "400px" }}>
        <Carousel 
            responsive={responsive} 
            showDots={true} 
            infinite={true} 
            autoPlay={false}
            itemClass="w-full"
            containerClass="relative"
        >
          {auction.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Auction Image ${index + 1}`}
              className="w-full h-40 object-cover rounded-md" // Corrected object-fit to object-cover
            />
          ))}
        </Carousel>
      </div>

      {/* Auction Details Section */}
      <div className="md:w-1/2">
        <h1 className="text-2xl font-bold">{auction.title}</h1>
        <p className="text-gray-700 mt-2">{auction.description}</p>
        <p className="text-sm text-gray-500 mt-4">Posted on {new Date(auction.posting_date).toLocaleDateString()}</p>

        {/* Current Bid Section */}
        <div className="border border-gray-300 p-4 mt-2 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Current Bid</p>
              <p className="text-xl font-semibold">${auction.current_bid}</p>
            </div>
            <button onClick={() => setIsFavorite(!isFavorite)}>
              {isFavorite ? <Star fill="bg-yellow-500" className="text-yellow-500" /> : <Star className="text-gray-500" />}
            </button>
          </div>

          {/* Bidding Input and Button */}
          <div className="mt-4">
            <input
              type="number"
              value={bidAmount}
              onChange={handleBidChange}
              className="w-full border rounded-md p-2"
              placeholder={`$${auction.current_bid + 5}`}
            />
            <button
              onClick={handlePlaceBid}
              className="w-full bg-yellow-500 text-white py-2 mt-2 rounded-md hover:bg-yellow-600"
            >
              Place Bid
            </button>
          </div>

          <p className="text-center text-gray-600 mt-4">
            Selected by <span className="underline">{auction.seller_name}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails;