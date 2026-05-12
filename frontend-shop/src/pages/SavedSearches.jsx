import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './SavedSearches.css';

const SavedSearches = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [searches, setSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        searchType: 'buying',
        category: '',
        type: '',
        condition: '',
        minPrice: '',
        maxPrice: '',
        keywords: '',
        notificationFrequency: 'instant'
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => { fetchSearches(); fetchCategories(); }, []);

    const fetchSearches = async () => {
        try {
            const res = await axios.get('/api/shop/saved-searches', { headers: { Authorization: `Bearer ${token}` } });
            setSearches(res.data.searches || []);
        } catch (err) { console.error('Failed to fetch searches:', err); } 
        finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/shop/categories');
            setCategories(res.data.categories || []);
        } catch (err) {}
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/shop/saved-searches', formData, { headers: { Authorization: `Bearer ${token}` } });
            setShowForm(false);
            setFormData({ name: '', searchType: 'buying', category: '', type: '', condition: '', minPrice: '', maxPrice: '', keywords: '', notificationFrequency: 'instant' });
            fetchSearches();
            alert('Search saved! You will get alerts when new items match.');
        } catch (err) { alert('Failed to save: ' + (err.response?.data?.error || err.message)); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this saved search?')) return;
        try {
            await axios.delete(`/api/shop/saved-searches/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchSearches();
        } catch (err) { alert('Failed to delete'); }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await axios.put(`/api/shop/saved-searches/${id}`, { is_active: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
            fetchSearches();
        } catch (err) { alert('Failed to update'); }
    };

    return (
        <div className="saved-searches-page">
            <h1>🔍 Saved Searches</h1>
            <Link to="/" className="back-link">← Back to Shop</Link>
            <p className="subtitle">Get alerts when new items match your criteria</p>
            
            <button className="create-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : '+ Create New Search'}
            </button>
            
            {showForm && (
                <form className="search-form" onSubmit={handleCreate}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Search Name</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Vintage Watches" required />
                        </div>
                        <div className="form-group">
                            <label>I am looking to</label>
                            <select value={formData.searchType} onChange={(e) => setFormData({...formData, searchType: e.target.value})}>
                                <option value="buying">🛒 Buy Items</option>
                                <option value="selling">📋 Find Procurement Requests</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                <option value="">Any Category</option>
                                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Listing Type</label>
                            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                <option value="">Any Type</option>
                                <option value="mall">🛍️ Mall</option>
                                <option value="classifieds">📰 Classifieds</option>
                                <option value="auction">🔨 Auction</option>
                                {formData.searchType === 'selling' && <option value="reverse_auction">📋 Procurement</option>}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Condition</label>
                            <select value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                                <option value="">Any Condition</option>
                                <option value="new">🆕 New</option>
                                <option value="like_new">✨ Like New</option>
                                <option value="very_good">👍 Very Good</option>
                                <option value="good">👌 Good</option>
                                <option value="fair">📦 Fair</option>
                                <option value="poor">🔧 Poor</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Min Price ($)</label>
                            <input type="number" min="0" step="0.01" value={formData.minPrice} onChange={(e) => setFormData({...formData, minPrice: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Max Price ($)</label>
                            <input type="number" min="0" step="0.01" value={formData.maxPrice} onChange={(e) => setFormData({...formData, maxPrice: e.target.value})} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Keywords</label>
                        <input type="text" value={formData.keywords} onChange={(e) => setFormData({...formData, keywords: e.target.value})} placeholder="e.g., vintage, leather, brand name" />
                    </div>
                    <div className="form-group">
                        <label>Alert Frequency</label>
                        <select value={formData.notificationFrequency} onChange={(e) => setFormData({...formData, notificationFrequency: e.target.value})}>
                            <option value="instant">⚡ Instant (as soon as matched)</option>
                            <option value="daily">📅 Daily Digest</option>
                            <option value="weekly">📆 Weekly Summary</option>
                        </select>
                    </div>
                    <button type="submit" className="submit-btn">Save Search & Get Alerts</button>
                </form>
            )}
            
            {loading ? <p>Loading...</p> : searches.length === 0 ? (
                <p className="no-data">No saved searches yet. Create one to get alerts!</p>
            ) : (
                <div className="searches-list">
                    {searches.map(s => (
                        <div key={s.id} className={`search-card ${!s.is_active ? 'inactive' : ''}`}>
                            <div className="search-header">
                                <h3>{s.name || 'Unnamed Search'}</h3>
                                <span className={`search-type ${s.search_type}`}>{s.search_type === 'buying' ? '🛒 Buying' : '📋 Selling'}</span>
                            </div>
                            <div className="search-details">
                                {s.filters.category && <span>Category: {s.filters.category}</span>}
                                {s.filters.type && <span>Type: {s.filters.type}</span>}
                                {s.filters.condition && <span>Condition: {s.filters.condition}</span>}
                                {s.filters.minPrice && <span>Min: ${s.filters.minPrice}</span>}
                                {s.filters.maxPrice && <span>Max: ${s.filters.maxPrice}</span>}
                                {s.filters.keywords && <span>Keywords: {s.filters.keywords}</span>}
                            </div>
                            <div className="search-footer">
                                <span>🔔 {s.notification_frequency}</span>
                                <div className="search-actions">
                                    <button onClick={() => handleToggle(s.id, s.is_active)}>{s.is_active ? '⏸ Pause' : '▶️ Activate'}</button>
                                    <button onClick={() => handleDelete(s.id)}>🗑️ Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedSearches;
