import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './GiftCards.css';

const GiftCards = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        amount: 25,
        customAmount: '',
        recipientName: '',
        recipientEmail: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [purchasedCard, setPurchasedCard] = useState(null);

    const presetAmounts = [25, 50, 100, 250, 500, 1000];
    const isCustom = formData.amount === 'custom';
    const finalAmount = isCustom ? parseFloat(formData.customAmount) : formData.amount;

    const handlePurchase = async () => {
        if (!token) {
            navigate('/login');
            return;
        }
        if (!finalAmount || finalAmount < 1 || finalAmount > 1000) {
            alert('Please enter a valid amount between $1 and $1000');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('/api/shop/gift-cards/purchase', {
                amount: finalAmount,
                recipientName: formData.recipientName,
                recipientEmail: formData.recipientEmail,
                message: formData.message
            }, { headers: { Authorization: `Bearer ${token}` } });
            setPurchasedCard(res.data.giftCard);
            setStep(3);
        } catch (err) {
            alert('Purchase failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="gift-cards-page">
                <h1>🎁 Gift Cards</h1>
            <Link to="/" className="back-link">← Back to Shop</Link>
                <p>Please <Link to="/login">log in</Link> to purchase a gift card.</p>
            </div>
        );
    }

    return (
        <div className="gift-cards-page">
            <h1>🎁 Gift Cards</h1>
            <Link to="/" className="back-link">← Back to Shop</Link>
            <p className="subtitle">Give the gift of choice with a HeavensLive Shop gift card</p>
            
            {step === 1 && (
                <div className="amount-selection">
                    <h2>Select Amount</h2>
                    <div className="preset-amounts">
                        {presetAmounts.map(amt => (
                            <button key={amt} className={formData.amount === amt ? 'active' : ''} onClick={() => setFormData({...formData, amount: amt})}>
                                ${amt}
                            </button>
                        ))}
                        <button className={isCustom ? 'active' : ''} onClick={() => setFormData({...formData, amount: 'custom'})}>
                            Custom
                        </button>
                    </div>
                    
                    {isCustom && (
                        <div className="custom-amount">
                            <label>Enter amount ($1 - $1000)</label>
                            <input type="number" min="1" max="1000" step="1" value={formData.customAmount} onChange={(e) => setFormData({...formData, customAmount: e.target.value})} />
                        </div>
                    )}
                    
                    <button className="next-btn" onClick={() => setStep(2)} disabled={isCustom && (!formData.customAmount || formData.customAmount < 1 || formData.customAmount > 1000)}>
                        Continue → ${finalAmount || 0}
                    </button>
                </div>
            )}
            
            {step === 2 && (
                <div className="recipient-details">
                    <h2>Recipient Details (Optional)</h2>
                    <div className="form-group">
                        <label>Recipient Name</label>
                        <input type="text" value={formData.recipientName} onChange={(e) => setFormData({...formData, recipientName: e.target.value})} placeholder="Your friend's name" />
                    </div>
                    <div className="form-group">
                        <label>Recipient Email</label>
                        <input type="email" value={formData.recipientEmail} onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})} placeholder="friend@email.com" />
                    </div>
                    <div className="form-group">
                        <label>Personal Message</label>
                        <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Enjoy your gift!" rows="4" />
                    </div>
                    <div className="action-buttons">
                        <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
                        <button className="purchase-btn" onClick={handlePurchase} disabled={loading}>
                            {loading ? 'Processing...' : `Purchase $${finalAmount} Gift Card`}
                        </button>
                    </div>
                </div>
            )}
            
            {step === 3 && purchasedCard && (
                <div className="purchase-success">
                    <h2>✅ Gift Card Purchased!</h2>
                    <div className="gift-card-display">
                        <div className="card-code">{purchasedCard.code}</div>
                        <div className="card-amount">${(purchasedCard.initial_amount_cents / 100).toFixed(2)}</div>
                        <p>Share this code with the recipient. They can redeem it at checkout.</p>
                        <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(purchasedCard.code); alert('Code copied!'); }}>📋 Copy Code</button>
                    </div>
                    <Link to="/" className="done-btn">Done</Link>
                </div>
            )}
        </div>
    );
};

export default GiftCards;
