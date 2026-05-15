import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ListingCard from '../components/ListingCard';
import SEO from '../components/SEO';
import './StorePage.css';

const StorePage = () => {
    const { t } = useTranslation();
    const { slug } = useParams();
    const [store, setStore] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStore(); }, [slug]);

    const fetchStore = async () => {
        try {
            const res = await axios.get(`/api/shop/stores/${slug}`);
            setStore(res.data.store);
            setListings(res.data.listings || []);
        } catch (err) { console.error('Failed:', err); } finally { setLoading(false); }
    };

    if (loading) return <div className="store-loading">{t('store.loading')}</div>;
    if (!store) return <div className="store-not-found">{t('store.notFound')}</div>;

    const storeTheme = {
        '--primary-color': store.theme_color || '#0b1f3f',
        '--secondary-color': store.secondary_color || '#ffd700',
        '--text-color': store.text_color || '#f5f5f5',
        '--font-family': store.font_family || 'Arial, sans-serif'
    };

    return (
        <>
            <SEO title={store.store_name} description={store.description || `Shop ${store.store_name} on HeavensLive`} image={store.logo_url || store.banner_url} type="website" />
            <div className="store-page" style={storeTheme}>
                <div className="store-header">
                    {store.banner_url && <img src={store.banner_url} alt="Store banner" className="store-banner" />}
                    <div className="store-info">
                        {store.logo_url && <img src={store.logo_url} alt="Store logo" className="store-logo" />}
                        <div>
                            <h1 style={{ color: 'var(--secondary-color)' }}>{store.store_name}</h1>
                            <p className="store-description">{store.description}</p>
                            {store.show_seller_info !== false && (
                                <div className="store-stats">
                                    <span>⭐ {store.rating || 'New'} ({store.review_count || 0} {t('store.reviews')})</span>
                                    <span>📦 {store.orders || 0} {t('store.sales')}</span>
                                    <span>👁️ {store.views || 0} {t('store.views')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="store-content">
                    <h2 style={{ color: 'var(--secondary-color)' }}>{t('store.listings')} ({listings.length})</h2>
                    {listings.length === 0 ? (
                        <p className="no-listings">{t('store.noListings')}</p>
                    ) : (
                        <div className={`listings-${store.layout_style || 'grid'}`}>
                            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
export default StorePage;
