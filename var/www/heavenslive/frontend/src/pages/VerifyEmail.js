import { getLoginPath } from '../utils/pathHelper';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TestingBanner from '../components/TestingBanner';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`https://heavenslive.com/api/auth/verify-email/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage('Email verified successfully!');
        // Save token and redirect after 3 seconds
        if (data.token) {
          localStorage.setItem('token', data.token);
          setTimeout(() => {
            navigate('/credon');
          }, 3000);
        } else {
          setTimeout(() => {
            navigate(getLoginPath());
          }, 3000);
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid or expired verification link');
        setTimeout(() => {
          navigate(getLoginPath());
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
      setTimeout(() => {
        navigate(getLoginPath());
      }, 3000);
    }
  };

  return (
    <div className="auth-container">
      <TestingBanner />
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <h1>🏦 Email Verification</h1>
        </div>
        
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '3rem', margin: '20px 0' }}>⏳</div>
            <p>Verifying your email address...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', margin: '20px 0' }}>✅</div>
            <p style={{ color: '#00ff88', fontSize: '1.2rem' }}>{message}</p>
            <p>Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', margin: '20px 0' }}>❌</div>
            <p style={{ color: '#ff8888' }}>{message}</p>
            <p>Redirecting to login...</p>
          </>
        )}
        
        <div className="auth-disclaimer" style={{ marginTop: '30px' }}>
          <p>⚠️ TESTING SYSTEM ONLY - No real currency or financial instruments are being offered.</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
