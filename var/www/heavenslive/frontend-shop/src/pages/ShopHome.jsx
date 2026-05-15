import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useShop } from '../contexts/ShopContext';
import ListingCard from '../components/ListingCard';
import SearchFilters from '../components/SearchFilters';
import CategorySuggest from '../components/CategorySuggest';
import ShopNavigation from '../components/ShopNavigation';
import ShopFooter from '../components/ShopFooter';
import './ShopHome.css';

const ShopHome = () => {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { categories } = useShop();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [userLocation, setUserLocation] = useState(null);
    const [showSuggest, setShowSuggest] = useState(false);
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const localOnly = searchParams.get('local') === 'true';

    const filters = useMemo(() => ({
        q: searchParams.get('q') || '',
        type: searchParams.get('type') || '',
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sort: searchParams.get('sort') || 'newest',
        page: parseInt(searchParams.get('page')) || 1,
    }), [searchParams]);

    useEffect(() => {
        if (navigator.geolocation && !userLocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => {}
            );
        }
    }, [userLocation]);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.q) params.append('q', filters.q);
            if (filters.type) params.append('type', filters.type);
            if (filters.category) params.append('category', filters.category);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.sort) params.append('sort', filters.sort);
            params.append('page', String(filters.page));
            params.append('limit', '12');
            if (localOnly && userLocation) {
                params.append('lat', String(userLocation.lat));
                params.append('lng', String(userLocation.lng));
                params.append('radius', '50');
            }
            const res = await axios.get(`/api/shop/listings?${params.toString()}`);
            setListings(res.data.listings || []);
            setPagination({ page: res.data.pagination?.page || 1, totalPages: res.data.pagination?.totalPages || 1, total: res.data.pagination?.total || 0 });
        } catch (err) { console.error('Failed to fetch listings:', err); }
        finally { setLoading(false); }
    }, [filters, localOnly, userLocation]);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    const updateFilters = (newFilters) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(newFilters).forEach(([key, value]) => { if (value) params.set(key, value); else params.delete(key); });
        if (!newFilters.hasOwnProperty('page')) params.set('page', '1');
        setSearchParams(params);
    };
    const handlePageChange = (newPage) => { const params = new URLSearchParams(searchParams); params.set('page', newPage); setSearchParams(params); };
    const toggleLocalOnly = () => { const params = new URLSearchParams(searchParams); if (!localOnly) params.set('local', 'true'); else params.delete('local'); params.set('page', '1'); setSearchParams(params); };

    // Memoize so it updates when language changes
    const typeLabels = useMemo(() => ({
        '': t('shopHome.allTypes'),
        'mall': t('shopHome.typeMall'),
        'classifieds': t('shopHome.typeClassifieds'),
        'auction': t('shopHome.typeAuction'),
        'reverse_auction': t('shopHome.typeReverse')
    }), [t, i18n.language]);

    const logoPath = window.location.hostname === 'shop.heavenslive.com' ? '/shop-banner.png' : '/shop/shop-banner.png';

    return (
        <>
            <ShopNavigation token={token} user={user} />
            <div className="shop-home">
                <div className="search-hero">
                    <Link to="/" className="hero-logo-link"><img src={logoPath} alt="HeavensLive Shop" className="hero-logo-img" /></Link>
                    <h1>{t('shopHome.heroTitle')}</h1>
                    <p>{t('shopHome.heroSubtitle')}</p>
                    <div className="hero-search-bar">
                        <input type="text" placeholder={t('shopHome.searchPlaceholder')} defaultValue={filters.q} className="hero-search-input" id="search-input" onKeyPress={(e) => e.key === 'Enter' && updateFilters({ q: e.target.value })} />
                        <button className="hero-search-btn" onClick={() => { const input = document.getElementById('search-input'); updateFilters({ q: input.value }); }}>{t('shopHome.searchBtn')}</button>
                    </div>
                    <div className="local-toggle"><label className="checkbox-label"><input type="checkbox" checked={localOnly} onChange={toggleLocalOnly} /><span>{t('shopHome.searchLocally')}</span></label></div>
                </div>
                <div className="shop-content">
                    <aside className="shop-sidebar"><SearchFilters filters={filters} categories={categories} onFilterChange={updateFilters} token={token} /></aside>
                    <main className="shop-main">
                        <div className="results-header">
                            <div className="results-count">{pagination.total} {t('shopHome.resultsFound')}{filters.q && ` ${t('shopHome.for')} "${filters.q}"`}</div>
                            <div className="results-sort">
                                <label>{t('shopHome.sortBy')}</label>
                                <select value={filters.sort} onChange={(e) => updateFilters({ sort: e.target.value })}>
                                    <option value="newest">{t('shopHome.sortNewest')}</option>
                                    <option value="price_low">{t('shopHome.sortPriceLow')}</option>
                                    <option value="price_high">{t('shopHome.sortPriceHigh')}</option>
                                    <option value="ending_soon">{t('shopHome.sortEndingSoon')}</option>
                                    <option value="popular">{t('shopHome.sortPopular')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="type-filters">
                            {Object.entries(typeLabels).map(([value, label]) => (<button key={value} className={`type-pill ${filters.type === value ? 'active' : ''}`} onClick={() => updateFilters({ type: value })}>{label}</button>))}
                        </div>
                        {filters.category && filters.category !== 'other' && (
                            <div className="suggest-category-container">
                                <button className="suggest-category-btn" onClick={() => setShowSuggest(!showSuggest)}>{t('shopHome.suggestSubcategory')} "{filters.category}"</button>
                                {showSuggest && <CategorySuggest currentCategory={filters.category} onClose={() => setShowSuggest(false)} />}
                            </div>
                        )}
                        {loading ? (
                            <div className="loading-grid">{[...Array(6)].map((_, i) => <div key={i} className="listing-skeleton"></div>)}</div>
                        ) : listings.length === 0 ? (
                            <div className="empty-state"><div className="empty-icon">🔍</div><h3>{t('shopHome.noListingsFound')}</h3></div>
                        ) : (
                            <>
                                <div className="listings-grid">{listings.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div>
                                {pagination.totalPages > 0 && (
                                    <div className="pagination">
                                        <button disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)}>←</button>
                                        <span>{pagination.page} / {pagination.totalPages}</span>
                                        <button disabled={pagination.page === pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}>→</button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
            <ShopFooter />
        </>
    );
};
export default ShopHome;
