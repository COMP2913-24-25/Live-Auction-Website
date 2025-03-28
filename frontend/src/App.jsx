import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/authContext";
import { NotificationProvider } from './context/notificationContext';
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExpertDashboard from "./pages/ExpertDashboard";
import NavBar from "./Components/navBar";
import ProtectedRoute from "./context/ProtectedRoute";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './pages/AuctionForm';
import ItemAuthenticationForm from './pages/ItemAuthenticationForm';
import Notifications from './pages/Notifications';
import ExpertAvailability from './components/ExpertAvailability';
import AvailableExperts from './pages/AvailableExperts';
import Users from './pages/Users';
import Profile from './Components/profile';
import FinalizeItems from './pages/FinalizeItems';

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
    <AuthProvider>
      <NotificationProvider>
        <NavBar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/browse" />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auctions/:id" element={<AuctionDetails />} />

          
          <Route path="/profile-settings" element={<Profile />} />
          <Route path="/my-auctions" element={<Profile />} />
          <Route path="/wishlist" element={<Profile />} />
          <Route path="/purchase-history" element={<Profile />} />

          {/* Expert Dashboard Routes */}
          <Route path="/expert-dashboard/*" element={
            <ProtectedRoute allowedRoles={[2]}>
              <Routes>
                <Route index element={<ExpertDashboard />} />
                <Route path="pending/:requestId" element={<ExpertDashboard />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[2, 3]}>
              <DashboardRouter />
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
          
          <Route path="/create-auction" element={
            <ProtectedRoute allowedRoles={[1]}>
              <AuctionForm />
            </ProtectedRoute>
          } />
          
          <Route path="/authenticate-item" element={
            <ProtectedRoute allowedRoles={[1]}>
              <ItemAuthenticationForm />
            </ProtectedRoute>
          } />

          <Route path="/items" element={
            <ProtectedRoute allowedRoles={[1]}>
              <FinalizeItems />
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
  );
}

export default App;