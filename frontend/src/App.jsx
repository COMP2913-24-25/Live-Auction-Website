import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./context/authContext";
import AuctionList from './components/AuctionList';
import Home from "./components/home";
import Login from "./components/login";
import Register from "./components/register";
import Dashboard from "./components/dashboard";  
import Navbar from "./components/navBar";
import ProtectedRoute from "./components/protectedRoute";
import AuctionDetails from './pages/AuctionDetails';
import AuctionForm from './components/auction/AuctionForm';
import Search from './components/search';

const App = () => (
  <AuthProvider>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
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
      <Route path="/search" element={<Search />} />
    </Routes>
  </AuthProvider>
);

export default App;
