import { getLoginPath } from '../utils/pathHelper';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TestingBanner from '../components/TestingBanner';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    whatsappNumber: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    if (!agreedToTerms) {
      setMessage('You must agree to the Terms of Use and Privacy Statement');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          whatsappNumber: formData.whatsappNumber,
          source: 'credon'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful! Please check your email to verify your account.');
        setMessageType('success');
        setTimeout(() => { window.location.href = getLoginPath(); }, 3000);
      } else {
        setMessage(data.error || 'Registration failed');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <TestingBanner />
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <h1>🏦 Credon Currency</h1>
          <p>Divinely Inspired • Community Powered</p>
        </div>
        
        {message && (
          <div className={messageType === 'success' ? 'success-message' : 'error-message'} style={{
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            backgroundColor: messageType === 'success' ? '#1a3a1a' : '#3a1a1a',
            color: messageType === 'success' ? '#4CAF50' : '#ff6b6b',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
          </div>
          
          <div className="form-group">
            <label>Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" minLength="8" />
          </div>
          
          <div className="form-group">
            <label>Confirm Password *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
          </div>
          
          <div className="form-group">
            <label>Full Name (Optional)</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" />
          </div>
          
          <div className="form-group">
            <label>WhatsApp Number (Optional)</label>
            <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="+1234567890" />
          </div>

          <div className="form-group terms-checkbox" style={{ marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <span>I agree to the <a href="/credon/terms" target="_blank" style={{ color: '#ffd700' }}>Terms of Use</a> and <a href="/credon/privacy" target="_blank" style={{ color: '#ffd700' }}>Privacy Statement</a></span>
            </label>
          </div>
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Already have an account? </span>
            <Link to="/login" style={{ color: '#4CAF50', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Login here!
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

export default Register;
