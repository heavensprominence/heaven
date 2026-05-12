import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PendingListings from './PendingListings';
import UserManagement from './UserManagement';
import FeeManagement from './FeeManagement';
import CredonGoLive from './CredonGoLive';
import ShopAdmins from './ShopAdmins';
import CategoryManager from "./CategoryManager";
import AdminAnalytics from "./AdminAnalytics";
import AdminAffiliate from "./AdminAffiliate";
import AdminSubscriptions from "./AdminSubscriptions";
import CategorySuggestions from "./CategorySuggestions";
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchStats();
        checkSuperAdmin();
        // eslint-disable-next-line
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/shop/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkSuperAdmin = async () => {
        try {
            const res = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsSuperAdmin(res.data.user?.isSuperAdmin || false);
        } catch (err) {
            console.error('Failed to check admin status:', err);
        }
    };

    const tabs = [
        { id: 'dashboard', label: '📊 Dashboard' },
        { id: 'categories', label: '📁 Manage Categories' },
        { id: "analytics", label: "📊 Analytics" },
        { id: "affiliate", label: "🤝 Affiliate" },
        { id: "subscriptions", label: "💳 Subscriptions" },
        { id: 'suggestions', label: '💡 User Suggestions' },
        { id: 'pending', label: `⏳ Pending Listings (${stats?.pending_listings || 0})` },
        { id: 'users', label: '👥 Users' },
        { id: 'fees', label: '💰 Fees' },
        { id: 'credon', label: '🚀 Credon Go Live' },
        ...(isSuperAdmin ? [{ id: 'admins', label: '👑 Shop Admins' }] : [])
    ];

    if (loading) {
        return <div className="admin-loading">Loading Admin Dashboard...</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-sidebar">
                <h2>Shop Admin</h2>
                <nav>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="admin-content">
                {activeTab === 'dashboard' && (
                    <div className="dashboard-stats">
                        <h1>Dashboard</h1>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>{stats?.pending_listings || 0}</h3>
                                <p>Pending Listings</p>
                            </div>
                            <div className="stat-card">
                                <h3>{stats?.active_listings || 0}</h3>
                                <p>Active Listings</p>
                            </div>
                            <div className="stat-card">
                                <h3>{stats?.suspended_users || 0}</h3>
                                <p>Suspended Users</p>
                            </div>
                            <div className="stat-card">
                                <h3>{stats?.open_disputes || 0}</h3>
                                <p>Open Disputes</p>
                            </div>
                            <div className="stat-card highlight">
                                <h3>${((stats?.revenue_30d_cents || 0) / 100).toFixed(2)}</h3>
                                <p>Revenue (30d)</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "subscriptions" && <AdminSubscriptions token={token} />}
                {activeTab === "affiliate" && <AdminAffiliate token={token} />}
                {activeTab === "analytics" && <AdminAnalytics token={token} />}
                {activeTab === 'categories' && (
                    <CategoryManager token={token} />
                )}

                {activeTab === 'suggestions' && (
                    <CategorySuggestions token={token} />
                )}

                {activeTab === 'pending' && (
                    <PendingListings token={token} onUpdate={fetchStats} />
                )}

                {activeTab === 'users' && (
                    <UserManagement token={token} isSuperAdmin={isSuperAdmin} />
                )}

                {activeTab === 'fees' && (
                    <FeeManagement token={token} />
                )}

                {activeTab === 'credon' && (
                    <CredonGoLive token={token} isSuperAdmin={isSuperAdmin} />
                )}

                {activeTab === 'admins' && isSuperAdmin && (
                    <ShopAdmins token={token} />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
