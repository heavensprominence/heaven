import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './Promotions.css';

const Promotions = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [promotions, setPromotions] = useState([]);
    const [listings, setListings] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        listingId: '',
        storeId: '',
        promotionType: 'discount',
        description: '',
        valuePercent: 10,
        minPurchase: '',
        maxDiscount: '',
        usageLimit: '',
        expiresInDays: 30,
        customCode: ''
    });

    useEffect(() => {
        fetchPromotions();
        fetchListings();
        fetchStores();
    }, []);

    const fetchPromotions = async () => {
        try {
            const res = await axios.get('/api/shop/promotions/my-promotions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPromotions(res.data.promotions || []);
        } catch (err) {
            console.error('Failed to fetch promotions:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchListings = async () => {
        try {
            const res = await axios.get('/api/shop/seller/listings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListings(res.data.listings || []);
        } catch (err) {}
    };

    const fetchStores = async () => {
        try {
            const res = await axios.get('/api/shop/stores/my-store', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.store) setStores([res.data.store]);
        } catch (err) {}
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiresInDays));
            
            await axios.post('/api/shop/promotions', {
                listingId: formData.listingId || null,
                storeId: formData.storeId || null,
                promotionType: formData.promotionType,
                description: formData.description,
                valuePercent: formData.valuePercent,
                minPurchaseCents: formData.minPurchase ? Math.round(parseFloat(formData.minPurchase) * 100) : 0,
                maxDiscountCents: formData.maxDiscount ? Math.round(parseFloat(formData.maxDiscount) * 100) : null,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                expiresAt: expiresAt,
                customCode: formData.customCode || null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setShowForm(false);
            setFormData({ listingId: '', storeId: '', promotionType: 'discount', description: '', 
                         valuePercent: 10, minPurchase: '', maxDiscount: '', usageLimit: '', 
                         expiresInDays: 30, customCode: '' });
            fetchPromotions();
            alert('Promotion created successfully!');
        } catch (err) {
            alert('Failed to create: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (id) => {
        try {
            await axios.put(`/api/shop/promotions/${id}/deactivate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPromotions();
        } catch (err) {
            alert('Failed to deactivate');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this promotion?')) return;
        try {
            await axios.delete(`/api/shop/promotions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPromotions();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const getListingTypeLabel = (listing) => {
        if (listing.type === 'reverse_auction') return '📋 Procurement';
        if (listing.type === 'auction') return '🔨 Auction';
        if (listing.type === 'classifieds') return '📰 Classified';
        return '🛍️ Mall';
    };

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <div className="promotions-page">
                    <div className="page-header">
                        <h1>🎟️ Promotions</h1>
                <Link to="/seller/dashboard" className="back-link">← Back to Posts Dashboard</Link>
                        <button className="create-btn" onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel' : '➕ Create Promotion'}
                        </button>
                    </div>
                    
                    {showForm && (
                        <form className="promotion-form" onSubmit={handleCreate}>
                            <h3>Create New Promotion</h3>
                        <div className="info-message">
                            <span>💡 <strong>Note:</strong> Promotions apply to the final price after any accepted offers. Buyers can still make offers on your listings!</span>
                        </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Apply To</label>
                                    <select value={formData.listingId} onChange={(e) => {
                                        const listing = listings.find(l => l.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            listingId: e.target.value,
                                            storeId: '',
                                            promotionType: listing?.type === 'reverse_auction' ? 'premium' : 'discount'
                                        });
                                    }}>
                                        <option value="">-- Select Listing (Optional) --</option>
                                        {listings.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {getListingTypeLabel(l)} - {l.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>Or Apply to Store</label>
                                    <select value={formData.storeId} onChange={(e) => setFormData({...formData, storeId: e.target.value, listingId: ''})}>
                                        <option value="">-- Select Store (Optional) --</option>
                                        {stores.map(s => (
                                            <option key={s.id} value={s.id}>{s.store_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Promotion Type</label>
                                    <select value={formData.promotionType} onChange={(e) => setFormData({...formData, promotionType: e.target.value})}>
                                        <option value="discount">💰 Discount (Buyer pays less)</option>
                                        <option value="premium">📈 Premium Offer (Procurement - bid higher)</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>Value (%)</label>
                                    <input type="number" min="1" max="99" value={formData.valuePercent} 
                                        onChange={(e) => setFormData({...formData, valuePercent: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <input type="text" value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="e.g., Summer Sale 10% Off" />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Custom Code (Optional)</label>
                                    <input type="text" value={formData.customCode} 
                                        onChange={(e) => setFormData({...formData, customCode: e.target.value.toUpperCase()})}
                                        placeholder="SAVE10" />
                                </div>
                                <div className="form-group">
                                    <label>Expires In (Days)</label>
                                    <input type="number" min="1" value={formData.expiresInDays} 
                                        onChange={(e) => setFormData({...formData, expiresInDays: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Min Purchase ($)</label>
                                    <input type="number" min="0" step="0.01" value={formData.minPurchase} 
                                        onChange={(e) => setFormData({...formData, minPurchase: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Max Discount ($)</label>
                                    <input type="number" min="0" step="0.01" value={formData.maxDiscount} 
                                        onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Usage Limit</label>
                                    <input type="number" min="1" value={formData.usageLimit} 
                                        onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                                        placeholder="Unlimited" />
                                </div>
                            </div>
                            
                            <button type="submit" className="submit-btn" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Promotion'}
                            </button>
                        </form>
                    )}
                    
                    {loading ? (
                        <p>Loading promotions...</p>
                    ) : promotions.length === 0 ? (
                        <p className="no-data">No promotions created yet.</p>
                    ) : (
                        <table className="promotions-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Applies To</th>
                                    <th>Used</th>
                                    <th>Status</th>
                                    <th>Expires</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promotions.map(p => (
                                    <tr key={p.id} className={!p.is_active ? 'inactive' : ''}>
                                        <td><strong>{p.code}</strong></td>
                                        <td>{p.promotion_type === 'discount' ? '💰 Discount' : '📈 Premium'}</td>
                                        <td>{p.value_percent}%</td>
                                        <td>{p.listing_title || p.store_name || '—'}</td>
                                        <td>{p.used_count} / {p.usage_limit || '∞'}</td>
                                        <td>{p.is_active ? '✅ Active' : '❌ Inactive'}</td>
                                        <td>{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}</td>
                                        <td>
                                            {p.is_active && (
                                                <button className="deactivate-btn" onClick={() => handleDeactivate(p.id)}>Deactivate</button>
                                            )}
                                            <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Promotions;
