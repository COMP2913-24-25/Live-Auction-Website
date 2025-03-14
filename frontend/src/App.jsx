import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from './context/AuthContext';
<<<<<<< HEAD
=======
import { NotificationProvider } from './context/notificationContext';
>>>>>>> origin/sprint-2
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExpertDashboard from "./pages/ExpertDashboard";  
<<<<<<< HEAD
import NavBar from "./components/navBar";
=======
import NavBar from "./components/NavBar";
>>>>>>> origin/sprint-2
import ProtectedRoute from "./context/ProtectedRoute";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './pages/AuctionForm';
import ItemAuthenticationForm from './pages/ItemAuthenticationForm';
<<<<<<< HEAD

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
=======
import Notifications from './pages/Notifications';

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
          {/* Redirect root to /browse */}
          <Route path="/" element={<Navigate to="/browse" />} />

          {/* Public Routes */}
          <Route path="/browse" element={<Browse />} />
          <Route path="/auctions/:id" element={<AuctionDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />
          <Route path="/create-auction" 
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <AuctionForm />
              </ProtectedRoute>
            }
          />
          <Route path="authenticate-item"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <ItemAuthenticationForm />
              </ProtectedRoute>
            }
          />
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
>>>>>>> origin/sprint-2

export default App;
