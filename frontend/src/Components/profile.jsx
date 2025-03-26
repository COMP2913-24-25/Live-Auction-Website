import { Pencil } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import axios from 'axios';
import Carousel from 'react-multi-carousel';
import { calculateTimeRemaining } from '../components/AuctionList';

function Profile() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const categories = [
    { name: 'Profile Settings', path: '/profile-settings' },
    { name: 'Auctions', path: '/my-auctions' },
    { name: 'Wishlist', path: '/wishlist' },
    { name: 'Purchase History', path: '/purchase-history' }
  ];

  // Helper to check active link
  const isActive = (path) => location.pathname === path;


  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-100 p-6 flex flex-col justify-between">
        <div className="space-y-4">
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className={`block p-2 rounded-md ${
                isActive(category.path)
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full p-2 rounded-md mt-6 ${
            isActive('/logout')
              ? 'bg-green-500 text-white'
              : 'hover:bg-gray-200'
          }`}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}

      <div className="w-4/5 p-8 overflow-auto">
       {location.pathname === '/profile-settings' && <ProfileSettings user={user} />}
       {location.pathname === '/my-auctions' && <MyAuctions />}
       {location.pathname === '/wishlist' && <Wishlist user={user} />} 
       {location.pathname === '/purchase-history' && <PurchaseHistory />} 
      </div>
    </div>
  );
}

const ProfileSettings = ({ user }) => {
  const [editPageOpen, setEditPageOpen] = useState(false);

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const response = await axios.get(`/api/profile/${user.id}`);
          setFormData(response.data);
          console.log(response.data); // Debugging
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await axios.put(`/api/profile/${user.id}`, { formData : formData, user : user });
      setEditPageOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const Input = ({ key_name, isEmail = false }) => {
  
    // Show a mailto: link only when it's an email field and in read-only mode
    if (!editPageOpen && isEmail) {
      return (
        <a href={`mailto:${formData[key_name]  || '' }`} className="text-blue-600 hover:underline">
          {formData[key_name]  || ''}
        </a>
      );
    }

    return (
        <input
          name={key_name}
          defaultValue={formData[key_name] || ''}
          onBlur={handleChange}
          readOnly={!editPageOpen}
          className={`border rounded p-2 ${!editPageOpen ? 'bg-gray-100' : ''}`}
        />
    );
  };

  const InputExpertise = () => {
    return (
      <textarea
        name="expertise"
        defaultValue={formData.expertise  || ''}
        onBlur={handleChange}
        readOnly={!editPageOpen}
        className={`border rounded p-2 ${!editPageOpen ? 'bg-gray-100' : ''}`}
      />
    );
  };
      

  if (!user) return null; // Prevent render until user is loaded

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Welcome */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">Welcome, {user?.username}</h2>
        {!editPageOpen && (
          <Link
          onClick={() => setEditPageOpen(true)}
          className="flex items-center text-gray-600 hover:text-blue-500"
        >
          <Pencil className="w-4 h-4 mr-1" />
          Manage Profile
        </Link>
        )}
      </div>

      {/* Basic Info */}
      <div className="border rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-4">Basic Info</h3>
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">Username</span>
          <Input key_name="username" />
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500">Gender</span>
          <Input key_name="gender" />
        </div>
      </div>

      {/* Contact Info */}
      <div className="border rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-4">Contact Info</h3>
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">Email</span>
          <Input key_name="email" isEmail />
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500">Phone</span>
          <Input key_name="phone" />
        </div>
      </div>

      {/* Expertise */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Expertise Category</h3>
        <div className="text-center text-gray-500">
          <InputExpertise />
        </div>
      </div>

      {editPageOpen && (
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mt-4"
        >
          Save Changes
        </button>
      )}
    </div>
  );
};



const MyAuctions = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-8">My Auctions</h2>
      <p>No auctions found.</p>
    </div>
  );
}

const Wishlist = ({user}) => {

  const [auctions, setAuctions] = useState(null);

  useEffect(() => {
    const fetchFavoriteAuctions = async () => {
      try {
        const favoriteAuctions = await axios.get(`/api/favorites/${user.id}`);
        console.log(favoriteAuctions.data); // Debugging

        const formattedFavoriteAuctions = favoriteAuctions.data.map(auction => ({
          ...auction, 
          imageUrls: auction.image_urls ? auction.image_urls.split(',') : [],
          remainingTime: calculateTimeRemaining(auction.end_time, auction.auction_status)
        }));
        setAuctions(formattedFavoriteAuctions);
        } catch (error) {
        console.error('Failed to fetch watchlist:', error);
      }
    };  
    fetchFavoriteAuctions();
    const interval = setInterval(fetchFavoriteAuctions, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (auctions === null) {
    return <div>Loading...</div>;
  }

  return (

    <div>
      <h2 className="text-2xl font-semibold mb-8">Watchlist</h2>
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
  );
}

const PurchaseHistory = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-8">Purchase History</h2>
      <p>No purchase history found.</p>
    </div>
  );
}

export default Profile;
