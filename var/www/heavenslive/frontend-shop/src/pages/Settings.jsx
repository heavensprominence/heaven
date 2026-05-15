import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Settings.css';

const Settings = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [myPlan, setMyPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [notifications, setNotifications] = useState({ email: true, push: false, messages: true });

    useEffect(() => { if (token) fetchMyPlan(); else setLoading(false); }, [token]);

    const fetchMyPlan = async () => {
        try { const res = await axios.get("/api/shop/subscriptions/my-plan", { headers: { Authorization: `Bearer ${token}` } }); setMyPlan(res.data); }
        catch (err) { console.error("Failed to fetch plan:", err); setMyPlan({ planName: "Free", planSlug: "free", platformFeePercent: 5.0, limits: { maxListings: 5 } }); }
        finally { setLoading(false); }
    };
    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure?')) return; setCancelling(true);
        try { await axios.post('/api/shop/subscriptions/cancel', {}, { headers: { Authorization: `Bearer ${token}` } }); alert('Cancelled'); fetchMyPlan(); }
        catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); } finally { setCancelling(false); }
    };
    const handleReactivate = async () => {
        try { await axios.post('/api/shop/subscriptions/reactivate', {}, { headers: { Authorization: `Bearer ${token}` } }); alert('Reactivated!'); fetchMyPlan(); }
        catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    if (loading) return <div className="loading">{t('common.loading')}</div>;

    return (
        <div className="settings-page">
            <h1>{t('settings.title')}</h1>
            <Link to="/" className="back-link">{t('settings.backToShop')}</Link>
            <div className="settings-section subscription-section">
                <h2>{t('settings.subscription')}</h2>
                <div className="current-plan-info">
                    <div className="plan-detail"><span className="label">{t('settings.currentPlan')}:</span><span className="value highlight">{myPlan?.planName || 'Free'}</span></div>
                    <div className="plan-detail"><span className="label">{t('settings.platformFee')}:</span><span className="value">{myPlan?.platformFeePercent || 5.0}%</span></div>
                    {myPlan?.limits && <div className="plan-detail"><span className="label">{t('settings.maxListings')}:</span><span className="value">{myPlan.limits.maxListings === -1 ? t('common.unlimited') : myPlan.limits.maxListings}</span></div>}
                    {myPlan?.usage && <div className="plan-detail"><span className="label">{t('settings.listingsUsed')}:</span><span className="value">{myPlan.usage.currentListings || 0} / {myPlan.limits?.maxListings === -1 ? '∞' : myPlan.limits?.maxListings}</span></div>}
                </div>
                <div className="subscription-actions">
                    {myPlan?.planSlug !== 'free' && myPlan?.auto_renew !== false && <button className="cancel-btn" onClick={handleCancelSubscription} disabled={cancelling}>{cancelling ? t('settings.processing') : t('settings.cancelSubscription')}</button>}
                    {myPlan?.auto_renew === false && <button className="reactivate-btn" onClick={handleReactivate}>{t('settings.reactivateSubscription')}</button>}
                    <Link to="/pricing" className="change-plan-btn">{myPlan?.planSlug === 'free' ? t('settings.upgradePlan') : t('settings.changePlan')}</Link>
                </div>
            </div>
            <div className="settings-section"><h2>{t('settings.notifications')}</h2>
                <label><input type="checkbox" checked={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} /> {t('settings.emailNotifications')}</label>
                <label><input type="checkbox" checked={notifications.messages} onChange={() => setNotifications({...notifications, messages: !notifications.messages})} /> {t('settings.messageAlerts')}</label>
            </div>
            <div className="settings-section"><h2>{t('settings.privacy')}</h2>
                <label><input type="checkbox" /> {t('settings.showProfile')}</label>
                <label><input type="checkbox" /> {t('settings.showEmail')}</label>
            </div>
        </div>
    );
};
export default Settings;
