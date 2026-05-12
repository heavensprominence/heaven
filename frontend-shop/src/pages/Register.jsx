import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Auth.css';

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const res = await axios.post('/api/auth/register', {
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                source: 'shop'
            });
            
            if (res.data.success) {
                setSuccess('Registration successful! Please check your email to verify your account.');
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🛍️ HeavensLive Shop</h1>
                    <p>{t('auth.registerTitle')}</p>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>{t('auth.email')} *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>{t('auth.fullName')}</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>{t('auth.password')} *</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="8" />
                    </div>
                    <div className="form-group">
                        <label>{t('auth.confirmPassword')} *</label>
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? t('common.processing') : t('auth.registerBtn')}
                    </button>
                    <div className="auth-footer">
                        <span>{t('auth.hasAccount')} </span>
                        <Link to="/login">{t('auth.loginHere')}</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
