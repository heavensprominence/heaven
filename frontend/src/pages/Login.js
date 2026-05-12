import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TestingBanner from '../components/TestingBanner';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.requiresTwoFactor) {
          navigate('/verify-code', { 
            state: { 
              sessionId: data.sessionId,
              message: data.message || 'Verification code sent to your email'
            } 
          });
        } else if (data.token) {
          localStorage.setItem('token', data.token);
          await login(email, password);
          navigate('/');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <TestingBanner />
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏦 Credon Currency</h1>
          <p>Divinely Inspired • Community Powered</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <Link to="/forgot-password" style={{ color: '#aaa', fontSize: '0.8rem' }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: '#4CAF50', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Register here!
            </Link>
          </div>
        </form>
        <div className="auth-disclaimer">
          <p>⚠️ TESTING SYSTEM ONLY - No real currency or financial instruments are being offered.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
