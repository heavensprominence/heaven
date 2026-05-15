import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import axios from 'axios';
import './Checkout.css';

const Checkout = () => {
    const { t } = useTranslation();
    
    const navigate = useNavigate();
    const { cart, fetchCart } = useShop();
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState('pickup');
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [applyingPromo, setApplyingPromo] = useState(false);
    const [promoError, setPromoError] = useState('');
    const [giftCardCode, setGiftCardCode] = useState('');
    const [appliedGiftCard, setAppliedGiftCard] = useState(null);
    const [applyingGiftCard, setApplyingGiftCard] = useState(false);
    const [giftCardError, setGiftCardError] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'CA', phone: ''
    });

    useEffect(() => {
        if (!token) navigate('/login');
        const allAllowPickup = cart.length > 0 && cart.every(item => item.allow_local_pickup);
        setDeliveryMethod(allAllowPickup ? 'pickup' : 'shipping');
    }, [token, navigate, cart]);

    const calculateSubtotal = () => {
    
        return cart.reduce((sum, item) => sum + (item.price_cents / 100) * (item.quantity || 1), 0);
    };

    const calculateTotal = () => {
    
        const subtotal = calculateSubtotal();
        const promoDiscount = appliedPromo ? appliedPromo.discountCents / 100 : 0;
        const giftCardDiscount = appliedGiftCard ? appliedGiftCard.applied : 0;
        return Math.max(0, subtotal - promoDiscount - giftCardDiscount);
    };

    const applyPromoCode = async () => {
        if (!promoCode) return;
        setApplyingPromo(true); setPromoError('');
        try {
            const listingId = cart[0]?.listing_id;
            const res = await axios.post('/api/shop/promotions/validate', { code: promoCode, listingId, cartTotal: Math.round(calculateSubtotal() * 100) });
            if (res.data.valid) { setAppliedPromo(res.data.promotion); setPromoCode(''); }
            else { setPromoError(res.data.error); }
        } catch (err) { setPromoError(err.response?.data?.error || 'Invalid code'); }
        finally { setApplyingPromo(false); }
    };

    const removePromo = () => {
     setAppliedPromo(null); };

    const applyGiftCard = async () => {
        if (!giftCardCode) return;
        setApplyingGiftCard(true); setGiftCardError('');
        try {
            const res = await axios.post('/api/shop/gift-cards/redeem', { code: giftCardCode, amount: calculateSubtotal() }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.valid) { setAppliedGiftCard(res.data); setGiftCardCode(''); }
            else { setGiftCardError(res.data.error); }
        } catch (err) { setGiftCardError(err.response?.data?.error || 'Invalid code'); }
        finally { setApplyingGiftCard(false); }
    };

    const removeGiftCard = () => {
     setAppliedGiftCard(null); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const total = calculateTotal();
            if (total === 0) {
                await axios.post('/api/shop/checkout', {
                    cartItems: cart.map(item => ({ listing_id: item.listing_id, quantity: item.quantity })),
                    shippingAddress: deliveryMethod === 'shipping' ? shippingAddress : null,
                    deliveryMethod, promotionId: appliedPromo?.id, giftCardId: appliedGiftCard?.id
                }, { headers: { Authorization: `Bearer ${token}` } });
                await fetchCart();
                alert('🎉 Order placed successfully!');
                navigate('/buyer/dashboard');
            } else {
                const orderRes = await axios.post('/api/shop/escrow/create-order', { amount: total, currency: 'USD' }, { headers: { Authorization: `Bearer ${token}` } });
                const approvalLink = orderRes.data.links?.find(link => link.rel === 'approve')?.href;
                if (approvalLink) {
                    sessionStorage.setItem('pendingCheckout', JSON.stringify({
                        cartItems: cart.map(item => ({ listing_id: item.listing_id, quantity: item.quantity })),
                        shippingAddress: deliveryMethod === 'shipping' ? shippingAddress : null,
                        deliveryMethod, promotionId: appliedPromo?.id, giftCardId: appliedGiftCard?.id
                    }));
                    window.location.href = approvalLink;
                }
            }
        } catch (err) { alert('Checkout failed: ' + (err.response?.data?.error || err.message)); }
        finally { setLoading(false); }
    };

    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    const allAllowPickup = cart.every(item => item.allow_local_pickup);

    return (
        <div className="checkout-page">
            <h1>Checkout</h1>
            <Link to="/cart" className="back-link">← Back to Cart</Link>
            <div className="checkout-container">
                <div className="checkout-form">
                    <div className="gift-card-section">
                        <h3>🎁 Gift Card</h3>
                        <div className="gift-card-input-group">
                            <input type="text" placeholder="Enter code" value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())} />
                            <button onClick={applyGiftCard} disabled={applyingGiftCard}>Apply</button>
                        </div>
                        {giftCardError && <p className="gift-card-error">{giftCardError}</p>}
                        {appliedGiftCard && (
                            <div className="applied-gift-card">
                                <span>✅ ${appliedGiftCard.applied.toFixed(2)} applied!</span>
                                <span>Remaining: ${appliedGiftCard.remaining.toFixed(2)}</span>
                                <button onClick={removeGiftCard}>✕</button>
                            </div>
                        )}
                    </div>

                    <div className="promo-section">
                        <h3>🎟️ Have a Promo Code?</h3>
                        <div className="promo-input-group">
                            <input type="text" placeholder="Enter code" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
                            <button onClick={applyPromoCode} disabled={applyingPromo}>Apply</button>
                        </div>
                        {promoError && <p className="promo-error">{promoError}</p>}
                        {appliedPromo && (
                            <div className="applied-promo">
                                <span>✅ {appliedPromo.code} applied!</span>
                                <span>-${(appliedPromo.discountCents / 100).toFixed(2)}</span>
                                <button onClick={removePromo}>✕</button>
                            </div>
                        )}
                    </div>

                    {allAllowPickup ? (
                        <div className="pickup-confirmation">
                            <h2>📍 Local Pickup Available</h2>
                            <p>This item can be picked up directly from the seller.</p>
                            <button onClick={handleSubmit} className="checkout-btn" disabled={loading}>
                                {loading ? 'Processing...' : total > 0 ? `Pay $${total.toFixed(2)}` : '🎁 Confirm Pickup'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2>Shipping Information</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group"><label>Full Name *</label><input type="text" value={shippingAddress.fullName} onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})} required /></div>
                                <div className="form-group"><label>Address Line 1 *</label><input type="text" value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress({...shippingAddress, addressLine1: e.target.value})} required /></div>
                                <div className="form-group"><label>Address Line 2</label><input type="text" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress({...shippingAddress, addressLine2: e.target.value})} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>City *</label><input type="text" value={shippingAddress.city} onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})} required /></div>
                                    <div className="form-group"><label>State *</label><input type="text" value={shippingAddress.state} onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})} required /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>ZIP Code *</label><input type="text" value={shippingAddress.zipCode} onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})} required /></div>
                                    <div className="form-group"><label>Country *</label><input type="text" value={shippingAddress.country} onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})} required /></div>
                                </div>
                                <div className="form-group"><label>Phone *</label><input type="tel" value={shippingAddress.phone} onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})} required /></div>
                                <button type="submit" className="checkout-btn" disabled={loading}>{loading ? 'Processing...' : total > 0 ? `Pay $${total.toFixed(2)}` : '🎁 Complete Free Order'}</button>
                            </form>
                        </>
                    )}
                </div>
                <div className="order-summary">
                    <h2>Order Summary</h2>
                    {cart.map(item => (
                        <div key={item.id} className="summary-item">
                            <img src={item.images?.[0] || '/shop-banner.png'} alt={item.title} />
                            <div><p>{item.title}</p><p>Qty: {item.quantity || 1}</p></div>
                            <p className="item-price">${((item.price_cents / 100) * (item.quantity || 1)).toFixed(2)}</p>
                        </div>
                    ))}
                    <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    {appliedPromo && <div className="summary-row discount"><span>Promo ({appliedPromo.code})</span><span>-${(appliedPromo.discountCents / 100).toFixed(2)}</span></div>}
                    {appliedGiftCard && <div className="summary-row discount"><span>Gift Card</span><span>-${appliedGiftCard.applied.toFixed(2)}</span></div>}
                    <div className="summary-total"><strong>Total</strong><strong>${total.toFixed(2)}</strong></div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
