import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import VerifyEmail from './pages/VerifyEmail';
import CredonCurrency from './pages/CredonCurrency';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const getBasename = () => {
  const hostname = window.location.hostname;
  if (hostname === 'credon.heavenslive.com') return '';
  return '/credon';
};

const LoadingScreen = () => (
  <div className="credon-container">
    <div className="balance-card" style={{ textAlign: 'center', padding: '50px' }}>
      <h3>Loading your dashboard...</h3>
    </div>
  </div>
);

const TokenHandler = ({ children }) => {
  const navigate = useNavigate();
  const [processed, setProcessed] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      params.delete('token');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
      window.dispatchEvent(new Event('storage'));
      navigate('/', { replace: true });
    }
    setProcessed(true);
  }, [navigate]);
  return processed ? children : <LoadingScreen />;
};

const AppContent = () => {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <TokenHandler>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <CredonCurrency />
          </ProtectedRoute>
        } />
      </Routes>
    </TokenHandler>
  );
};

function App() {
  const basename = getBasename();
  return (
    <Router basename={basename}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
