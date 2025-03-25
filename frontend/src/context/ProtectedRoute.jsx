import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext.jsx';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log("ProtectedRoute - 用户:", user);
  console.log("ProtectedRoute - 允许角色:", allowedRoles);
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);

  // 如果正在加载，显示加载指示器
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // 如果指定了允许的角色，检查用户角色
  if (allowedRoles.length > 0) {
    // 确保用户角色是数字类型进行比较
    const userRole = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log("Role mismatch, redirecting to browse page");
      console.log("User role:", userRole, "Allowed roles:", allowedRoles);
      return <Navigate to="/browse" replace />;
    }
  }

  // 用户已认证且有权限，渲染子组件
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.array
};

export default ProtectedRoute; 