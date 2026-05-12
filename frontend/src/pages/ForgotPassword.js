import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TestingBanner from '../components/TestingBanner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('If an account exists with this email, you will receive a password reset link.');
        setEmail('');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <TestingBanner />

      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        {message && (
          <div style={{ background: '#00ff8820', padding: '12px', borderRadius: '4px', marginBottom: '15px', color: '#0f0' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ background: '#ff444420', padding: '12px', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <Link to="login" style={{ color: '#aaa', fontSize: '0.85rem' }}>
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
