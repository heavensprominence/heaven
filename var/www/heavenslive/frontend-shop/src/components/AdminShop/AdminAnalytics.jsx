import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import './AdminAnalytics.css';

const AdminAnalytics = ({ token }) => {
    const [period, setPeriod] = useState('30d');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/shop/analytics/admin/overview?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading analytics...</div>;
    if (!data) return <div className="error">Failed to load analytics</div>;

    const { stats, trend, categories, topSellers } = data;

    const salesChartData = {
        labels: trend.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: 'Revenue ($)',
            data: trend.map(t => (t.revenue / 100).toFixed(2)),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4
        }]
    };

    const categoryChartData = {
        labels: categories.map(c => c.category),
        datasets: [{
            label: 'Revenue ($)',
            data: categories.map(c => (c.revenue / 100).toFixed(2)),
            backgroundColor: '#36A2EB'
        }]
    };

    return (
        <div className="admin-analytics">
            <div className="analytics-header">
                <h2>📊 Platform Analytics</h2>
                <div className="period-selector">
                    <button className={period === '7d' ? 'active' : ''} onClick={() => setPeriod('7d')}>7 Days</button>
                    <button className={period === '30d' ? 'active' : ''} onClick={() => setPeriod('30d')}>30 Days</button>
                    <button className={period === '90d' ? 'active' : ''} onClick={() => setPeriod('90d')}>90 Days</button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><h3>{stats.total_users || 0}</h3><p>Total Users</p></div>
                <div className="stat-card"><h3>{stats.new_users || 0}</h3><p>New Users</p></div>
                <div className="stat-card"><h3>{stats.active_listings || 0}</h3><p>Active Listings</p></div>
                <div className="stat-card"><h3>{stats.total_stores || 0}</h3><p>Total Stores</p></div>
                <div className="stat-card"><h3>{stats.total_sales || 0}</h3><p>Total Sales</p></div>
                <div className="stat-card highlight"><h3>${((stats.revenue_cents || 0) / 100).toFixed(2)}</h3><p>Revenue</p></div>
                <div className="stat-card highlight"><h3>${((stats.fee_revenue || 0) / 100).toFixed(2)}</h3><p>Platform Fees</p></div>
            </div>

            <div className="chart-container">
                <h3>Revenue Trend</h3>
                <Line data={salesChartData} options={{ responsive: true }} />
            </div>

            <div className="charts-row">
                <div className="chart-container half">
                    <h3>Top Categories</h3>
                    <Bar data={categoryChartData} options={{ responsive: true, indexAxis: 'y' }} />
                </div>
                <div className="chart-container half">
                    <h3>Top Sellers</h3>
                    <table className="top-sellers-table">
                        <thead><tr><th>Seller</th><th>Sales</th><th>Revenue</th></tr></thead>
                        <tbody>
                            {topSellers.map(s => (
                                <tr key={s.id}><td>{s.full_name || s.email}</td><td>{s.sales}</td><td>${((s.revenue || 0) / 100).toFixed(2)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
