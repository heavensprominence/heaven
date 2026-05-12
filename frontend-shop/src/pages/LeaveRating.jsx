import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './LeaveRating.css';

const LeaveRating = () => {
    const { t } = useTranslation();
    const { purchaseId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const rateType = searchParams.get('type') || 'seller';
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [ratings, setRatings] = useState({
        overallRating: 5,
        communicationRating: 5,
        paymentSpeedRating: 5,
        shippingSpeedRating: 5,
        itemAccuracyRating: 5,
        feedback: ''
    });

    useEffect(() => {
        fetchPendingRatings();
    }, []);

    const fetchPendingRatings = async () => {
        try {
            const res = await axios.get('/api/shop/ratings/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const pending = rateType === 'seller' 
                ? res.data.pending?.asBuyer 
                : res.data.pending?.asSeller;
                
            const found = pending?.find(p => p.purchase_id === purchaseId);
            if (found) {
                setPurchase(found);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            await axios.post('/api/shop/ratings', {
                purchaseId,
                listingId: purchase.listing_id,
                rateeId: rateType === 'seller' ? purchase.seller_id : purchase.buyer_id,
                ratingType: rateType === 'seller' ? 'seller_rating' : 'buyer_rating',
                ...ratings
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Thank you for your rating!');
            navigate(rateType === 'seller' ? '/buyer/dashboard' : '/seller/dashboard');
        } catch (err) {
            alert('Failed to submit: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!purchase) return <div className="error">Rating not found or already submitted.</div>;

    const rateeName = rateType === 'seller' ? purchase.seller_name : purchase.buyer_name;

    return (
        <div className="leave-rating">
            <h1>Rate Your {rateType === 'seller' ? 'Seller' : 'Buyer'}</h1>
                <Link to="/buyer/dashboard" className="back-link">← Back to Dashboard</Link>
            <div className="purchase-summary">
                <img src={purchase.images?.[0] || '/shop-banner.png'} alt={purchase.title} />
                <div>
                    <h3>{purchase.title}</h3>
                    <p>{rateeName}</p>
                    <p>${(purchase.amount_cents / 100).toFixed(2)}</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="rating-form">
                <div className="rating-group">
                    <label>Overall Rating</label>
                    <StarRating value={ratings.overallRating} onChange={(v) => setRatings({...ratings, overallRating: v})} />
                </div>
                
                <div className="rating-group">
                    <label>Communication</label>
                    <StarRating value={ratings.communicationRating} onChange={(v) => setRatings({...ratings, communicationRating: v})} />
                </div>
                
                {rateType === 'seller' ? (
                    <>
                        <div className="rating-group">
                            <label>Shipping Speed</label>
                            <StarRating value={ratings.shippingSpeedRating} onChange={(v) => setRatings({...ratings, shippingSpeedRating: v})} />
                        </div>
                        <div className="rating-group">
                            <label>Item as Described</label>
                            <StarRating value={ratings.itemAccuracyRating} onChange={(v) => setRatings({...ratings, itemAccuracyRating: v})} />
                        </div>
                    </>
                ) : (
                    <div className="rating-group">
                        <label>Payment Speed</label>
                        <StarRating value={ratings.paymentSpeedRating} onChange={(v) => setRatings({...ratings, paymentSpeedRating: v})} />
                    </div>
                )}
                
                <div className="rating-group">
                    <label>Feedback (Optional)</label>
                    <textarea 
                        value={ratings.feedback} 
                        onChange={(e) => setRatings({...ratings, feedback: e.target.value})}
                        placeholder="Share your experience..."
                        rows="4"
                    />
                </div>
                
                <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </form>
        </div>
    );
};

const StarRating = ({ value, onChange }) => (
    <div className="star-rating">
        {[1,2,3,4,5].map(star => (
            <button key={star} type="button" className={`star ${star <= value ? 'active' : ''}`} onClick={() => onChange(star)}>★</button>
        ))}
    </div>
);

export default LeaveRating;
