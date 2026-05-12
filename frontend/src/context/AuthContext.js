import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLoginPath } from '../utils/pathHelper';

const AuthContext = createContext();
const API_URL = '/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchUser();
    else setLoading(false);
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const isSuperAdmin = data.user.isSuperAdmin === true || data.user.is_super_admin === true;
        setUser({ ...data.user, isSuperAdmin });
      } else {
        logout();
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        const isSuperAdmin = data.user?.isSuperAdmin === true || data.user?.is_super_admin === true;
        setUser({ ...data.user, isSuperAdmin });
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = getLoginPath();
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.isSuperAdmin === true
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
