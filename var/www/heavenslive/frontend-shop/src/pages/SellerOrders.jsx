import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './Dashboard.css';

const SellerOrders = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/shop/seller/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <h1>📦 Orders</h1>
                {loading ? <p>Loading...</p> : orders.length === 0 ? (
                    <p>No orders yet.</p>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr><th>Item</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td>{o.title}</td>
                                    <td>{o.buyer_email}</td>
                                    <td>${(o.amount_cents/100).toFixed(2)}</td>
                                    <td>{o.status}</td>
                                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <Link to={`/rate/${o.id}?type=buyer`} className="rate-btn">⭐ Rate Buyer</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SellerOrders;
