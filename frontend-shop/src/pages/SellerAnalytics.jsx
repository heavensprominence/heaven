import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const SellerAnalytics = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [period, setPeriod] = useState('30d');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAnalytics(); }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/shop/analytics/seller?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
            setData(res.data);
        } catch (err) { console.error('Failed:', err); } finally { setLoading(false); }
    };

    if (loading) return <div className="loading">{t('analytics.loading')}</div>;
    if (!data) return <div className="error">{t('analytics.error')}</div>;

    const { stats, trend, topItems, categories } = data;

    const salesChartData = {
        labels: trend.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{ label: t('analytics.revenue'), data: trend.map(t => (t.revenue / 100).toFixed(2)), borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)', tension: 0.4, fill: true }]
    };

    const categoryChartData = {
        labels: categories.map(c => c.category),
        datasets: [{ data: categories.map(c => c.revenue / 100), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'] }]
    };

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <div className="analytics-dashboard">
                    <div className="analytics-header">
                        <h1>📊 {t('analytics.title')}</h1>
                        <Link to="/seller/dashboard" className="back-link">← {t('analytics.backToDashboard')}</Link>
                        <div className="period-selector">
                            <button className={period === '7d' ? 'active' : ''} onClick={() => setPeriod('7d')}>{t('analytics.sevenDays')}</button>
                            <button className={period === '30d' ? 'active' : ''} onClick={() => setPeriod('30d')}>{t('analytics.thirtyDays')}</button>
                            <button className={period === '90d' ? 'active' : ''} onClick={() => setPeriod('90d')}>{t('analytics.ninetyDays')}</button>
                        </div>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-card"><h3>{stats.active_listings || 0}</h3><p>{t('analytics.activeListings')}</p></div>
                        <div className="stat-card"><h3>{stats.sales_count || 0}</h3><p>{t('analytics.totalSales')}</p></div>
                        <div className="stat-card highlight"><h3>${((stats.revenue_cents || 0) / 100).toFixed(2)}</h3><p>{t('analytics.revenue')}</p></div>
                        <div className="stat-card"><h3>${((stats.avg_sale_value || 0) / 100).toFixed(2)}</h3><p>{t('analytics.avgSaleValue')}</p></div>
                        <div className="stat-card"><h3>{stats.unique_buyers || 0}</h3><p>{t('analytics.uniqueBuyers')}</p></div>
                        <div className="stat-card"><h3>{stats.conversion_rate || 0}%</h3><p>{t('analytics.conversionRate')}</p></div>
                    </div>
                    <div className="chart-container"><h3>{t('analytics.salesTrend')}</h3><Line data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                    <div className="charts-row">
                        <div className="chart-container half"><h3>{t('analytics.topItems')}</h3>
                            <div className="top-items-list">{topItems.map(item => (
                                <div key={item.id} className="top-item"><img src={item.image || '/shop-banner.png'} alt={item.title} /><div className="item-info"><p className="item-title">{item.title}</p><p className="item-stats">{item.sales} {t('seller.sales')} • ${((item.revenue || 0) / 100).toFixed(2)}</p></div></div>
                            ))}</div>
                        </div>
                        <div className="chart-container half"><h3>{t('analytics.revenueByCategory')}</h3><Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SellerAnalytics;
