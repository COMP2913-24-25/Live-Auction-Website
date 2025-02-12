import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auctions') // Update the URL to match your backend server
      .then(response => {
        console.log('Fetched data:', response.data); // Log the fetched data
        const data = Array.isArray(response.data) ? response.data : [];
        setAuctions(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error); // Log any errors
        setError(error);
        setLoading(false);
      });
  }, []);

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
            <p>Ends at: {new Date(auction.end_time).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuctionList;