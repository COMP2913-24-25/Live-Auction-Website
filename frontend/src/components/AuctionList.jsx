import { useEffect, useState } from 'react';
import axios from 'axios';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/auctions')
      .then(response => {
        console.log('Fetched data:', response.data);
        const data = Array.isArray(response.data) ? response.data.map(auction => ({
          ...auction,
          remainingTime: calculateTimeRemaining(auction.end_time)
        })) : [];
        setAuctions(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
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
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;

    if (difference <= 0) return "Auction Ended";

    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Available Auctions</h1>
      <ul>
        {auctions.map(auction => (
          <li key={auction.id}>
            <h2>{auction.title}</h2>
            <p>{auction.description}</p>
            <p>Minimum Price: ${auction.min_price}</p>
            <p>Seller: {auction.seller_name}</p>
            <p>Time Remaining: {auction.remainingTime}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuctionList;
