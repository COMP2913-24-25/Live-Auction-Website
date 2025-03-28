import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, LogOut, AlertCircle, Check, Clock, ArrowRight, ClipboardCheck, CheckCircle, LucideLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/notificationContext";
import useOnClickOutside from '../hooks/useOnClickOutside';

const getDashboardLink = (role) => {
    switch (role) {
        case 2:
            return '/expert-dashboard';
        case 3:
            return '/manager-dashboard';
        default:
            return '/browse';
    }
};

const defaultNotificationIcon = (type) => {
  switch (type) {
    case 'outbid':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'won':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'ending_soon':
      return <Clock className="h-5 w-5 text-orange-500" />;
    case 'ended':
      return <Bell className="h-5 w-5 text-gray-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const NotificationDropdown = ({ notifications, onClose, markAsRead }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle expert-specific notifications
    if (user?.role === 2) {
      switch (notification.type) {
        case 'review_request':
        case 'review_reminder':
          navigate(`/expert-dashboard/pending/${notification.auction_id}`);
          break;
        case 'review_completed':
          navigate(`/expert-dashboard/completed/${notification.auction_id}`);
          break;
        default:
          if (notification.auction_id) {
            navigate(`/auctions/${notification.auction_id}`);
          }
      }
    } else {
      // Handle regular user notifications
      if (notification.auction_id) {
        navigate(`/auctions/${notification.auction_id}`);
      }
    }
    onClose();
  };

  const getNotificationIcon = (type, role) => {
    if (role === 2) {
      switch (type) {
        case 'review_request':
          return <ClipboardCheck className="h-5 w-5 text-blue-500" />;
        case 'review_reminder':
          return <Clock className="h-5 w-5 text-orange-500" />;
        case 'review_completed':
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        default:
          return <Bell className="h-5 w-5 text-gray-500" />;
      }
    }
    // Return regular user notification icons
    return defaultNotificationIcon(type);
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </h3>
          <Link 
            to="/notifications" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={onClose}
          >
            View All
          </Link>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.slice(0, 5).map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 hover:bg-gray-50 cursor-pointer border-b ${
              !notification.read ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type, user?.role)}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">{notification.timeAgo}</p>
              </div>
            </div>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
};

function NavBar() {
    const { isAuthenticated, logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const notificationRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
  
    const { notifications, unreadCount, markAsRead } = useNotifications();
    
    // Re-render when authentication changes
    const [authState, setAuthState] = useState(isAuthenticated);

    useEffect(() => {
      setAuthState(isAuthenticated);
      function handleClickOutside(event) {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
          setIsNotificationOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isAuthenticated]);

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

    const handleCreateAuction = (e) => {
      e.preventDefault();
      navigate('/create-auction');
    };

    const handleNotificationClick = async (notification) => {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      setIsNotificationOpen(false);
      if (notification.auction_id) {
        navigate(`/auctions/${notification.auction_id}`);
      }
    };

    const NotificationBell = () => {
      const { notifications, unreadCount, markAsRead } = useNotifications();
      const [isDropdownOpen, setIsDropdownOpen] = useState(false);
      const dropdownRef = useRef(null);
    
      // Close dropdown when clicking outside
      useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));
    
      return (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative inline-flex items-center p-2 rounded-full hover:bg-gray-100"
          >
            <Bell className="h-6 w-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
    
          {isDropdownOpen && (
            <NotificationDropdown 
              notifications={notifications} 
              onClose={() => setIsDropdownOpen(false)}
              markAsRead={markAsRead}
            />
          )}
        </div>
      );
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

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center justify-between w-full ml-6">
                {/* Left side navigation links */}
                <div className="flex space-x-8">
                  <Link to="/browse" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                    Browse
                  </Link>
                  
                  {isAuthenticated && user && (
                    <>
                      {/* Regular user (role 1) */}
                      {(Number(user.role) === 1) && (
                        <>
                          <Link 
                            to="/create-auction" 
                            className="text-white hover:text-blue-200 font-medium transition-colors duration-200"
                          >
                            Create Listing
                          </Link>
                          <Link 
                            to="/authenticate-item" 
                            className="text-white hover:text-blue-200 font-medium transition-colors duration-200"
                          >
                            Authenticate Items
                          </Link>
                          <Link 
                            to="/items" 
                            className="text-white hover:text-blue-200 font-medium transition-colors duration-200"
                          >
                            My Items
                          </Link>
                        </>
                      )}

                      {(user.role == 2 || user.role == 3) && (
                        <>
                          <Link to="/dashboard" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                            Dashboard
                          </Link>
                        </>
                      )}

                      {user.role == 2 && (
                        <>
                          <Link to="/reviewed" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                            Reviewed
                          </Link>
                        </>
                      )}

                      {user.role == 3 && (
                        <>
                          <Link to="/requests" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                            Requests
                          </Link>
                          <Link to="/experts" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                            Experts
                          </Link>
                          <Link to="/users" className="text-white hover:text-blue-200 font-medium transition-colors duration-200">
                            Users
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Center Search Bar - Keep only this one */}
                <div className="flex-1 max-w-xl mx-6">
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

                {/* Right side buttons */}
                <div className="flex items-center space-x-4">
                  {isAuthenticated && (
                    <>
                      {/* Notification Bell */}
                      <NotificationBell />

                      {/* Logout Button */}
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
                </div>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center gap-4">
                {isAuthenticated && (
                  <div className="relative" ref={notificationRef}>
                    <button 
                      className="text-white hover:text-blue-200 transition-colors relative"
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                      <Bell className="h-6 w-6" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                        <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-semibold text-gray-800">Notifications</h3>
                          <span className="text-sm text-gray-500">{unreadCount} unread</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            <>
                              {notifications.slice(0, 6).map((notification) => (
                                <div 
                                  key={notification.id} 
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    navigate('/notifications');
                                    setIsNotificationOpen(false);
                                  }}
                                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                                    !notification.read ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <div className="flex gap-2 items-start">
                                    <div className="mt-1">
                                      {notification.type === 'outbid' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                      {notification.type === 'won' && <Check className="h-4 w-4 text-green-500" />}
                                      {notification.type === 'ending_soon' && <Clock className="h-4 w-4 text-orange-500" />}
                                      {notification.type === 'ended' && <Bell className="h-4 w-4 text-gray-500" />}
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-800">{notification.message}</p>
                                      <p className="text-xs text-gray-500 mt-1">{notification.timeAgo}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  navigate('/notifications');
                                  setIsNotificationOpen(false);
                                }}
                                className="w-full p-3 text-sm text-blue-600 hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                              >
                                View all notifications
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No notifications
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              {(isAuthenticated && user.role == 1) || !isAuthenticated && (
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
              )}
              <Link to="/browse" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                Browse
              </Link>
              {isAuthenticated ? (
                <>
                  {user.role == 1 && (
                    <>
                      <Link 
                        to="/create-auction" 
                        onClick={handleCreateAuction}
                        className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md"
                      >
                        Create Listing
                      </Link>
                      <Link 
                        to="/authenticate-item" 
                        className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md"
                      >
                        Authenticate Items
                      </Link>
                      <Link 
                        to="/items" 
                        className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md"
                      >
                        My Items
                      </Link>
                    </>
                  )}

                  {user.role == 2 || user.role == 3 && (
                    <>
                      <Link to="/dashboard" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                        Dashboard
                      </Link>
                    </>
                  )}

                  {user.role == 2 && (
                    <>
                      <Link to="/reviewed" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                        Reviewed
                      </Link>
                    </>
                  )}

                  {user.role == 3 && (
                    <>
                      <Link to="/requests" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                        Requests
                      </Link>
                      <Link to="/experts" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                        Experts
                      </Link>
                      <Link to="/users" className="block px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md">
                        Users
                      </Link>
                    </>
                  )}
                  
                  <Link 
                    to="/notifications" 
                    className="px-3 py-2 text-white font-medium hover:bg-slate-700 rounded-md flex items-center justify-between"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notifications
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
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