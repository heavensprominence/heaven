import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../contexts/ShopContext';
import './Cart.css';

const Cart = () => {
    const { t } = useTranslation();
    const { cart, removeFromCart, cartCount } = useShop();
    const token = localStorage.getItem('token');

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price_cents / 100) * item.quantity, 0);
    };

    if (!token) {
        return <div className="cart-page"><h2>{t('cart.loginRequired')}</h2></div>;
    }

    if (cart.length === 0) {
        return (
            <div className="cart-page empty">
                <h2>{t('cart.empty')}</h2>
                <Link to="/" className="continue-shopping">{t('cart.continueShopping')}</Link>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <h1>{t('cart.title')} ({cartCount} {t('cart.items')})</h1>
                <Link to="/" className="back-link">← {t('cart.continueShopping')}</Link>
            <div className="cart-container">
                <div className="cart-items">
                    {cart.map(item => (
                        <div key={item.id} className="cart-item">
                            <img src={item.images?.[0] || '/shop/shop-banner.png'} alt={item.title} />
                            <div className="item-details">
                                <h3>{item.title}</h3>
                                <p>${(item.price_cents / 100).toFixed(2)} {t('cart.each')}</p>
                                <p>{t('common.quantity')}: {item.quantity}</p>
                            </div>
                            <div className="item-actions">
                                <p className="item-total">${((item.price_cents / 100) * item.quantity).toFixed(2)}</p>
                                <button onClick={() => removeFromCart(item.id)} className="remove-btn">{t('cart.remove')}</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="cart-summary">
                    <h2>{t('cart.orderSummary')}</h2>
                    <div className="summary-row">
                        <span>{t('cart.subtotal')}</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                        <strong>{t('common.total')}</strong>
                        <strong>${calculateTotal().toFixed(2)}</strong>
                    </div>
                    <Link to="/checkout" className="checkout-btn">
                        {t('cart.checkout')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;
