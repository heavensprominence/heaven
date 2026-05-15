import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRegisterPath } from '../utils/pathHelper';
import './Auth.css';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const returnTo = searchParams.get('returnTo') || '/';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.ok) navigate(returnTo);
            }).catch(() => localStorage.removeItem('token'));
        }
    }, [navigate, returnTo]);

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
                            message: data.message || 'Verification code sent to your email',
                            returnTo
                        } 
                    });
                } else if (data.token) {
                    localStorage.setItem('token', data.token);
                window.dispatchEvent(new Event("storage"));
                    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                    navigate(returnTo);
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
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🛍️ HeavensLive Shop</h1>
                    <p>{t('auth.loginTitle')}</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>{t('auth.email')}</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
                    </div>
                    <div className="form-group">
                        <label>{t('auth.password')}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? t('common.processing') : t('auth.loginBtn')}
                    </button>
                    <div className="auth-links">
                        <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
                    </div>
                    <div className="auth-footer">
                        <span>{t('auth.noAccount')} </span>
                        <Link to={getRegisterPath()}>{t('auth.registerHere')}</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
