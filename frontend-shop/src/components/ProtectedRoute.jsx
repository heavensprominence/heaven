import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (requireAuth && !token) {
        // Store the attempted path for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

export default ProtectedRoute;
