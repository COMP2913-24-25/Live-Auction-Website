import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import AuctionList from './components/AuctionList';
import Browse from "./components/Browse";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";  
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './pages/AuctionForm';

const App = () => (
  <AuthProvider>
    <NavBar />
    <Routes>
      <Route path="/" element={<Navigate to="/browse" replace />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/create-auction" 
        element={
          <ProtectedRoute>
            <AuctionForm />
          </ProtectedRoute>
        }
      />
      <Route path="/list" element={<AuctionList />} />
      <Route path="/auctions/:id" element={<AuctionDetails />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Dashboard />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  </AuthProvider>
);

export default App;
