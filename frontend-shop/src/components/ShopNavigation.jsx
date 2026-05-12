import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../contexts/ShopContext';
import LanguageSwitcher from './LanguageSwitcher';
import axios from 'axios';
import './ShopNavigation.css';

const ShopNavigation = ({ token, user }) => {
    const { t } = useTranslation();
    const { cartCount } = useShop();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        if (token) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get('/api/shop/messages/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadMessages(res.data.unreadCount || 0);
        } catch (err) {
            // Silently fail
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/shop';
    };

    return (
        <nav className="shop-nav">
            <div className="shop-nav-container">
                <Link to="/" className="nav-logo">🛍️ HeavensLive Shop</Link>
                <LanguageSwitcher />
                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
                <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
                    <Link to="/" className="nav-link">🏠 {t('nav.home')}</Link>
                    {token ? (
                        <>
                            <Link to="/create" className="nav-link highlight">📝 {t('nav.postAListing')}</Link>
                            <Link to="/seller/dashboard" className="nav-link">📋 {t('nav.sellerDashboard')}</Link>
                            <Link to="/buyer/dashboard" className="nav-link">🛒 {t('nav.buyerDashboard')}</Link>
                            <Link to="/cart" className="nav-link">
                                🛒 {t('nav.cart')} {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </Link>
                            <Link to="/messages" className="nav-link">
                                💬 {t('nav.messages')} {unreadMessages > 0 && <span className="message-badge">{unreadMessages}</span>}
                            </Link>
                            <Link to="/saved-searches" className="nav-link">🔍 {t('nav.savedSearches')}</Link>
                            <Link to="/gift-cards" className="nav-link">🎁 {t('nav.giftCards')}</Link>
                            <Link to="/wishlist" className="nav-link">❤️ {t('nav.wishlist')}</Link>
                            <div className="nav-user-menu">
                                <span className="user-email">{user?.email?.split('@')[0] || 'User'}</span>
                                <div className="dropdown-menu">
                                    <Link to="/profile">👤 {t('nav.profile')}</Link>
                                    <Link to="/affiliate">🤝 {t('nav.affiliate')}</Link>
                                    <Link to="/settings">⚙️ {t('nav.settings')}</Link>
                                    {user?.isSuperAdmin && <Link to="/admin">👑 {t('nav.admin')}</Link>}
                                    <button onClick={handleLogout} className="logout-btn">🚪 {t('nav.logout')}</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">🔐 {t('nav.login')}</Link>
                            <Link to="/register" className="nav-link highlight">📝 {t('nav.register')}</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default ShopNavigation;
