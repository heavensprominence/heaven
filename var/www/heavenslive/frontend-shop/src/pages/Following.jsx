import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './Dashboard.css';

const Following = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { fetchFollowing(); }, []);
    const fetchFollowing = async () => {
        try { const res = await axios.get('/api/shop/buyer/following', { headers: { Authorization: `Bearer ${token}` } }); setStores(res.data.stores || []); }
        catch (err) { console.error('Failed:', err); } finally { setLoading(false); }
    };
    const handleUnfollow = async (storeId) => {
        try { await axios.delete(`/api/shop/buyer/following/${storeId}`, { headers: { Authorization: `Bearer ${token}` } }); fetchFollowing(); }
        catch (err) { alert('Failed to unfollow'); }
    };
    return (
        <div className="dashboard-with-sidebar"><DashboardSidebar type="buyer" /><div className="dashboard-content">
            <h1>🏪 {t('nav.following')}</h1>
            <Link to="/buyer/dashboard" className="back-link">← {t('buyer.dashboard')}</Link>
            {loading ? <p>{t('common.loading')}</p> : stores.length === 0 ? <p>{t('common.noResults')}</p> : (
                <div className="following-grid">{stores.map(s => (<div key={s.id} className="following-card">
                    <Link to={`/store/${s.slug}`}><img src={s.logo_url || '/shop-banner.png'} alt={s.store_name} /><h3>{s.store_name}</h3></Link>
                    <button onClick={() => handleUnfollow(s.id)}>{t('common.remove')}</button>
                </div>))}</div>
            )}
        </div></div>
    );
};
export default Following;
