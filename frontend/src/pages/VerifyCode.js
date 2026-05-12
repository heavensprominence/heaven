import { getLoginPath } from '../utils/pathHelper';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, setUser, setToken } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const state = location.state;
    if (state && state.sessionId) {
      setSessionId(state.sessionId);
      setMessage(state.message || 'Verification code sent to your email');
    } else {
      navigate(getLoginPath());
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code, rememberDevice: true })
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // Force full page reload to dashboard
        window.location.href = '/credon';
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <div className="auth-header">
          <h1>🏦 Credon Currency</h1>
          <p>Divinely Inspired • Community Powered</p>
        </div>
        
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>
          2-Factor Authentication Code
        </h2>
        
        <div style={{ 
          backgroundColor: '#1a1a2e', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '10px', fontSize: '1rem' }}>
            📧 {message}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#ffaa00' }}>
            ⚠️ Please check your Spam/Junk Email folder if you don't see it in your inbox!
          </p>
        </div>
        
        {error && (
          <div style={{ 
            color: '#ff6b6b', 
            backgroundColor: '#3d1a1a', 
            padding: '10px', 
            borderRadius: '5px',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>
              Enter 6-digit code from your email
            </label>
            <input 
              type="text" 
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength="6"
              autoFocus
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '10px',
                backgroundColor: '#0a0a1a',
                border: '2px solid #2a2a4a',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 'bold'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-btn"
            disabled={loading || code.length !== 6}
            style={{ width: '100%' }}
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              type="button"
              onClick={() => navigate(getLoginPath())}
              style={{
                background: 'none',
                border: 'none',
                color: '#4CAF50',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Login
            </button>
          </div>
        </form>
        
        <div className="auth-disclaimer" style={{ marginTop: '20px' }}>
          <p>⚠️ TESTING SYSTEM ONLY - No real currency or financial instruments are being offered.</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
