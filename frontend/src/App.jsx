import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from './context/notificationContext';
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExpertDashboard from "./pages/ExpertDashboard";  
import NavBar from "./components/navBar";
import ProtectedRoute from "./context/ProtectedRoute";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './pages/AuctionForm';
import ItemAuthenticationForm from './pages/ItemAuthenticationForm';
import Notifications from './pages/Notifications';
import NotificationBell from './pages/notificationBell';
import Profile from './Components/profile';

// const { isAuthenticated } = useAuth();
import ExpertAvailability from './components/ExpertAvailability';
import AvailableExperts from './pages/AvailableExperts';
import Users from './pages/Users';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 2:
      return <ExpertDashboard />;
    case 3:
      return <ManagerDashboard />;
    default:
      return <Navigate to="/browse" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <NavBar />
          <Routes>
            {/* Redirect root to /browse */}
            <Route path="/" element={<Navigate to="/browse" />} />

          {/* Public Routes */}
          <Route path="/browse" element={<Browse />} />
          <Route path="/auctions/:id" element={<AuctionDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          
          <Route path="/profile-settings" element={<Profile />} />
          <Route path="/my-auctions" element={<Profile />} />
          <Route path="/watchlist" element={<Profile />} />
          <Route path="/purchase-history" element={<Profile />} />


          
          {/* Protected Routes */}

          {/* <Route 
            path={["/profile-settings", "/my-auctions", "/watchlist", "/purchase-history"]}  
            element={<Profile />} 
          /> */}
          {/* <Route 
            path={["/profile-settings", "/my-auctions", "/watchlist", "/purchase-history"]}  
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <Profile />
              </ProtectedRoute>
            }
          />        */}

          <Route 
            path="/notification-bell" 
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <NotificationBell />
              </ProtectedRoute>
            }
          />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[2, 3]}>
              <DashboardRouter />
            </ProtectedRoute>
          } />
          <Route path="/create-auction" 
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AuctionForm />
              </ProtectedRoute>
            } />
            <Route path="/experts" element={
              <ProtectedRoute allowedRoles={[3]}>
                <AvailableExperts />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={[3]}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/create-auction" 
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AuctionForm />
                </ProtectedRoute>
              }
            />
            <Route path="/authenticate-item" element={<ItemAuthenticationForm />} />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
              } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/working-hours" element={
              <ProtectedRoute allowedRoles={[2]}>
                <ExpertAvailability />
              </ProtectedRoute>
            } />
            <Route path="/reviewed" element={
              <ProtectedRoute allowedRoles={[2]}>
                <ExpertDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;