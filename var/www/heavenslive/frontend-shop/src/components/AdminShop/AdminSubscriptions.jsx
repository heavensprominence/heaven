import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminSubscriptions.css';

const AdminSubscriptions = ({ token }) => {
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plans');
    const [editingPlan, setEditingPlan] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '', slug: '', description: '', price_monthly_cents: 0, price_yearly_cents: 0,
        platform_fee_percent: 5.0, is_active: true, sort_order: 0,
        features: { max_listings: 10, max_images: 3, bulk_import: false, promotions: false, 
                   customization: false, analytics: false, featured_listings: 0, priority_support: false }
    });

    const featureOptions = [
        { key: 'max_listings', label: 'Max Listings', type: 'number', unlimited: true },
        { key: 'max_images', label: 'Max Images per Listing', type: 'number' },
        { key: 'bulk_import', label: 'Bulk Import', type: 'boolean' },
        { key: 'promotions', label: 'Promo Codes', type: 'boolean' },
        { key: 'customization', label: 'Store Customization', type: 'boolean' },
        { key: 'analytics', label: 'Advanced Analytics', type: 'boolean' },
        { key: 'featured_listings', label: 'Featured Listings', type: 'number', unlimited: true },
        { key: 'priority_support', label: 'Priority Support', type: 'boolean' },
    ];

    useEffect(() => {
        fetchPlans();
        fetchSubscriptions();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await axios.get('/api/shop/admin/subscriptions/plans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlans(res.data.plans || []);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            const res = await axios.get('/api/shop/subscriptions/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubscriptions(res.data.subscriptions || []);
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
        }
    };

    const handleSavePlan = async () => {
        setSaving(true);
        try {
            const payload = { ...formData };
            if (payload.features.max_listings === '') payload.features.max_listings = -1;
            if (payload.features.featured_listings === '') payload.features.featured_listings = -1;
            
            if (editingPlan) {
                await axios.put(`/api/shop/admin/subscriptions/plans/${editingPlan.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/shop/admin/subscriptions/plans', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowAddModal(false);
            setEditingPlan(null);
            setFormData({ name: '', slug: '', description: '', price_monthly_cents: 0, price_yearly_cents: 0,
                platform_fee_percent: 5.0, is_active: true, sort_order: 0,
                features: { max_listings: 10, max_images: 3, bulk_import: false, promotions: false,
                           customization: false, analytics: false, featured_listings: 0, priority_support: false }});
            fetchPlans();
            alert('Plan saved!');
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (plan) => {
        try {
            await axios.put(`/api/shop/admin/subscriptions/plans/${plan.id}`, { ...plan, is_active: !plan.is_active }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPlans();
        } catch (err) {
            alert('Failed to toggle');
        }
    };

    const handleDelete = async (plan) => {
        if (!window.confirm(`Delete ${plan.name} plan?`)) return;
        try {
            await axios.delete(`/api/shop/admin/subscriptions/plans/${plan.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPlans();
        } catch (err) {
            alert('Cannot delete plan with active subscribers');
        }
    };

    const editPlan = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name, slug: plan.slug, description: plan.description || '',
            price_monthly_cents: plan.price_monthly_cents, price_yearly_cents: plan.price_yearly_cents,
            platform_fee_percent: plan.platform_fee_percent, is_active: plan.is_active, sort_order: plan.sort_order,
            features: plan.features || { max_listings: 10, max_images: 3, bulk_import: false, promotions: false,
                                        customization: false, analytics: false, featured_listings: 0, priority_support: false }
        });
        setShowAddModal(true);
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-subscriptions">
            <h2>💳 Subscription Management</h2>
            
            <div className="subscription-tabs">
                <button className={activeTab === 'plans' ? 'active' : ''} onClick={() => setActiveTab('plans')}>
                    📋 Plans
                </button>
                <button className={activeTab === 'subscriptions' ? 'active' : ''} onClick={() => setActiveTab('subscriptions')}>
                    👥 Active Subscriptions
                </button>
            </div>

            {activeTab === 'plans' && (
                <div className="plans-section">
                    <button className="add-btn" onClick={() => { setEditingPlan(null); setShowAddModal(true); }}>
                        ➕ Add New Plan
                    </button>
                    
                    <table className="plans-table">
                        <thead>
                            <tr><th>Order</th><th>Name</th><th>Price (Monthly)</th><th>Fee %</th><th>Status</th><th>Subscribers</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {plans.map(p => (
                                <tr key={p.id} className={!p.is_active ? 'inactive' : ''}>
                                    <td>{p.sort_order}</td>
                                    <td><strong>{p.name}</strong><br /><small>{p.slug}</small></td>
                                    <td>${(p.price_monthly_cents / 100).toFixed(2)}</td>
                                    <td>{p.platform_fee_percent}%</td>
                                    <td>{p.is_active ? '✅ Active' : '❌ Inactive'}</td>
                                    <td>{p.subscriber_count || 0}</td>
                                    <td>
                                        <button className="edit-btn" onClick={() => editPlan(p)}>✏️</button>
                                        <button className="toggle-btn" onClick={() => handleToggleActive(p)}>
                                            {p.is_active ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDelete(p)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'subscriptions' && (
                <div className="subscriptions-section">
                    <table className="subscriptions-table">
                        <thead>
                            <tr><th>User</th><th>Plan</th><th>Billing</th><th>Started</th><th>Expires</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {subscriptions.map(s => (
                                <tr key={s.id}>
                                    <td>{s.email}</td>
                                    <td>{s.plan_name}</td>
                                    <td>{s.billing_cycle}</td>
                                    <td>{new Date(s.started_at).toLocaleDateString()}</td>
                                    <td>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                                    <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal large">
                        <h3>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Slug</label>
                                <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase()})} />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="2" />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Monthly Price ($)</label>
                                <input type="number" min="0" step="0.01" value={formData.price_monthly_cents / 100} 
                                    onChange={(e) => setFormData({...formData, price_monthly_cents: Math.round(parseFloat(e.target.value) * 100)})} />
                            </div>
                            <div className="form-group">
                                <label>Yearly Price ($)</label>
                                <input type="number" min="0" step="0.01" value={formData.price_yearly_cents / 100} 
                                    onChange={(e) => setFormData({...formData, price_yearly_cents: Math.round(parseFloat(e.target.value) * 100)})} />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Platform Fee (%)</label>
                                <input type="number" min="0" max="100" step="0.1" value={formData.platform_fee_percent} 
                                    onChange={(e) => setFormData({...formData, platform_fee_percent: parseFloat(e.target.value)})} />
                            </div>
                            <div className="form-group">
                                <label>Sort Order</label>
                                <input type="number" min="0" value={formData.sort_order} 
                                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
                            </div>
                        </div>
                        
                        <div className="form-group checkbox">
                            <label><input type="checkbox" checked={formData.is_active} 
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})} /> Active</label>
                        </div>
                        
                        <h4>Features & Limits</h4>
                        <div className="features-grid">
                            {featureOptions.map(f => (
                                <div key={f.key} className="feature-item">
                                    <label>{f.label}</label>
                                    {f.type === 'boolean' ? (
                                        <input type="checkbox" checked={formData.features[f.key] || false} 
                                            onChange={(e) => setFormData({...formData, features: {...formData.features, [f.key]: e.target.checked}})} />
                                    ) : (
                                        <input type="number" min="-1" value={formData.features[f.key] === -1 ? '' : (formData.features[f.key] || 0)} 
                                            placeholder={f.unlimited ? 'Unlimited' : ''}
                                            onChange={(e) => setFormData({...formData, features: {...formData.features, [f.key]: e.target.value === '' ? -1 : parseInt(e.target.value)}})} />
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="modal-actions">
                            <button className="save-btn" onClick={handleSavePlan} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Plan'}
                            </button>
                            <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubscriptions;
