import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './Offers.css';

const Offers = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { fetchOffers(); }, []);
    const fetchOffers = async () => {
        try { const res = await axios.get('/api/shop/seller/offers', { headers: { Authorization: `Bearer ${token}` } }); setOffers(res.data.offers || []); }
        catch (err) { console.error('Failed to fetch offers:', err); } finally { setLoading(false); }
    };
    const handleRespond = async (id, status) => {
        try { await axios.put(`/api/shop/offers/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } }); fetchOffers(); }
        catch (err) { alert('Failed to respond'); }
    };
    return (
        <div className="dashboard-with-sidebar"><DashboardSidebar type="seller" /><div className="dashboard-content">
            <h1>💰 {t('nav.sellerOffers')}</h1>
            <Link to="/seller/dashboard" className="back-link">← {t('seller.dashboard')}</Link>
            {loading ? <p>{t('common.loading')}</p> : offers.length === 0 ? <p>{t('common.noResults')}</p> : (
                <table><thead><tr><th>Buyer</th><th>Listing</th><th>Amount</th><th>Date</th><th>{t('common.actions')}</th></tr></thead>
                <tbody>{offers.map(o => (<tr key={o.id}><td>{o.buyer_name}</td><td>{o.title}</td><td>${(o.amount_cents/100).toFixed(2)}</td><td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td><button onClick={() => handleRespond(o.id, 'accepted')}>✅ {t('common.yes')}</button><button onClick={() => handleRespond(o.id, 'rejected')}>❌ {t('common.no')}</button></td></tr>))}</tbody></table>
            )}
        </div></div>
    );
};
export default Offers;
