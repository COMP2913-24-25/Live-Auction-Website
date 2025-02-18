import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuctionList from './components/AuctionList';
import UploadTest from './components/UploadTest';
import AuctionDetails from './pages/AuctionDetails';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<AuctionList />} />
      {/* Add other routes here, e.g., for auction detail pages */}
      <Route path="/upload/" element={<UploadTest />} />
      <Route path="/auctions/:id" element={<AuctionDetails />} />
    </Routes>
  </Router>
);

export default App;

import { Routes, Route } from "react-router-dom";
import Home from "./Components/home";
import Login from "./Components/login";
import Register from "./Components/register";
import Dashboard from "./Components/dashboard";  
import Navbar from "./Components/navBar";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./Components/protectedRoute";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
      </div>
    </AuthProvider>
  );
}

export default App;