import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [formData, setFormData] = useState({ fullName: '', email: user.email || '', whatsappNumber: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await axios.put('/api/auth/me', formData, { headers: { Authorization: `Bearer ${token}` } });
            setMessage(t('common.profileUpdated')); setTimeout(() => setMessage(''), 3000);
        } catch (err) { setMessage(t('common.updateFailed')); } finally { setLoading(false); }
    };

    return (
        <div className="profile-page">
            <h1>{t('profile.title')}</h1>
            <Link to="/" className="back-link">{t('profile.backToShop')}</Link>
            <form onSubmit={handleSubmit} className="profile-form">
                {message && <div className="message">{message}</div>}
                <div className="form-group"><label>{t('profile.email')}</label><input type="email" value={formData.email} disabled /></div>
                <div className="form-group"><label>{t('profile.fullName')}</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} /></div>
                <div className="form-group"><label>{t('profile.whatsapp')}</label><input type="tel" value={formData.whatsappNumber} onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})} /></div>
                <button type="submit" disabled={loading}>{loading ? t('common.saving') : t('common.saveChanges')}</button>
            </form>
        </div>
    );
};
export default Profile;
