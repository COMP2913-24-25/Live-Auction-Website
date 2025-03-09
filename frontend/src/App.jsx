import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/authContext';
import ProtectedRoute from './components/ProtectedRoute';
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";  
import NavBar from "./components/navBar";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './pages/AuctionForm';

const App = () => (
  <AuthProvider>
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
        path="/create-auction" 
        element={<AuctionForm />}
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
    </Routes>
  </AuthProvider>
);

export default App;
