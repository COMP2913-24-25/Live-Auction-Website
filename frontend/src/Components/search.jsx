import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/auctions/search?q=${query}`);
      setResults(response.data);
    } catch (err) {
      setError('Error fetching search results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Search Results</h2>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for auctions..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="mt-2 w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark"
        >
          Search
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((auction) => (
          <div
            key={auction.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden cursor-pointer"
            onClick={() => navigate(`/auctions/${auction.id}`)}
          >
            <img
              src={auction.image_url || 'placeholder.jpg'}
              alt={auction.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold text-navy">{auction.title}</h3>
              <p className="text-sm text-gray-600">Current bid: £{auction.current_bid}</p>
              <p className="text-sm text-gray-500">Ends: {new Date(auction.end_time).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && <p>No results found.</p>}
    </div>
  );
};

export default Search;
