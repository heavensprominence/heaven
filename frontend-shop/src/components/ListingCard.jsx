import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../contexts/ShopContext';
import axios from 'axios';
import './ListingCard.css';

const ListingCard = ({ listing }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { toggleWishlist, isInWishlist, addToCart } = useShop();
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const isOwnListing = user && listing.seller_id === user.id;
    const hasPromotion = listing.promotion;

    const typeBadges = useMemo(() => ({
        'mall': { label: t('listingDetail.typeMall') },
        'classifieds': { label: t('listingDetail.typeClassifieds') },
        'auction': { label: t('listingDetail.typeAuction') },
        'reverse_auction': { label: t('listingDetail.typeReverse') }
    }), [t, i18n.language]);
    const badge = typeBadges[listing.type] || { label: listing.type };

    const handleWishlist = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!token) { navigate('/login'); return; }
        setWishlistLoading(true);
        await toggleWishlist(listing.id);
        setWishlistLoading(false);
    };

    const getPrice = () => {
        if (listing.type === 'auction') {
            if (listing.current_bid_cents) return `$${(listing.current_bid_cents / 100).toFixed(2)}`;
            if (listing.min_bid_cents) return `${t('listingDetail.startingBid')} $${(listing.min_bid_cents / 100).toFixed(2)}`;
            return t('listingDetail.noBids');
        }
        if (listing.type === 'reverse_auction') {
            if (listing.current_bid_cents) return `${t('listingDetail.bestProposal')}: $${(listing.current_bid_cents / 100).toFixed(2)}`;
            if (listing.max_bid_cents) return `${t('listingDetail.budget')}: $${(listing.max_bid_cents / 100).toFixed(2)}`;
            return t('listingDetail.noBids');
        }
        if (listing.price_cents === 0) return t('common.free');
        if (listing.price_cents) return `$${(listing.price_cents / 100).toFixed(2)}`;
        return 'Price TBD';
    };

    const isFree = listing.price_cents === 0;
    const isReverseAuction = listing.type === 'reverse_auction';

    const handleAddToCart = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!token) { navigate('/login'); return; }
        if (isOwnListing) { alert('This is your own listing.'); return; }
        if (listing.type === 'auction' || isReverseAuction) { navigate(`/listing/${listing.id}`); return; }
        setCartLoading(true);
        try {
            if (isFree) {
                await axios.post('/api/shop/listings/free-acquire', { listingId: listing.id }, { headers: { Authorization: `Bearer ${token}` } });
                alert(t('listingDetail.itemAcquired'));
                navigate('/buyer/dashboard');
            } else {
                const result = await addToCart(listing.id, 1);
                if (!result.success) alert(result.error || 'Failed to add');
            }
        } catch (err) { alert(err.response?.data?.error || 'Failed'); }
        finally { setCartLoading(false); }
    };

    const isWishlisted = isInWishlist(listing.id);

    const handleCardClick = (e) => {
        if (e.target.closest('button')) return;
        navigate(`/listing/${listing.id}`);
    };

    return (
        <div className="listing-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <div className="listing-image">
                <img src={listing.images?.[0] || '/shop-banner.png'} alt={listing.title} loading="lazy" />
                <span className={`listing-type-badge ${badge.class || ''}`}>{badge.label}</span>
                <button className={`wishlist-btn ${isWishlisted ? 'active' : ''}`} onClick={handleWishlist} disabled={wishlistLoading}>
                    {isWishlisted ? '❤️' : '🤍'}
                </button>
                {isFree && !isReverseAuction && <div className="free-badge">{t('listingDetail.getFree')}</div>}
                {isOwnListing && <div className="own-listing-badge">{t('listingDetail.yourListing')}</div>}
                {hasPromotion && <div className="promotion-badge">{listing.promotion.value_percent}% OFF</div>}
            </div>
            <div className="listing-info">
                <h3 className="listing-title">{listing.title}</h3>
                <div className="listing-price">{getPrice()}</div>
                <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={cartLoading}>
                    {cartLoading ? t('common.processing') : 
                     listing.type === 'auction' ? '🔨 ' + t('listingDetail.bid') :
                     isReverseAuction ? '📋 ' + t('listingDetail.submitBid') :
                     isFree ? t('listingDetail.getFree') : t('listingDetail.addToCart')}
                </button>
            </div>
        </div>
    );
};
export default ListingCard;
