import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/notificationContext';
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExpertDashboard from "./pages/ExpertDashboard";  
import NavBar from "./components/NavBar";
import ProtectedRoute from "./context/ProtectedRoute";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './pages/AuctionForm';
import ItemAuthenticationForm from './pages/ItemAuthenticationForm';
import Notifications from './pages/Notifications';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 2:
      return <Navigate to="/expert-dashboard" replace />;
    case 3:
      return <Navigate to="/manager-dashboard" replace />;
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
          <Route path="/" element={<Navigate to="/browse" />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />
          
          <Route path="/expert-dashboard" element={
            <ProtectedRoute allowedRoles={[2]}>
              <ExpertDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/manager-dashboard" element={
            <ProtectedRoute allowedRoles={[3]}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/create-auction" 
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AuctionForm />
              </ProtectedRoute>
            }
          />
          <Route path="/auctions/:id" element={<AuctionDetails />} />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
