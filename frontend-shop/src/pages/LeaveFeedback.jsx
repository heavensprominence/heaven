import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './LeaveFeedback.css';

const LeaveFeedback = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orderId } = useParams();
    const token = localStorage.getItem('token');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        rating: 5,
        feedback: '',
        itemAsDescribed: 5,
        communication: 5,
        shippingSpeed: 5,
        wouldRecommend: true,
        releaseEscrow: true
    });

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const res = await axios.get(`/api/shop/ratings/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const pendingOrder = res.data.pending?.find(p => p.id === orderId);
            if (pendingOrder) {
                setOrder(pendingOrder);
            }
        } catch (err) {
            console.error('Failed to fetch order:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            await axios.post('/api/shop/ratings', {
                orderId,
                sellerId: order.seller_id,
                listingId: order.listing_id,
                rating: formData.rating,
                feedback: formData.feedback,
                itemAsDescribed: formData.itemAsDescribed,
                communication: formData.communication,
                shippingSpeed: formData.shippingSpeed,
                wouldRecommend: formData.wouldRecommend,
                releaseEscrow: formData.releaseEscrow
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Thank you for your feedback!');
            navigate('/shop/buyer/dashboard');
        } catch (err) {
            alert('Failed to submit feedback: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!order) return <div className="error">Order not found</div>;

    const needsShipping = order.tracking_number !== null;

    return (
        <div className="leave-feedback">
            <h1>Leave Feedback</h1>
                <Link to="/buyer/dashboard" className="back-link">← Back to Dashboard</Link>
            
            <div className="order-summary-card">
                <img src={order.images?.[0] || '/shop/shop-banner.png'} alt={order.title} />
                <div>
                    <h3>{order.title}</h3>
                    <p>Seller: {order.store_name || order.seller_name}</p>
                    <p>Order Date: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="feedback-form">
                <div className="rating-section">
                    <label>Overall Rating *</label>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`star ${star <= formData.rating ? 'active' : ''}`}
                                onClick={() => setFormData({...formData, rating: star})}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rating-section">
                    <label>Item as Described</label>
                    <div className="star-rating small">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`star ${star <= formData.itemAsDescribed ? 'active' : ''}`}
                                onClick={() => setFormData({...formData, itemAsDescribed: star})}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rating-section">
                    <label>Communication</label>
                    <div className="star-rating small">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`star ${star <= formData.communication ? 'active' : ''}`}
                                onClick={() => setFormData({...formData, communication: star})}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                {needsShipping && (
                    <div className="rating-section">
                        <label>Shipping Speed</label>
                        <div className="star-rating small">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star ${star <= formData.shippingSpeed ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, shippingSpeed: star})}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rating-section">
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.wouldRecommend}
                            onChange={(e) => setFormData({...formData, wouldRecommend: e.target.checked})}
                        />
                        I would recommend this seller
                    </label>
                </div>

                <div className="form-group">
                    <label>Feedback (Optional)</label>
                    <textarea
                        rows="4"
                        value={formData.feedback}
                        onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                        placeholder="Share your experience with this seller..."
                    />
                </div>

                {order.escrow_status === 'held' && (
                    <div className="escrow-release-section">
                        <h3>🔒 Escrow Release</h3>
                        <p>Your payment is being held in escrow.</p>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.releaseEscrow}
                                onChange={(e) => setFormData({...formData, releaseEscrow: e.target.checked})}
                            />
                            <strong>✓ I am satisfied with my purchase and authorize release of funds to the seller.</strong>
                        </label>
                        <p className="escrow-note">
                            {needsShipping 
                                ? 'Funds will be released immediately upon checking this box.'
                                : 'For non-shipped items, funds auto-release after 45 days if not released here.'}
                        </p>
                    </div>
                )}

                <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    );
};

export default LeaveFeedback;
