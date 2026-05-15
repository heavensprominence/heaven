import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="login" replace />;
  }

  if (adminOnly && !user.is_super_admin) {
    return <Navigate to="wallet" replace />;
  }

  return children;
};

export default ProtectedRoute;
