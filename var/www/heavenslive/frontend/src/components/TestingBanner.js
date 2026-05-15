import { getLoginPath } from '../utils/pathHelper';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(getLoginPath());
  };

  const isActive = (path) => {
    if (path === '/credon' && location.pathname === '/credon') return true;
    if (path === location.pathname) return true;
    return false;
  };

  return (
    <nav className="nav-bar">
      <Link to="/credon" className="nav-logo">
        <span>🏦</span>
        <span>Credon Currency</span>
      </Link>

      {user && (
        <div className="nav-links">
          <Link to="/credon" className={`nav-link ${isActive('/credon') ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/credon?tab=wallet" className={`nav-link ${location.search.includes('tab=wallet') ? 'active' : ''}`}>
            Wallet
          </Link>
          <Link to="/credon?tab=bids" className={`nav-link ${location.search.includes('tab=bids') ? 'active' : ''}`}>
            Bids
          </Link>
          <Link to="/credon?tab=appointments" className={`nav-link ${location.search.includes('tab=appointments') ? 'active' : ''}`}>
            Appointments
          </Link>
          <Link to="/credon?tab=disputes" className={`nav-link ${location.search.includes('tab=disputes') ? 'active' : ''}`}>
            Disputes
          </Link>
          {isSuperAdmin && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              Admin
            </Link>
          )}
        </div>
      )}

      <div className="user-info">
        {user ? (
          <>
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn">
            Login / Register
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
