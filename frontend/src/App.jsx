import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from './context/NotificationContext';
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";  
import NavBar from "./components/navBar";
import ProtectedRoute from "./context/ProtectedRoute";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './pages/AuctionForm';
import Notifications from './pages/Notifications';

const App = () => (
  <AuthProvider>
    <NotificationProvider>
      <NavBar />
      <Routes>
        {/* Redirect root to /browse */}
        <Route path="/" element={<Navigate to="/browse" replace />} />

        {/* Public Routes */}
        <Route path="/browse" element={<Browse />} />
        <Route path="/auctions/:id" element={<AuctionDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route 
          path="/create-auction" 
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AuctionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[2, 3]}>
              <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Dashboard />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </NotificationProvider>
  </AuthProvider>
);

export default App;
