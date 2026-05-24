import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (requireAuth && !token) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        return <Navigate to="/login" replace />;
    }
    
    if (requireAdmin && !user?.is_super_admin) {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

export default ProtectedRoute;
