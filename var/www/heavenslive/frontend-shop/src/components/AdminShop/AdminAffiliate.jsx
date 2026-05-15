import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminAffiliate.css';

const AdminAffiliate = ({ token }) => {
    const [settings, setSettings] = useState({
        signup_bonus: 0,
        first_purchase_rate: 5.0,
        ongoing_purchase_rate: 2.0,
        seller_sale_rate: 1.0,
        cookie_days: 30,
        minimum_payout_cents: 2500
    });
    const [tiers, setTiers] = useState({
        standard: { min_referrals: 0, bonus_rate: 0 },
        bronze: { min_referrals: 5, bonus_rate: 0.5 },
        silver: { min_referrals: 20, bonus_rate: 1.0 },
        gold: { min_referrals: 50, bonus_rate: 2.0 },
        platinum: { min_referrals: 100, bonus_rate: 3.0 }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [payouts, setPayouts] = useState([]);
    const [activeTab, setActiveTab] = useState('commission');

    useEffect(() => {
        fetchSettings();
        fetchPayouts();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/shop/admin/affiliate/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.commission) setSettings(res.data.commission);
            if (res.data.tiers) setTiers(res.data.tiers);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayouts = async () => {
        try {
            const res = await axios.get('/api/shop/admin/affiliate/payouts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayouts(res.data.payouts || []);
        } catch (err) {
            console.error('Failed to fetch payouts:', err);
        }
    };

    const saveCommission = async () => {
        setSaving(true);
        try {
            await axios.put('/api/shop/admin/affiliate/settings/commission', settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Commission settings saved!');
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const saveTiers = async () => {
        setSaving(true);
        try {
            await axios.put('/api/shop/admin/affiliate/settings/tiers', tiers, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Reward tiers saved!');
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const processPayout = async (payoutId, status) => {
        try {
            await axios.post(`/api/shop/admin/affiliate/payouts/${payoutId}/process`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPayouts();
            alert(`Payout ${status}!`);
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-affiliate">
            <h2>🤝 Affiliate Program Management</h2>
            
            <div className="affiliate-tabs">
                <button className={activeTab === 'commission' ? 'active' : ''} onClick={() => setActiveTab('commission')}>
                    💰 Commission Rates
                </button>
                <button className={activeTab === 'tiers' ? 'active' : ''} onClick={() => setActiveTab('tiers')}>
                    🏆 Reward Tiers
                </button>
                <button className={activeTab === 'payouts' ? 'active' : ''} onClick={() => setActiveTab('payouts')}>
                    💸 Payout Requests
                </button>
            </div>

            {activeTab === 'commission' && (
                <div className="settings-section">
                    <h3>Commission Structure</h3>
                    <div className="form-group">
                        <label>Signup Bonus ($)</label>
                        <input type="number" min="0" step="1" value={settings.signup_bonus} 
                            onChange={(e) => setSettings({...settings, signup_bonus: parseFloat(e.target.value)})} />
                    </div>
                    <div className="form-group">
                        <label>First Purchase Rate (%)</label>
                        <input type="number" min="0" max="100" step="0.1" value={settings.first_purchase_rate} 
                            onChange={(e) => setSettings({...settings, first_purchase_rate: parseFloat(e.target.value)})} />
                    </div>
                    <div className="form-group">
                        <label>Ongoing Purchase Rate (%)</label>
                        <input type="number" min="0" max="100" step="0.1" value={settings.ongoing_purchase_rate} 
                            onChange={(e) => setSettings({...settings, ongoing_purchase_rate: parseFloat(e.target.value)})} />
                    </div>
                    <div className="form-group">
                        <label>Seller Sale Rate (%)</label>
                        <input type="number" min="0" max="100" step="0.1" value={settings.seller_sale_rate} 
                            onChange={(e) => setSettings({...settings, seller_sale_rate: parseFloat(e.target.value)})} />
                    </div>
                    <div className="form-group">
                        <label>Cookie Duration (Days)</label>
                        <input type="number" min="1" max="365" value={settings.cookie_days} 
                            onChange={(e) => setSettings({...settings, cookie_days: parseInt(e.target.value)})} />
                    </div>
                    <div className="form-group">
                        <label>Minimum Payout ($)</label>
                        <input type="number" min="1" step="1" value={settings.minimum_payout_cents / 100} 
                            onChange={(e) => setSettings({...settings, minimum_payout_cents: Math.round(parseFloat(e.target.value) * 100)})} />
                    </div>
                    <button className="save-btn" onClick={saveCommission} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Commission Settings'}
                    </button>
                </div>
            )}

            {activeTab === 'tiers' && (
                <div className="settings-section">
                    <h3>Reward Tiers</h3>
                    {Object.entries(tiers).map(([name, config]) => (
                        <div key={name} className="tier-row">
                            <h4>{name.charAt(0).toUpperCase() + name.slice(1)}</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Min Referrals</label>
                                    <input type="number" min="0" value={config.min_referrals} 
                                        onChange={(e) => setTiers({...tiers, [name]: {...config, min_referrals: parseInt(e.target.value)}})} />
                                </div>
                                <div className="form-group">
                                    <label>Bonus Rate (%)</label>
                                    <input type="number" min="0" max="100" step="0.1" value={config.bonus_rate} 
                                        onChange={(e) => setTiers({...tiers, [name]: {...config, bonus_rate: parseFloat(e.target.value)}})} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button className="save-btn" onClick={saveTiers} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Tier Settings'}
                    </button>
                </div>
            )}

            {activeTab === 'payouts' && (
                <div className="settings-section">
                    <h3>Pending Payout Requests</h3>
                    {payouts.length === 0 ? (
                        <p>No pending payout requests.</p>
                    ) : (
                        <table className="payouts-table">
                            <thead>
                                <tr><th>Affiliate</th><th>Amount</th><th>PayPal</th><th>Requested</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {payouts.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.affiliate_email}</td>
                                        <td>${(p.amount_cents / 100).toFixed(2)}</td>
                                        <td>{p.paypal_email}</td>
                                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="approve-btn" onClick={() => processPayout(p.id, 'completed')}>✅ Pay</button>
                                            <button className="reject-btn" onClick={() => processPayout(p.id, 'rejected')}>❌ Reject</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminAffiliate;
