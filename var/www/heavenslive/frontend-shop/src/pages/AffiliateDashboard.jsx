import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AffiliateDashboard.css';

const AffiliateDashboard = () => {
    const { t } = useTranslation();
    
    const token = localStorage.getItem('token');
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPayout, setShowPayout] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [paypalEmail, setPaypalEmail] = useState('');
    const [requesting, setRequesting] = useState(false);

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        try {
            const res = await axios.get('/api/shop/affiliate/dashboard', { headers: { Authorization: `Bearer ${token}` } });
            console.log("Affiliate data:", res.data); setDashboard(res.data);
        } catch (err) { console.error('Failed to fetch dashboard:', err); }
        finally { setLoading(false); }
    };

    const handleRequestPayout = async (e) => {
        e.preventDefault();
        if (!payoutAmount || parseFloat(payoutAmount) <= 0) { alert('Enter valid amount'); return; }
        setRequesting(true);
        try {
            await axios.post('/api/shop/affiliate/payout', { amount: parseFloat(payoutAmount), paypalEmail }, { headers: { Authorization: `Bearer ${token}` } });
            alert('Payout requested!'); setShowPayout(false); fetchDashboard();
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
        finally { setRequesting(false); }
    };

    const copyReferralLink = () => {
    
        navigator.clipboard.writeText(dashboard.referralLink);
        alert('Referral link copied!');
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!dashboard) return <div className="error">Failed to load</div>;

    return (
        <div className="affiliate-dashboard">
            <h1>🤝 Affiliate Program</h1>
            <Link to="/" className="back-link">← Back to Shop</Link>
            
            <div className="affiliate-stats">
                <div className="stat-card"><h3>{dashboard.totalReferrals || 0}</h3><p>Total Referrals</p></div>
                <div className="stat-card"><h3>${dashboard.totalEarned.toFixed(2)}</h3><p>Lifetime Earned</p></div>
                <div className="stat-card highlight"><h3>${dashboard.balance.toFixed(2)}</h3><p>Available Balance</p></div>
                <div className="stat-card"><h3>{dashboard.currentTier}</h3><p>Current Tier (+{dashboard.tierBonus}% bonus)</p></div>
            </div>
            
            <div className="referral-link-section">
                <h2>Your Referral Link</h2>
                <div className="referral-link-box">
                    <input type="text" value={dashboard.referralLink} readOnly />
                    <button onClick={copyReferralLink}>📋 Copy</button>
                </div>
                <p className="referral-code">Code: <strong>{dashboard.referralCode}</strong></p>
                <p className="share-hint">Share this link with friends. When they sign up and make purchases, you earn commissions!</p>
            </div>
            
            <div className="commission-info">
                <h2>How You Earn</h2>
                <ul>
                    <li>💰 <strong>5%</strong> on friends' first purchase</li>
                    <li>💰 <strong>2%</strong> on all their future purchases</li>
                    <li>💰 <strong>1%</strong> when they sell items</li>
                    <li>🏆 Tier bonuses up to +3% extra</li>
                </ul>
            </div>
            
            {dashboard.balance >= 25 && (
                <button className="payout-btn" onClick={() => setShowPayout(true)}>💸 Request Payout</button>
            )}
            
            {showPayout && (
                <div className="payout-modal">
                    <h3>Request Payout</h3>
                    <p>Available: ${dashboard.balance.toFixed(2)} (Min: $25.00)</p>
                    <input type="number" min="25" max={dashboard.balance} step="1" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Amount" />
                    <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="PayPal Email" required />
                    <button onClick={handleRequestPayout} disabled={requesting}>{requesting ? 'Processing...' : 'Request Payout'}</button>
                    <button onClick={() => setShowPayout(false)}>Cancel</button>
                </div>
            )}
            
            <div className="recent-referrals">
                <h2>Recent Referrals</h2>
                {dashboard.referrals?.length === 0 ? <p>No referrals yet</p> : (
                    <table><thead><tr><th>User</th><th>Joined</th><th>Status</th></tr></thead>
                        <tbody>{dashboard.referrals.map(r => <tr key={r.id}><td>{r.email}</td><td>{new Date(r.joined_at).toLocaleDateString()}</td><td>{r.status}</td></tr>)}</tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AffiliateDashboard;
