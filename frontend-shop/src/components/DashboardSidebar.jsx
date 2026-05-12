import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './DashboardSidebar.css';

const DashboardSidebar = ({ type }) => {
    const { t } = useTranslation();
    const location = useLocation();
    
    const sellerLinks = [
        { path: '/seller/dashboard', label: t('nav.sellerDashboard') },
        { path: '/create', label: t('nav.postAListing') },
        { path: '/seller/offers', label: t('nav.sellerOffers') },
        { path: '/seller/orders', label: t('nav.sellerOrders') },
        { path: '/seller/analytics', label: t('nav.sellerAnalytics') },
        { path: '/seller/promotions', label: t('nav.sellerPromotions') },
        { path: '/seller/bulk-import', label: t('nav.bulkImport') },
        { path: '/seller/settings', label: t('nav.storeSettings') },
        { path: '/seller/customization', label: t('nav.storeCustomization') },
    ];
    
    const buyerLinks = [
        { path: '/buyer/dashboard', label: t('buyer.dashboard') },
        { path: '/buyer/purchases', label: t('nav.myPurchases') },
        { path: '/wishlist', label: t('nav.wishlist') },
        { path: '/messages', label: t('nav.messages') },
        { path: '/buyer/following', label: t('nav.following') },
    ];
    
    const links = type === 'seller' ? sellerLinks : buyerLinks;

    return (
        <div className="dashboard-sidebar">
            <div className="sidebar-header">
                <h3>{type === 'seller' ? t('nav.sellerDashboard') : t('nav.buyerDashboard')}</h3>
            </div>
            <nav className="sidebar-nav">
                {links.map(link => (
                    <Link key={link.path} to={link.path}
                        className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}>
                        {link.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
};
export default DashboardSidebar;
