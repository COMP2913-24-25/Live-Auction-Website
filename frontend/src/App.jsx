import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./context/authContext";
import AuctionList from './components/AuctionList';
import UploadTest from './components/UploadTest';
import Home from "./components/home";
import Login from "./components/login";
import Register from "./components/register";
import Dashboard from "./components/dashboard";  
import Navbar from "./components/navBar";
import ProtectedRoute from "./components/protectedRoute";
import AuctionDetails from './pages/AuctionDetails';

const App = () => (
  <Router>
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload/" element={<UploadTest />} />
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
      </div>
    </AuthProvider>
  </Router>
);

export default App;