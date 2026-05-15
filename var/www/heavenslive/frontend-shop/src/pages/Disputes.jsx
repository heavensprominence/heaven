import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Disputes.css';

const Disputes = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { fetchDisputes(); }, []);
    const fetchDisputes = async () => {
        try { const res = await axios.get('/api/shop/disputes/my-disputes', { headers: { Authorization: `Bearer ${token}` } }); setDisputes(res.data.disputes || []); }
        catch (err) { console.error('Failed:', err); } finally { setLoading(false); }
    };
    return (
        <div className="disputes-page">
            <h1>⚖️ {t('nav.disputes')}</h1>
            <Link to="/" className="back-link">← {t('nav.shop')}</Link>
            <div className="disputes-header"><p>If you have an issue with a transaction, you can file a dispute here.</p><Link to="/disputes/new" className="file-dispute-btn">📝 File New Dispute</Link></div>
            {loading ? <p>{t('common.loading')}</p> : disputes.length === 0 ? <p>{t('common.noResults')}</p> : (
                <div className="disputes-list">{disputes.map(d => {
                    const badges = { open: '🟡 Open', under_review: '🔵 Under Review', resolved: '🟢 Resolved', closed: '⚫ Closed', escalated: '🔴 Escalated' };
                    return (<Link to={`/disputes/${d.id}`} key={d.id} className="dispute-card">
                        <div className="dispute-header"><span className={`status-badge ${d.status}`}>{badges[d.status] || d.status}</span><span className="dispute-date">{new Date(d.created_at).toLocaleDateString()}</span></div>
                        <h3>{d.title}</h3><p className="listing-title">Re: {d.listing_title}</p>
                        <p className="dispute-amount">Amount: ${(d.amount_cents/100).toFixed(2)}</p>
                    </Link>);
                })}</div>
            )}
        </div>
    );
};
export default Disputes;
