import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, User, UserPlus, Search, X, ChevronDown } from "lucide-react";
import { useAuth } from "../context/authContext";

function Navbar() {
    const { isAuthenticated, logout } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAuctionOpen, setIsAuctionOpen] = useState(false);

    const closeSearch = () => setIsSearchOpen(false);
    
    return (
      <>
        <header className="fixed top-0 left-0 right-0 bg-primary shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center" onClick={closeSearch}>
                  <span className="text-2xl font-bold text-white">Auction</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link to="/browse" className="text-white/90 hover:text-white transition-colors" onClick={closeSearch}>
                  Browse
                </Link>
                <Link to="/how-it-works" className="text-white/90 hover:text-white transition-colors" onClick={closeSearch}>
                  How It Works
                </Link>
                {isAuthenticated && (
                  <Link to="/dashboard" className="text-white/90 hover:text-white transition-colors" onClick={closeSearch}>
                    Dashboard
                  </Link>
                )}
              </nav>

              {/* Search Bar Trigger */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 px-3 py-1 rounded-full text-sm bg-white/10 border border-transparent focus:border-white/30 focus:outline-none text-white placeholder-white/70 cursor-pointer"
                  onClick={() => setIsSearchOpen(true)}
                  readOnly
                />
                <Search className="absolute right-3 top-1.5 h-4 w-4 text-white/70" />
              </div>

              {/* Auth Section */}
              {!isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-white/90 hover:text-white transition-colors flex items-center" onClick={closeSearch}>
                    <User className="h-5 w-5 mr-1" />
                    <span>Login</span>
                  </Link>
                  <Link to="/register" className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors flex items-center" onClick={closeSearch}>
                    <UserPlus className="h-5 w-5 mr-1" />
                    <span>Register</span>
                  </Link>
                </div>
              ) : (
                <button onClick={() => { logout(); closeSearch(); }} className="text-white/90 hover:text-white transition-colors">
                  Logout
                </button>
              )}
            </div>
          </div>
        </header>
        
        {/* Search Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white shadow-md p-6 z-50 w-full animate-slide-down">
            <div className="flex justify-between items-center">
              <input type="text" placeholder="Search for items..." className="w-full p-3 border rounded-md focus:ring-2 focus:ring-secondary focus:outline-none" />
              <button onClick={closeSearch} className="text-gray-600 hover:text-gray-800">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <Link to="/browse" className="block text-gray-700 hover:text-primary" onClick={closeSearch}>Browse</Link>
              <Link to="/how-it-works" className="block text-gray-700 hover:text-primary" onClick={closeSearch}>How It Works</Link>
              <Link to="/login" className="block text-gray-700 hover:text-primary" onClick={closeSearch}>Login</Link>
              <Link to="/register" className="block text-gray-700 hover:text-primary" onClick={closeSearch}>Register</Link>
              <div className="cursor-pointer text-gray-700 hover:text-primary flex items-center" onClick={() => setIsAuctionOpen(!isAuctionOpen)}>
                Auction Items <ChevronDown className="ml-2 h-4 w-4" />
              </div>
              {isAuctionOpen && (
                <div className="ml-4 mt-2 border-l pl-4 space-y-2">
                  <Link to="/auctions/item-1" className="block text-gray-600 hover:text-primary" onClick={closeSearch}>Auction Item 1</Link>
                  <Link to="/auctions/item-2" className="block text-gray-600 hover:text-primary" onClick={closeSearch}>Auction Item 2</Link>
                  <Link to="/auctions/item-3" className="block text-gray-600 hover:text-primary" onClick={closeSearch}>Auction Item 3</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
}

export default Navbar;
