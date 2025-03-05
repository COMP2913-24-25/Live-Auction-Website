import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { user, isAuthenticated } = useContext(AuthContext);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    requiredRole: PropTypes.string,
};

export default ProtectedRoute;