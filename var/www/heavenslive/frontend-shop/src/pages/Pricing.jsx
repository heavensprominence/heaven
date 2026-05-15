import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Pricing.css';

const Pricing = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [plans, setPlans] = useState([]);
    const [myPlan, setMyPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        fetchPlans();
        if (token) fetchMyPlan();
    }, [token]);

    const fetchPlans = async () => {
        try {
            const res = await axios.get('/api/shop/subscriptions/plans');
            setPlans(res.data.plans || []);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyPlan = async () => {
        try {
            const res = await axios.get('/api/shop/subscriptions/my-plan', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyPlan(res.data);
        } catch (err) {}
    };

    const handleSubscribe = async (planId, planSlug, price) => {
        if (!token) {
            navigate("/login");
            return;
        }
        
        if (planSlug === "enterprise") {
            navigate("/contact");
            return;
        }
        
        if (planSlug === "free") {
            try {
                await axios.post("/api/shop/subscriptions/subscribe", { planId, billingCycle }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert(t('pricing.freeActivated'));
                fetchMyPlan();
            } catch (err) {
                alert("Failed: " + (err.response?.data?.error || err.message));
            }
        } else {
            const paypalUrl = `https://www.paypal.com/webscr?cmd=_xclick-subscriptions&business=bmirkalami@gmail.com&item_name=${planSlug}%20Plan&a3=${price/100}&p3=1&t3=M&src=1&sra=1&no_note=1&return=https://shop.heavenslive.com/settings&cancel_return=https://shop.heavenslive.com/pricing`;
            window.location.href = paypalUrl;
        }
    };

    const getPrice = (plan) => {
        if (plan.price_monthly_cents === 0) return t('common.free');
        const price = billingCycle === 'monthly' ? plan.price_monthly_cents : plan.price_yearly_cents;
        return `$${(price / 100).toFixed(2)}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`;
    };

    const features = [
        { key: 'max_listings', label: t('pricing.features.maxListings'), format: (v) => v === -1 ? t('common.unlimited') : v },
        { key: 'max_images', label: t('pricing.features.maxImages'), format: (v) => v },
        { key: 'bulk_import', label: t('pricing.features.bulkImport'), format: (v) => v ? '✅' : '❌' },
        { key: 'promotions', label: t('pricing.features.promotions'), format: (v) => v ? '✅' : '❌' },
        { key: 'customization', label: t('pricing.features.customization'), format: (v) => v ? '✅' : '❌' },
        { key: 'analytics', label: t('pricing.features.analytics'), format: (v) => v ? '✅' : '❌' },
        { key: 'featured_listings', label: t('pricing.features.featuredListings'), format: (v) => v === -1 ? t('common.unlimited') : v },
        { key: 'priority_support', label: t('pricing.features.prioritySupport'), format: (v) => v ? '✅' : '❌' },
    ];

    if (loading) return <div className="loading">{t('common.loading')}</div>;

    return (
        <div className="pricing-page">
            <h1>{t('pricing.title')}</h1>
            <Link to="/" className="back-link">{t('pricing.backToShop')}</Link>
            <p className="subtitle">{t('pricing.subtitle')}</p>
            
            <div className="billing-toggle">
                <button className={billingCycle === 'monthly' ? 'active' : ''} onClick={() => setBillingCycle('monthly')}>
                    {t('pricing.monthly')}
                </button>
                <button className={billingCycle === 'yearly' ? 'active' : ''} onClick={() => setBillingCycle('yearly')}>
                    {t('pricing.yearly')} <span className="save-badge">{t('pricing.savePercent')}</span>
                </button>
            </div>
            
            {myPlan && (
                <div className="current-plan-banner">
                    🎯 {t('pricing.currentPlan')} <strong>{myPlan.planName}</strong> {t('pricing.plan')}
                    ({myPlan.usage.currentListings}/{myPlan.limits.maxListings === -1 ? '∞' : myPlan.limits.maxListings} {t('pricing.listingsUsed')})
                </div>
            )}
            
            <div className="plans-grid">
                {plans.map(plan => {
                    const isCurrentPlan = myPlan?.planId === plan.id;
                    const features_obj = plan.features || {};
                    
                    return (
                        <div key={plan.id} className={`plan-card ${plan.slug} ${isCurrentPlan ? 'current' : ''}`}>
                            {plan.slug === 'pro' && <div className="popular-badge">{t('pricing.mostPopular')}</div>}
                            <h2>{plan.name}</h2>
                            <p className="plan-description">{plan.description}</p>
                            <div className="plan-price">
                                <span className="price">{getPrice(plan)}</span>
                                {plan.price_monthly_cents > 0 && billingCycle === 'yearly' && (
                                    <span className="yearly-savings">
                                        Save ${((plan.price_monthly_cents * 12 - plan.price_yearly_cents) / 100).toFixed(2)}/yr
                                    </span>
                                )}
                            </div>
                            <div className="plan-fee">
                                {t('pricing.platformFee')}: <strong>{plan.platform_fee_percent}%</strong>
                            </div>
                            <ul className="feature-list">
                                {features.map(f => (
                                    <li key={f.key} className={features_obj[f.key] ? 'included' : 'not-included'}>
                                        <span className="feature-icon">{features_obj[f.key] ? '✅' : '❌'}</span>
                                        <span className="feature-label">{f.label}:</span>
                                        <span className="feature-value">{f.format(features_obj[f.key] || 0)}</span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                className={`subscribe-btn ${plan.slug}`}
                                onClick={() => plan.slug === "enterprise" ? navigate("/contact") : handleSubscribe(plan.id, plan.slug, plan.price_monthly_cents)}
                                disabled={isCurrentPlan}
                            >
                                {isCurrentPlan ? t('pricing.currentPlanBtn') : plan.slug === 'enterprise' ? t('pricing.contactUs') : t('pricing.subscribe')}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div className="pricing-footer">
                <h3>{t('pricing.allPlansInclude')}:</h3>
                <div className="included-features">
                    <span>{t('pricing.escrow')}</span>
                    <span>{t('pricing.salesHistory')}</span>
                    <span>{t('pricing.messaging')}</span>
                    <span>{t('pricing.ratings')}</span>
                    <span>{t('pricing.shipping')}</span>
                    <span>{t('pricing.giftCards')}</span>
                </div>
                <p className="guarantee">{t('pricing.guarantee')}</p>
            </div>
        </div>
    );
};

export default Pricing;
