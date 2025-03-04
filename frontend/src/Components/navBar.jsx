import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function NavBar() {
    const { isAuthenticated, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const notificationRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
  
    const notifications = [
      { id: 1, message: "New bid on your item", time: "5 mins ago" },
      { id: 2, message: "Auction ending soon", time: "10 mins ago" },
    ];

    useEffect(() => {
      function handleClickOutside(event) {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
          setIsNotificationOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleSearch = (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSearch(e);
      }
    };
  
    return (
      <>
        <header className="fixed top-0 left-0 right-0 bg-slate-800 shadow-md z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <span className="text-2xl font-bold text-white">Auction</span>
                </Link>
              </div>

              {/* Search Bar - Centered and Styled to Match Design */}
              <div className="hidden md:flex flex-1 justify-center mx-6">
                <div className="w-full max-w-xl relative">
                  <div className="relative flex items-center w-full">
                    <Search className="absolute left-3 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search auctions..."
                      className="w-full pl-10 pr-4 py-2 rounded-full bg-white border-0 shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none text-gray-700 placeholder-gray-400"
                      ref={searchRef}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link to="/browse" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                  Browse
                </Link>
                
                {isAuthenticated && (
                  <>
                    <Link to="/dashboard" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                      Dashboard
                    </Link>
                    
                    <Link to="/create-auction" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                      Create Auction
                    </Link>
                    
                    {/* Notification Bell */}
                    <div className="relative" ref={notificationRef}>
                      <button 
                        className="text-white hover:text-blue-200 transition-colors relative"
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      >
                        <Bell className="h-5 w-5" />
                        {notifications.length > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                            {notifications.length}
                          </span>
                        )}
                      </button>

                      {/* Notification Dropdown */}
                      {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50">
                          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                          </div>
                          {notifications.length > 0 ? (
                            <>
                              {notifications.map((notification) => (
                                <div 
                                  key={notification.id} 
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                                >
                                  <p className="text-sm text-gray-800 font-medium">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                </div>
                              ))}
                              <div className="px-4 py-2 bg-gray-50">
                                <button 
                                  className="text-sm text-blue-600 hover:text-blue-800 w-full text-center font-medium"
                                  onClick={() => {/* Handle view all notifications */}}
                                >
                                  View all notifications
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-500">
                              <p>No new notifications</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={logout} 
                      className="text-white hover:text-blue-200 font-medium transition-colors duration-200 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </button>
                  </>
                )}
                
                {!isAuthenticated && (
                  <>
                    <Link 
                      to="/login" 
                      className="text-white hover:text-blue-200 font-medium transition-colors duration-200"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                    >
                      Register
                    </Link>
                  </>
                )}
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
            <div className="px-4 pt-2 pb-3 space-y-3 bg-slate-800 border-t border-slate-700">
              <div className="px-1 py-2">
                <div className="relative flex items-center w-full">
                  <Search className="absolute left-3 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search auctions..."
                    className="w-full pl-10 pr-4 py-2 rounded-full bg-white border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>
              <Link to="/browse" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                Browse
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                    Dashboard
                  </Link>
                  <Link to="/create-auction" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                    Create Auction
                  </Link>
                  <button 
                    onClick={logout} 
                    className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                    Login
                  </Link>
                  <Link to="/register" className="block px-3 py-2 text-white font-medium bg-blue-500 hover:bg-blue-600 rounded-md">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        
        {/* Spacer to prevent content from being hidden behind fixed navbar */}
        <div className="h-16"></div>
        
        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </>
    );
}

export default NavBar;