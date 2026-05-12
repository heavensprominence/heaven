import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useShop } from '../contexts/ShopContext';
import SocialShare from '../components/SocialShare';
import SEO from '../components/SEO';
import './ListingDetail.css';

const ListingDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, toggleWishlist, isInWishlist } = useShop();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [bidAmount, setBidAmount] = useState('');
    const [bidQuantity, setBidQuantity] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isReverseAuction = listing?.type === 'reverse_auction';

    useEffect(() => { fetchListing(); }, [id]);

    const fetchListing = async () => {
        try {
            const lang = localStorage.getItem('i18nextLng') || 'en';
            const res = await axios.get(`/api/shop/listings/${id}?lang=${lang}`);
            setListing(res.data.listing);
        } catch (err) { console.error('Failed:', err); } finally { setLoading(false); }
    };

    const handleAddToCart = async () => {
        if (!token) { navigate('/login'); return; }
        if (listing.type === 'auction' || isReverseAuction) return;
        setSubmitting(true);
        try {
            if (listing.price_cents === 0) {
                await axios.post('/api/shop/listings/free-acquire', { listingId: listing.id }, { headers: { Authorization: `Bearer ${token}` } });
                alert('🎉 ' + t('listingDetail.itemAcquired')); navigate('/buyer/dashboard');
            } else { await addToCart(listing.id, 1); alert(t('listingDetail.addedToCart')); }
        } catch (err) { alert(err.response?.data?.error || 'Failed'); } finally { setSubmitting(false); }
    };

    const handlePlaceBid = async () => {
        if (!token) { navigate('/login'); return; }
        if (!bidAmount || parseFloat(bidAmount) <= 0) { alert('Enter valid amount'); return; }
        setSubmitting(true);
        try {
            const isDutch = listing.quantity_available > 1;
            const payload = { bid_cents: Math.round(parseFloat(bidAmount) * 100) };
            if (isDutch) payload.quantity = bidQuantity;
            await axios.post(`/api/shop/listings/${id}/bid`, payload, { headers: { Authorization: `Bearer ${token}` } });
            alert(isReverseAuction ? 'Proposal submitted!' : 'Bid placed!');
            fetchListing(); setBidAmount(''); setBidQuantity(1);
        } catch (err) { alert(err.response?.data?.error || 'Failed'); } finally { setSubmitting(false); }
    };

    const handleWishlist = async () => { if (!token) { navigate('/login'); return; } await toggleWishlist(listing.id); };
    const handleAskQuestion = async () => {
        if (!token) { navigate('/login'); return; }
        const message = prompt('What would you like to ask?');
        if (!message?.trim()) return;
        try {
            await axios.post('/api/shop/messages/conversations', { listingId: listing.id, sellerId: listing.seller_id, initialMessage: message }, { headers: { Authorization: `Bearer ${token}` } });
            alert('Message sent!'); navigate('/messages');
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    const getPrice = () => {
        if (!listing) return '';
        if (listing.type === 'auction') {
            if (listing.current_bid_cents) return `$${(listing.current_bid_cents / 100).toFixed(2)}`;
            if (listing.min_bid_cents) return `${t('listingDetail.startingBid')} $${(listing.min_bid_cents / 100).toFixed(2)}`;
            return t('listingDetail.noBids');
        }
        if (isReverseAuction) {
            if (listing.current_bid_cents) return `${t('listingDetail.bestProposal')}: $${(listing.current_bid_cents / 100).toFixed(2)}`;
            if (listing.max_bid_cents) return `${t('listingDetail.budget')}: $${(listing.max_bid_cents / 100).toFixed(2)}`;
            return t('listingDetail.noBids');
        }
        if (listing.price_cents === 0) return t('common.free');
        if (listing.price_cents) return `$${(listing.price_cents / 100).toFixed(2)}`;
        return 'Price TBD';
    };

    const isFree = listing?.price_cents === 0;
    const isWishlisted = listing ? isInWishlist(listing.id) : false;

    if (loading) return <div className="listing-loading">{t('common.loading')}</div>;
    if (!listing) return <div className="listing-not-found">{t('listingDetail.notFound')}</div>;

    return (
        <>
            <SEO title={listing.title} description={listing.description} image={listing.images?.[0]} type="product" price={listing.price_cents ? (listing.price_cents / 100) : (listing.min_bid_cents / 100)} availability={listing.quantity_available > 0 ? "in_stock" : "out_of_stock"} condition="New" brand={listing.store_name} sku={listing.id} />
            <div className="listing-detail-page">
                <div className="listing-breadcrumb"><Link to="/">{t('nav.shop')}</Link> › {listing.title}</div>
                <div className="listing-detail-container">
                    <div className="listing-gallery">
                        <div className="main-image"><img src={listing.images?.[selectedImage] || '/shop-banner.png'} alt={listing.title} /></div>
                        {listing.images?.length > 1 && (
                            <div className="thumbnail-list">{listing.images.map((img, idx) => (
                                <button key={idx} className={`thumbnail ${selectedImage === idx ? 'active' : ''}`} onClick={() => setSelectedImage(idx)}><img src={img} alt="" /></button>
                            ))}</div>
                        )}
                    </div>
                    <div className="listing-info-section">
                        <div className="listing-header"><h1>{listing.title}</h1><div className="listing-meta"><span className={`type-badge ${listing.type}`}>{isReverseAuction ? t('listingDetail.typeReverse') : listing.type}</span></div></div>
                        <div className="listing-price-large">{getPrice()}</div>
                        <div className="listing-description-full"><h3>{t('listingDetail.description')}</h3><p>{listing.description || t('listingDetail.noDescription')}</p></div>
                        <div className="seller-info-card"><h3>{isReverseAuction ? t('listingDetail.buyer') : t('listingDetail.seller')}</h3><p>{listing.seller_name || listing.seller_email}</p></div>
                        <SocialShare listing={listing} storeName={listing.store_name} />
                        <div className="listing-actions">
                            <button className={`wishlist-btn-large ${isWishlisted ? 'active' : ''}`} onClick={handleWishlist}>{isWishlisted ? t('listingDetail.saved') : t('listingDetail.wishlist')}</button>
                            <button className="ask-question-btn" onClick={handleAskQuestion}>💬 {t('listingDetail.askQuestion')}</button>
                            {(listing.type === 'auction' || isReverseAuction) ? (
                                <div className="auction-section">
                                    <div className="current-bid">{getPrice()}</div>
                                    <div className="bid-input-group">
                                        <input type="number" min="0.01" step="0.01" placeholder={isReverseAuction ? t('listingDetail.yourPrice') : t('listingDetail.yourBid')} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                                        <button className="bid-btn" onClick={handlePlaceBid} disabled={submitting}>{submitting ? t('listingDetail.placing') : t('listingDetail.submitBid')}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="purchase-section">
                                    <button className="add-to-cart-btn-large" onClick={handleAddToCart} disabled={submitting}>{isFree ? '🎁 ' + t('listingDetail.getFree') : '🛒 ' + t('listingDetail.addToCart')}</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default ListingDetail;
