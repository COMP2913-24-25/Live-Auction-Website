import { useState, useRef, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, User, UserPlus, X, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function NavBar() {
    const { isAuthenticated, logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const [previousAuctionCount, setPreviousAuctionCount] = useState(0);
    const [hasUpdates, setHasUpdates] = useState(false);
  
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

    useEffect(() => {
      if (user?.role === 2 || user?.role === 3) { // Only fetch notifications for manager and expert
          const fetchNotifications = async () => {
              try {
                const response = await axios.get('/api/auctions/active');
                const data = await response.json();
        
                // Check if new auctions were added
                if (data.length > previousAuctionCount) {
                    setHasNewNotification(true);
                }
                setPreviousAuctionCount(data.length);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
          };
  
          fetchNotifications();
          const interval = setInterval(fetchNotifications, 10000);
          return () => clearInterval(interval);
      }
    }, [user]);

    const fetchUpdates = async () => {
      try {
          const response = await axios.get('/api/manager/authentication-requests/check-updates');
          const { data } = response.data;

          data ? setHasUpdates(true) : setHasUpdates(false);

      } catch (error) {
          console.error('Error checking for updates:', error);
      }
    };


    useEffect(() => {
      if ([2, 3].includes(user?.role)) {
        

        fetchUpdates();
        const interval = setInterval(fetchUpdates, 5000); //check every 5 sec

        return () => clearInterval(interval);
      }
    }, [user]);

    const handleNotificationClick = () => {
      if (user?.role === 1) {
          // For regular users, toggle the notification dropdown
          setIsNotificationOpen(!isNotificationOpen);
      } else if (user?.role === 2) {
          // For experts, navigate to the notifications page
          navigate('/notifications');
      } else if (user?.role === 3) {
          // For managers, perform a different action (e.g., open a different page or modal)
          // navigate('/manager/notifications');
      } else {
          console.warn('Unknown user role, no action taken.');
      }
    };



    return (
      <>
        <header className="fixed top-0 left-0 right-0 bg-primary shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <span className="text-2xl font-bold text-white">Auction</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
              <Link to="/browse" className="text-white/90 hover:text-white transition-colors">
                Browse
              </Link>
              <Link to="/how-it-works" className="text-white/90 hover:text-white transition-colors">
                How It Works
              </Link>
                {isAuthenticated && (
                  <>
                    {(user.role === 2) && (
                      <Link to="/expert-dashboard" className="text-white/90 hover:text-white transition-colors">
                        Expert Dashboard
                      </Link>
                    )}
                    {(user.role === 3) && (
                      <Link to="/manager-dashboard" className="text-white/90 hover:text-white transition-colors">
                        Manager Dashboard
                      </Link>
                    )}
                    {user.role === 1 && (
                      <Link to="/create-auction" className="text-white/90 hover:text-white transition-colors">
                        Create Auction
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {/* Auth and Notification Section */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-48 px-3 py-1 rounded-full text-sm bg-white/10 border border-transparent focus:border-white/30 focus:outline-none text-white placeholder-white/70"
                  />
                  <Search className="absolute right-3 top-1.5 h-4 w-4 text-white/70" />
                </div>
                
                {!isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/login" className="text-white/90 hover:text-white transition-colors flex items-center">
                      <User className="h-5 w-5 mr-1" />
                      <span>Login</span>
                    </Link>
                    <Link to="/register" className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors flex items-center">
                      <UserPlus className="h-5 w-5 mr-1" />
                      <span>Register</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    {/* Notification Bell */}
                    <div className="relative" ref={notificationRef}>
                      <button 
                        className="text-white/90 hover:text-white transition-colors relative"
                        onClick= {handleNotificationClick}
                      >
                        <Bell className={`h-6 w-6 ${(hasNewNotification && hasUpdates) ? 'animate-[bounce_1s_infinite] text-gold' : 'text-white'}`} />
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent rounded-full text-xs flex items-center justify-center text-white">
                          {notifications.length}
                        </span>
                      </button>

                      {/* We are gonna override the use of this bell for user/expert/manager */}
                      {isNotificationOpen && (
                          // User notifications
                          <div className="notification-dropdown">
                            <div className="px-4 py-2 border-b border-gray-200">
                              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                            </div>
                            {notifications.map((notification) => (
                              <div 
                                key={notification.id} 
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                              >
                                <p className="text-sm text-gray-800">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                            ))}
                            <div className="px-4 py-2 border-t border-gray-200">
                              <button 
                                className="text-sm text-secondary hover:text-secondary/80 w-full text-center"
                                onClick={() => {/* Handle view all notifications */}}
                              >
                                View all notifications
                              </button>
                            </div>
                          </div>
                      )}

                    </div>
                    <button onClick={logout} className="text-white/90 hover:text-white transition-colors">
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white/90 hover:text-white transition-colors"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
            <div className="px-4 pt-2 pb-3 space-y-1 bg-primary border-t border-white/10">
              <div className="px-3 py-2">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 rounded-full text-sm bg-white/10 border border-transparent focus:border-white/30 focus:outline-none text-white placeholder-white/70"
                />
              </div>
              <Link to="/browse" className="block px-3 py-2 text-white/90 hover:text-white transition-colors">
                Browse
              </Link>
              <Link to="/how-it-works" className="block px-3 py-2 text-white/90 hover:text-white transition-colors">
                How It Works
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="block px-3 py-2 text-white/90 hover:text-white transition-colors">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </header>
        
        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </>
    );
}

export default NavBar;