import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './Dashboard.css';

const BuyerPurchases = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { fetchPurchases(); }, []);
    const fetchPurchases = async () => {
        try { const res = await axios.get('/api/shop/buyer/purchases', { headers: { Authorization: `Bearer ${token}` } }); setPurchases(res.data.purchases || []); }
        catch (err) { console.error('Failed to fetch purchases:', err); } finally { setLoading(false); }
    };
    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="buyer" />
            <div className="dashboard-content">
                <h1>{t('buyer.myPurchases')}</h1>
                <Link to="/buyer/dashboard" className="back-link">{t('buyer.backToDashboard')}</Link>
                {loading ? <p>{t('common.loading')}</p> : purchases.length === 0 ? (
                    <p>{t('buyer.noPurchases')} <Link to="/">{t('buyer.startShopping')}</Link></p>
                ) : (
                    <table className="purchases-table">
                        <thead><tr><th>{t('buyer.item')}</th><th>{t('buyer.seller')}</th><th>{t('buyer.price')}</th><th>{t('buyer.status')}</th><th>{t('buyer.date')}</th><th>{t('buyer.actions')}</th></tr></thead>
                        <tbody>{purchases.map(p => (
                            <tr key={p.id}><td><div className="purchase-item"><img src={p.image || '/shop-banner.png'} alt={p.title} /><span>{p.title}</span></div></td><td>{p.seller_name || p.seller_email}</td><td>${(p.amount_cents / 100).toFixed(2)}</td><td><span className={`status-badge ${p.status}`}>{p.status}</span></td><td>{new Date(p.created_at).toLocaleDateString()}</td><td><Link to={`/rate/${p.id}?type=seller`} className="rate-btn">{t('buyer.rate')}</Link></td></tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
export default BuyerPurchases;
