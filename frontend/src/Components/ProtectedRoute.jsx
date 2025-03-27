import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Handle dashboard routing based on role
    if (location.pathname === '/dashboard') {
        switch (user.role) {
            case 2: // Expert
                return <Navigate to="/expert-dashboard" replace />;
            case 3: // Manager
                return <Navigate to="/manager-dashboard" replace />;
            default: // Regular user
                return <Navigate to="/browse" replace />;
        }
    }

    // Check role access for protected routes
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/browse" replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.number)
};

export default ProtectedRoute;