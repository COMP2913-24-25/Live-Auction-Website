import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from './context/AuthContext';
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

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NavBar />
      <Routes>
        {/* Redirect root to /browse */}
        <Route path="/" element={<Navigate to="/browse" replace />} />

        {/* Public Routes */ }
        <Route path="/browse" element={<Browse />} />
        <Route path="/auctions/:id" element={<AuctionDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[2, 3]}>
                {user && user.role === 2 ? <ExpertDashboard /> : <ManagerDashboard />}
            </ProtectedRoute>
          }
        />
        <Route 
          path="/create-auction" 
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AuctionForm />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/authenticate-item" 
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <ItemAuthenticationForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
};

export default App;
