import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const VerifyCode = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [returnTo, setReturnTo] = useState('/');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const state = location.state;
        if (state?.sessionId) {
            setSessionId(state.sessionId);
            setReturnTo(state.returnTo || '/');
            setMessage(state.message || 'Verification code sent to your email');
        } else {
            navigate('/login');
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (code.length !== 6) { setError('Please enter the 6-digit code'); return; }
        setLoading(true); setError('');
        try {
            const res = await axios.post('/api/auth/verify-2fa', { sessionId, code, rememberDevice: true });
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
                navigate(returnTo);
            } else { setError('Invalid verification code'); }
        } catch (err) { setError(err.response?.data?.error || 'Verification failed'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',padding:'20px',background:'linear-gradient(135deg, #0a0f1f 0%, #0b1f3f 50%, #0a1a3a 100%)' }}>
            <div style={{ background:'rgba(0,0,0,0.6)',backdropFilter:'blur(10px)',borderRadius:'30px',padding:'40px',maxWidth:'450px',width:'100%',border:'1px solid rgba(255,215,0,0.3)',boxShadow:'0 10px 40px rgba(0,0,0,0.3)',color:'#f5f5f5' }}>
                <div style={{ textAlign:'center',marginBottom:'30px' }}>
                    <h1 style={{ color:'#ffd700',fontSize:'2rem',marginBottom:'10px' }}>{t('auth.twoFactorTitle')}</h1>
                    <p style={{ color:'#ccc' }}>{message}</p>
                    <p style={{ color:'#ffaa00',fontSize:'0.9rem',marginTop:'10px' }}>{t('auth.checkSpam')}</p>
                </div>
                {error && <div style={{ background:'rgba(255,100,100,0.2)',border:'1px solid #ff6464',borderRadius:'10px',padding:'12px',color:'#ff6464',textAlign:'center',marginBottom:'20px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom:'25px' }}>
                        <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} placeholder="000000" maxLength="6" autoFocus
                            style={{ width:'100%',padding:'15px',fontSize:'28px',textAlign:'center',letterSpacing:'15px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,215,0,0.3)',borderRadius:'12px',color:'white',fontWeight:'bold',outline:'none' }} />
                    </div>
                    <button type="submit" disabled={loading} style={{ width:'100%',padding:'15px',background:'#ffd700',color:'#0b1f3f',border:'none',borderRadius:'12px',fontSize:'1.1rem',fontWeight:'bold',cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1,marginBottom:'15px' }}>
                        {loading ? t('auth.verifying') : t('auth.verifyAndLogin')}
                    </button>
                    <button type="button" onClick={() => navigate('/login')} style={{ width:'100%',padding:'12px',background:'transparent',color:'#ffd700',border:'1px solid rgba(255,215,0,0.3)',borderRadius:'12px',cursor:'pointer' }}>
                        {t('auth.backToLogin')}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default VerifyCode;
