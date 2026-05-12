import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './StoreSettings.css';

const StoreSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState(null);
    const [copied, setCopied] = useState({ subpath: false, subdomain: false });
    const [formData, setFormData] = useState({
        store_name: '',
        description: '',
        paypal_email: '',
        return_policy: '',
        shipping_policy: '',
        processing_time_days: 2,
        settings: {
            accept_offers: true,
            auto_approve_offers: false,
            minimum_offer_percent: 50,
            vacation_mode: false,
            vacation_message: ''
        }
    });

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const res = await axios.get('/api/shop/stores/my-store', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.store) {
                setStore(res.data.store);
                setFormData({
                    store_name: res.data.store.store_name || '',
                    description: res.data.store.description || '',
                    paypal_email: res.data.store.paypal_email || '',
                    return_policy: res.data.store.return_policy || '',
                    shipping_policy: res.data.store.shipping_policy || '',
                    processing_time_days: res.data.store.processing_time_days || 2,
                    settings: res.data.store.settings || formData.settings
                });
            }
        } catch (err) {
            console.error('Failed to fetch store:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSettingsChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings, [field]: value }
        }));
    };

    const handleCreateStore = async () => {
        if (!formData.store_name.trim()) {
            alert('Store name is required');
            return;
        }
        setSaving(true);
        try {
            const res = await axios.post('/api/shop/stores', {
                store_name: formData.store_name,
                description: formData.description
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStore(res.data.store);
            alert('Store created successfully!');
        } catch (err) {
            alert('Failed to create store: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStore = async () => {
        setSaving(true);
        try {
            await axios.put(`/api/shop/stores/${store.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Store settings saved!');
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied({ ...copied, [type]: true });
            setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
        });
    };

    if (loading) return <div className="loading">Loading...</div>;

    // If no store exists, show creation form
    if (!store) {
        return (
            <div className="dashboard-with-sidebar">
                <DashboardSidebar type="seller" />
                <div className="dashboard-content">
                    <div className="store-settings">
                        <h1>Create Your Store</h1>
                        <p className="intro">Create a store to start selling on HeavensLive Shop!</p>
                        
                        <div className="settings-section">
                            <h2>Store Information</h2>
                            <div className="form-group">
                                <label>Store Name *</label>
                                <input type="text" value={formData.store_name}
                                    onChange={(e) => handleChange('store_name', e.target.value)}
                                    placeholder="My Awesome Store" />
                            </div>
                            <div className="form-group">
                                <label>Store Description</label>
                                <textarea rows="4" value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Tell customers about your store..." />
                            </div>
                            <button className="save-btn" onClick={handleCreateStore} disabled={saving}>
                                {saving ? 'Creating...' : 'Create Store'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const subpathUrl = `https://heavenslive.com/shop/store/${store.slug}`;
    const subdomainUrl = `https://shop.heavenslive.com/store/${store.slug}`;

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <div className="store-settings">
                    <h1>Store Settings</h1>
                <Link to="/seller/dashboard" className="back-link">← Back to Posts Dashboard</Link>
                    
                    <div className="store-url-section">
                        <h2>🌐 Your Store URLs</h2>
                        <div className="url-item">
                            <label>Subpath URL:</label>
                            <div className="url-copy-group">
                                <input type="text" value={subpathUrl} readOnly />
                                <button onClick={() => copyToClipboard(subpathUrl, 'subpath')}>
                                    {copied.subpath ? '✓ Copied!' : '📋 Copy'}
                                </button>
                            </div>
                            <a href={subpathUrl} target="_blank" rel="noopener noreferrer" className="visit-link">
                                🔗 Visit
                            </a>
                        </div>
                        <div className="url-item">
                            <label>Subdomain URL:</label>
                            <div className="url-copy-group">
                                <input type="text" value={subdomainUrl} readOnly />
                                <button onClick={() => copyToClipboard(subdomainUrl, 'subdomain')}>
                                    {copied.subdomain ? '✓ Copied!' : '📋 Copy'}
                                </button>
                            </div>
                            <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" className="visit-link">
                                🔗 Visit
                            </a>
                        </div>
                        <p className="url-hint">Share these links with your customers!</p>
                    </div>

                    <div className="store-preview">
                        <Link to={`/shop/store/${store.slug}`} target="_blank">
                            View Your Store →
                        </Link>
                    </div>

                    <div className="settings-section">
                        <h2>Basic Information</h2>
                        <div className="form-group">
                            <label>Store Name</label>
                            <input type="text" value={formData.store_name}
                                onChange={(e) => handleChange('store_name', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Store Slug</label>
                            <input type="text" value={store.slug} readOnly className="readonly" />
                            <p className="hint">Your store's unique identifier in the URL</p>
                        </div>
                        <div className="form-group">
                            <label>Store Description</label>
                            <textarea rows="4" value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)} />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Payment Settings</h2>
                        <div className="form-group">
                            <label>PayPal Email (for receiving payments)</label>
                            <input type="email" value={formData.paypal_email}
                                onChange={(e) => handleChange('paypal_email', e.target.value)}
                                placeholder="your-paypal@email.com" />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Policies</h2>
                        <div className="form-group">
                            <label>Return Policy</label>
                            <textarea rows="3" value={formData.return_policy}
                                onChange={(e) => handleChange('return_policy', e.target.value)}
                                placeholder="e.g., 30-day returns accepted" />
                        </div>
                        <div className="form-group">
                            <label>Shipping Policy</label>
                            <textarea rows="3" value={formData.shipping_policy}
                                onChange={(e) => handleChange('shipping_policy', e.target.value)}
                                placeholder="e.g., Ships within 2 business days" />
                        </div>
                        <div className="form-group">
                            <label>Processing Time (days)</label>
                            <input type="number" min="0" max="30" value={formData.processing_time_days}
                                onChange={(e) => handleChange('processing_time_days', parseInt(e.target.value))} />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Offer Settings</h2>
                        <div className="form-group checkbox">
                            <label>
                                <input type="checkbox" checked={formData.settings.accept_offers}
                                    onChange={(e) => handleSettingsChange('accept_offers', e.target.checked)} />
                                Accept offers on your listings
                            <p className="offer-note">💡 Promotions will apply on top of accepted offers, giving buyers even more savings!</p>
                            </label>
                        </div>
                        {formData.settings.accept_offers && (
                            <>
                                <div className="form-group checkbox">
                                    <label>
                                        <input type="checkbox" checked={formData.settings.auto_approve_offers}
                                            onChange={(e) => handleSettingsChange('auto_approve_offers', e.target.checked)} />
                                        Auto-approve offers above minimum
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label>Minimum Offer Percentage</label>
                                    <div className="input-with-suffix">
                                        <input type="number" min="0" max="100" 
                                            value={formData.settings.minimum_offer_percent}
                                            onChange={(e) => handleSettingsChange('minimum_offer_percent', parseInt(e.target.value))} />
                                        <span>%</span>
                                    </div>
                                    <p className="hint">Auto-accept offers at or above this percentage of asking price</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="settings-section">
                        <h2>Vacation Mode</h2>
                        <div className="form-group checkbox">
                            <label>
                                <input type="checkbox" checked={formData.settings.vacation_mode}
                                    onChange={(e) => handleSettingsChange('vacation_mode', e.target.checked)} />
                                Enable Vacation Mode
                            </label>
                        </div>
                        {formData.settings.vacation_mode && (
                            <div className="form-group">
                                <label>Vacation Message</label>
                                <textarea rows="2" value={formData.settings.vacation_message}
                                    onChange={(e) => handleSettingsChange('vacation_message', e.target.value)}
                                    placeholder="I'm away until..." />
                            </div>
                        )}
                    </div>

                    <div className="settings-actions">
                        <button className="save-btn" onClick={handleUpdateStore} disabled={saving}>
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreSettings;
