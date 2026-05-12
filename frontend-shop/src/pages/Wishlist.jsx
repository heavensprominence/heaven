import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../contexts/ShopContext';
import './Wishlist.css';

const Wishlist = () => {
    const { t } = useTranslation();
    const { wishlist, fetchWishlist, toggleWishlist } = useShop();
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) { fetchWishlist().finally(() => setLoading(false)); }
        else { setLoading(false); }
    }, [token]);

    if (!token) return <div className="wishlist-page"><h2>{t('wishlist.loginRequired')}</h2><Link to="/login">{t('wishlist.gotoLogin')}</Link></div>;
    if (loading) return <div className="wishlist-page">{t('common.loading')}</div>;

    return (
        <div className="wishlist-page">
            <h1>{t('wishlist.title')}</h1>
            <Link to="/" className="back-link">{t('wishlist.backToShop')}</Link>
            {wishlist.length === 0 ? (
                <div className="empty-wishlist"><p>{t('wishlist.empty')}</p><Link to="/">{t('wishlist.browseListings')}</Link></div>
            ) : (
                <div className="wishlist-grid">
                    {wishlist.map(item => (
                        <div key={item.id} className="wishlist-card">
                            <Link to={`/listing/${item.listing_id}`}><img src={item.images?.[0] || '/shop-banner.png'} alt={item.title} /></Link>
                            <div className="wishlist-info">
                                <Link to={`/listing/${item.listing_id}`}><h3>{item.title}</h3></Link>
                                <p className="wishlist-price">{item.price_cents === 0 ? t('common.free') : `$${(item.price_cents / 100).toFixed(2)}`}</p>
                                <button className="remove-btn" onClick={() => toggleWishlist(item.listing_id)}>{t('wishlist.remove')}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default Wishlist;
