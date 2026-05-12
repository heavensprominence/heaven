import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './Dashboard.css';

const SellerDashboard = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [stats, setStats] = useState(null);
    const [posts, setPosts] = useState([]);
    const [sales, setSales] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [selectedPosts, setSelectedPosts] = useState([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => { fetchDashboard(); fetchPosts(); fetchSales(); }, []);

    const fetchDashboard = async () => {
        try { const res = await axios.get('/api/shop/seller/dashboard', { headers: { Authorization: `Bearer ${token}` } }); setStats(res.data.stats); }
        catch (err) { console.error('Failed to fetch dashboard:', err); }
    };
    const fetchPosts = async () => {
        try { const res = await axios.get('/api/shop/seller/listings', { headers: { Authorization: `Bearer ${token}` } }); setPosts(res.data.listings || []); }
        catch (err) { console.error('Failed to fetch posts:', err); } finally { setLoading(false); }
    };
    const fetchSales = async () => {
        try { const res = await axios.get('/api/shop/seller/sales', { headers: { Authorization: `Bearer ${token}` } }); setSales(res.data.sales || []); }
        catch (err) { console.error('Failed to fetch sales:', err); }
    };
    const handleDelete = async (id) => {
        if (!window.confirm(t('seller.deleteConfirm'))) return;
        try { await axios.delete(`/api/shop/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchPosts(); fetchDashboard(); }
        catch (err) { alert('Failed to delete: ' + (err.response?.data?.error || err.message)); }
    };
    const handleSelectAll = (e) => { if (e.target.checked) setSelectedPosts(filteredPosts.map(p => p.id)); else setSelectedPosts([]); };
    const handleSelectPost = (id) => { setSelectedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]); };
    const handleBulkDelete = async () => {
        if (selectedPosts.length === 0) { alert('No posts selected'); return; }
        if (!window.confirm(`Delete ${selectedPosts.length} selected posts?`)) return;
        setBulkDeleting(true);
        try { await axios.post('/api/shop/listings/bulk-delete', { ids: selectedPosts }, { headers: { Authorization: `Bearer ${token}` } }); setSelectedPosts([]); fetchPosts(); fetchDashboard(); }
        catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); } finally { setBulkDeleting(false); }
    };

    const filteredPosts = filterType === 'all' ? posts : filterType === 'selling' ? posts.filter(p => p.type !== 'reverse_auction') : posts.filter(p => p.type === 'reverse_auction');
    const sellingCount = posts.filter(p => p.type !== 'reverse_auction').length;
    const procuringCount = posts.filter(p => p.type === 'reverse_auction').length;

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <div className="dashboard seller-dashboard">
                    <div className="dashboard-header">
                        <h1>📋 {t('seller.dashboard')}</h1>
                        <Link to="/" className="back-to-shop">← {t('nav.shop')}</Link>
                        <Link to="/disputes" className="disputes-link">⚖️ {t('nav.disputes')}</Link>
                        <Link to="/create" className="create-btn">{t('seller.createListing')}</Link>
                        <Link to="/seller/bulk-import" className="bulk-import-btn">{t('nav.bulkImport')}</Link>
                    </div>
                    <div className="dashboard-tabs">
                        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>📊 {t('seller.overview')}</button>
                        <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>📋 {t('seller.posts')} ({posts.length})</button>
                        <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>💰 {t('seller.sales')} ({sales.length})</button>
                    </div>
                    {activeTab === 'overview' && stats && (
                        <div className="dashboard-overview"><div className="stats-grid">
                            <div className="stat-card"><h3>{stats.total_listings || 0}</h3><p>{t('seller.totalListings')}</p></div>
                            <div className="stat-card"><h3>{stats.active_listings || 0}</h3><p>{t('seller.activeListings')}</p></div>
                            <div className="stat-card"><h3>{sellingCount}</h3><p>🛍️ Selling</p></div>
                            <div className="stat-card"><h3>{procuringCount}</h3><p>📋 Procuring</p></div>
                            <div className="stat-card highlight"><h3>${((stats.revenue_cents || 0) / 100).toFixed(2)}</h3><p>{t('seller.revenue')}</p></div>
                        </div></div>
                    )}
                    {activeTab === 'posts' && (
                        <div className="posts-section">
                            <div className="filter-bar">
                                <button className={filterType === 'all' ? 'active' : ''} onClick={() => setFilterType('all')}>{t('seller.filterAll')} ({posts.length})</button>
                                <button className={filterType === 'selling' ? 'active' : ''} onClick={() => setFilterType('selling')}>🛍️ Selling ({sellingCount})</button>
                                <button className={filterType === 'procuring' ? 'active' : ''} onClick={() => setFilterType('procuring')}>📋 Procuring ({procuringCount})</button>
                            </div>
                            {selectedPosts.length > 0 && (<div className="bulk-actions"><span>{selectedPosts.length} selected</span><button className="bulk-delete-btn" onClick={handleBulkDelete} disabled={bulkDeleting}>{bulkDeleting ? t('common.processing') : '🗑️ Delete Selected'}</button><button className="clear-selection-btn" onClick={() => setSelectedPosts([])}>Clear</button></div>)}
                            {loading ? <p>{t('common.loading')}</p> : filteredPosts.length === 0 ? (<p>{t('seller.noListings')} <Link to="/create">{t('seller.createListing')} →</Link></p>) : (
                                <table className="posts-table"><thead><tr><th><input type="checkbox" onChange={handleSelectAll} checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0} /></th><th>Type</th><th>Title</th><th>Price/Budget</th><th>{t('common.status')}</th><th>{t('common.date')}</th><th>{t('common.actions')}</th></tr></thead>
                                <tbody>{filteredPosts.map(p => (
                                    <tr key={p.id}><td><input type="checkbox" checked={selectedPosts.includes(p.id)} onChange={() => handleSelectPost(p.id)} /></td>
                                    <td><span className={`type-badge ${p.type}`}>{p.type === 'reverse_auction' ? '📋 Procuring' : p.type === 'auction' ? '🔨 Auction' : p.type === 'classifieds' ? '📰 Classified' : '🛍️ Selling'}</span></td>
                                    <td>{p.title}</td><td>{p.type === 'reverse_auction' ? `Budget: $${((p.max_bid_cents || 0)/100).toFixed(2)}` : p.price_cents ? `$${(p.price_cents/100).toFixed(2)}` : p.min_bid_cents ? `From $${(p.min_bid_cents/100).toFixed(2)}` : t('common.free')}</td>
                                    <td><span className={`status-badge ${p.status}`}>{p.status}</span></td><td>{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td><Link to={`/listing/${p.id}`} className="view-btn">{t('common.viewAll')}</Link><button onClick={() => handleDelete(p.id)} className="delete-btn">{t('common.delete')}</button></td></tr>
                                ))}</tbody></table>
                            )}
                        </div>
                    )}
                    {activeTab === 'sales' && (
                        <div className="sales-section"><h2>Transaction History</h2>
                            {sales.length === 0 ? <p>{t('common.noResults')}</p> : (
                                <table className="sales-table"><thead><tr><th>Item</th><th>Counterparty</th><th>Type</th><th>Amount</th><th>Fee</th><th>Net</th><th>{t('common.date')}</th></tr></thead>
                                <tbody>{sales.map(s => (<tr key={s.id}><td><div className="sale-item"><img src={s.image || '/shop-banner.png'} alt={s.title} /><span>{s.title}</span></div></td><td>{s.buyer_name || s.buyer_email}</td><td><span className={`type-badge ${s.listing_type || 'sale'}`}>{s.listing_type === 'reverse_auction' ? '📋 Procurement' : '🛍️ Sale'}</span></td><td>${(s.amount_cents / 100).toFixed(2)}</td><td>${((s.platform_fee_cents || 0) / 100).toFixed(2)}</td><td>${((s.seller_payout_cents || s.amount_cents) / 100).toFixed(2)}</td><td>{new Date(s.created_at).toLocaleDateString()}</td></tr>))}</tbody></table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default SellerDashboard;
