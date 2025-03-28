import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext.jsx';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - Allowed roles:", allowedRoles);
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);

  // Display loading state while checking authentication
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Red
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0) {
    // Check if user role is a string and parse it to an integer
    const userRole = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log("Role mismatch, redirecting to browse page");
      console.log("User role:", userRole, "Allowed roles:", allowedRoles);
      return <Navigate to="/browse" replace />;
    }
  }

  // User is authenticated and has the required role, render the children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.array
};

export default ProtectedRoute; 