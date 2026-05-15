import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [insights, setInsights] = useState(null);
    const [trends, setTrends] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchAllData();
    }, [selectedCategory]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [insightsRes, trendsRes, perfRes, catRes] = await Promise.all([
                axios.get(`/api/shop/advanced-analytics/predictive${selectedCategory ? `?category=${selectedCategory}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`/api/shop/advanced-analytics/market-trends?days=30${selectedCategory ? `&category=${selectedCategory}` : ''}`),
                axios.get('/api/shop/advanced-analytics/performance', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/shop/categories')
            ]);
            setInsights(insightsRes.data);
            setTrends(trendsRes.data);
            setPerformance(perfRes.data);
            setCategories(catRes.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading advanced analytics...</div>;

    const trendChartData = {
        labels: trends?.trends?.slice(0, 14).map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).reverse() || [],
        datasets: [
            { label: 'Avg Listing Price ($)', data: trends?.trends?.slice(0, 14).map(t => (t.avg_listing_price / 100).toFixed(2)).reverse() || [], borderColor: '#ffd700', tension: 0.4 },
            { label: 'Avg Sale Price ($)', data: trends?.trends?.slice(0, 14).map(t => (t.avg_sale_price / 100).toFixed(2)).reverse() || [], borderColor: '#4CAF50', tension: 0.4 }
        ]
    };

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <div className="advanced-analytics">
                    <div className="analytics-header">
                        <h1>📈 Advanced Analytics</h1>
                        <Link to="/seller/analytics" className="back-link">← Back to Basic Analytics</Link>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="category-filter">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                        </select>
                    </div>

                    {performance && (
                        <div className="performance-score-card">
                            <h2>🏆 Seller Performance Score</h2>
                            <div className="score-display">
                                <div className="score-circle" style={{ '--score': performance.score }}>
                                    <span>{performance.score}</span>
                                </div>
                                <div className="score-details">
                                    <p>⭐ Rating: {performance.rating}</p>
                                    <p>📦 Recent Sales: {performance.recentSales}</p>
                                    <p>🚚 Avg Ship Time: {performance.avgShipTime}</p>
                                    <p>💬 Pending Messages: {performance.pendingMessages}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {insights?.recommendations?.length > 0 && (
                        <div className="recommendations-section">
                            <h2>💡 AI-Powered Recommendations</h2>
                            <div className="recommendations-grid">
                                {insights.recommendations.slice(0, 3).map((rec, i) => (
                                    <div key={i} className={`rec-card ${rec.type}`}>
                                        <span className="rec-icon">{rec.type === 'pricing' ? '💰' : '🎯'}</span>
                                        <h4>{rec.category}</h4>
                                        <p className="rec-insight">{rec.insight}</p>
                                        <p className="rec-action"><strong>Action:</strong> {rec.action}</p>
                                        {rec.potential_gain && <p className="rec-gain">📈 Potential: +${rec.potential_gain}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {trends?.predictions?.length > 0 && (
                        <div className="predictions-section">
                            <h2>🔮 Price Predictions</h2>
                            <div className="predictions-grid">
                                {trends.predictions.slice(0, 4).map((p, i) => (
                                    <div key={i} className="prediction-card">
                                        <h4>{p.category}</h4>
                                        <p className="predicted-price">${(p.predicted_price / 100).toFixed(2)}</p>
                                        <p className="confidence">Confidence: {p.confidence}%</p>
                                        <p className="best-time">📅 Best time: {p.best_time_to_sell}</p>
                                        <p className="demand">📊 Demand: {p.expected_demand}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="chart-container">
                        <h2>📊 Market Trends (Last 14 Days)</h2>
                        <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>

                    {insights?.competitorInsights?.length > 0 && (
                        <div className="competitor-section">
                            <h2>👥 Competitor Analysis</h2>
                            <table className="competitor-table">
                                <thead>
                                    <tr><th>Category</th><th>Your Avg Price</th><th>Market Avg</th><th>Position</th><th>Est. Market Share</th></tr>
                                </thead>
                                <tbody>
                                    {insights.competitorInsights.map((c, i) => (
                                        <tr key={i}>
                                            <td>{c.category}</td>
                                            <td>${(c.avg_price / 100).toFixed(2)}</td>
                                            <td>${(c.competitor_avg / 100).toFixed(2)}</td>
                                            <td><span className={`position-badge ${c.price_position}`}>{c.price_position}</span></td>
                                            <td>{c.estimated_market_share}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
