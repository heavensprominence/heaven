import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ShopFooter.css';

const ShopFooter = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => { if (token) { fetchUnreadCount(); } }, [token]);

    const fetchUnreadCount = async () => {
        try { const res = await axios.get('/api/shop/messages/unread-count', { headers: { Authorization: `Bearer ${token}` } }); setUnreadMessages(res.data.unreadCount || 0); }
        catch (err) { console.error('Failed to fetch unread count:', err); }
    };

    return (
        <footer className="shop-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h4>🛍️ HeavensLive Shop</h4>
                    <p>{t('footer.divinelyInspired')}</p>
                </div>
                <div className="footer-section">
                    <h4>{t('footer.quickLinks')}</h4>
                    <Link to="/">{t('nav.home')}</Link>
                    <Link to="/create">{t('nav.postAListing')}</Link>
                    <Link to="/seller/dashboard">📋 {t('nav.sellerDashboard')}</Link>
                    <Link to="/buyer/dashboard">🛒 {t('nav.buyerDashboard')}</Link>
                    <Link to="/cart">{t('nav.cart')}</Link>
                    <Link to="/messages">💬 {t('nav.messages')} {unreadMessages > 0 && <span className="footer-badge">{unreadMessages}</span>}</Link>
                </div>
                <div className="footer-section">
                    <h4>{t('footer.support')}</h4>
                    <Link to="/help">{t('nav.help')}</Link>
                    <Link to="/contact">{t('nav.contact')}</Link>
                    <Link to="/gift-cards">🎁 {t('nav.giftCards')}</Link>
                    <Link to="/pricing">💰 {t('nav.pricing')}</Link>
                    <Link to="/affiliate">🤝 {t('nav.affiliate')}</Link>
                    <Link to="/disputes">⚖️ {t('nav.disputes')}</Link>
                    <a href="/shop/terms" target="_blank" rel="noopener noreferrer">{t('footer.termsOfService')}</a>
                    <a href="/shop/privacy" target="_blank" rel="noopener noreferrer">{t('footer.privacyPolicy')}</a>
                </div>
                <div className="footer-section">
                    <h4>{t('footer.followUs')}</h4>
                    <div className="social-links">
                        <a href="#" target="_blank" rel="noopener noreferrer">📘 Facebook</a>
                        <a href="#" target="_blank" rel="noopener noreferrer">📷 Instagram</a>
                        <a href="#" target="_blank" rel="noopener noreferrer">🐦 Twitter</a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>{t('footer.allRightsReserved')}</p>
            </div>
        </footer>
    );
};
export default ShopFooter;
