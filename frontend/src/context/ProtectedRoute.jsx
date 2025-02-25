import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Loading...</div>; // Show loading indicator instead of redirecting
    }

    // If allowedRoles are provided, check if user has access
    if (user) {
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            return <Navigate to={user.role === 1 ? "/browse" : "/dashboard"} replace />;
        }
    } else {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;