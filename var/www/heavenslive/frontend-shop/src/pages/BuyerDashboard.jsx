import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './Dashboard.css';

const BuyerDashboard = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [stats, setStats] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboard(); fetchPurchases(); }, []);

    const fetchDashboard = async () => {
        try { const res = await axios.get('/api/shop/buyer/dashboard', { headers: { Authorization: `Bearer ${token}` } }); setStats(res.data.stats); }
        catch (err) { console.error('Failed to fetch dashboard:', err); }
    };
    const fetchPurchases = async () => {
        try { const res = await axios.get('/api/shop/buyer/purchases', { headers: { Authorization: `Bearer ${token}` } }); setPurchases(res.data.purchases || []); }
        catch (err) { console.error('Failed to fetch purchases:', err); } finally { setLoading(false); }
    };

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="buyer" />
            <div className="dashboard-content">
                <div className="dashboard buyer-dashboard">
                    <div className="dashboard-header">
                        <h1>{t('buyer.dashboard')}</h1>
                        <Link to="/" className="back-to-shop">{t('buyer.backToShop')}</Link>
                        <Link to="/disputes" className="disputes-link">{t('buyer.disputeCenter')}</Link>
                    </div>
                    <div className="dashboard-tabs">
                        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>{t('buyer.overview')}</button>
                        <button className={activeTab === 'purchases' ? 'active' : ''} onClick={() => setActiveTab('purchases')}>{t('buyer.myPurchases')}</button>
                    </div>
                    {activeTab === 'overview' && stats && (
                        <div className="dashboard-overview">
                            <div className="stats-grid">
                                <div className="stat-card"><h3>{stats.total_purchases || 0}</h3><p>{t('buyer.totalPurchases')}</p></div>
                                <div className="stat-card"><h3>{stats.wishlist_count || 0}</h3><p>{t('buyer.wishlistItems')}</p></div>
                                <div className="stat-card"><h3>{stats.unread_messages || 0}</h3><p>{t('buyer.unreadMessages')}</p></div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'purchases' && (
                        <div className="purchases-section">
                            <h2>{t('buyer.myPurchases')}</h2>
                            {loading ? <p>{t('common.loading')}</p> : purchases.length === 0 ? (
                                <p>{t('buyer.noPurchases')} <Link to="/">{t('buyer.startShopping')}</Link></p>
                            ) : (
                                <table className="purchases-table">
                                    <thead><tr><th>{t('buyer.item')}</th><th>{t('buyer.seller')}</th><th>{t('buyer.price')}</th><th>{t('buyer.status')}</th><th>{t('buyer.date')}</th><th>{t('buyer.actions')}</th></tr></thead>
                                    <tbody>{purchases.map(p => (
                                        <tr key={p.id}>
                                            <td><div className="purchase-item"><img src={p.image || '/shop-banner.png'} alt={p.title} /><span>{p.title}</span></div></td>
                                            <td>{p.seller_name || p.seller_email}</td>
                                            <td>${(p.amount_cents / 100).toFixed(2)}</td>
                                            <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                                            <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                            <td><Link to={`/listing/${p.listing_id}`} className="view-btn">{t('buyer.view')}</Link><Link to={`/rate/${p.id}?type=seller`} className="rate-btn">{t('buyer.rate')}</Link></td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default BuyerDashboard;
