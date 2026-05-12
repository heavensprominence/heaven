import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SocialShare.css';

const SocialShare = ({ listing, storeName }) => {
    const { t } = useTranslation();
    const [showCopied, setShowCopied] = useState(false);
    
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/listing/${listing.id}` : '';
    const shareTitle = listing.title;
    const shareDescription = listing.description?.substring(0, 100) || 'Check out this listing on HeavensLive Shop!';
    const shareImage = listing.images?.[0] || '/shop-banner.png';
    const fullImageUrl = shareImage.startsWith('http') ? shareImage : `https://heavenslive.com${shareImage}`;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedDescription = encodeURIComponent(shareDescription);
    const encodedImage = encodeURIComponent(fullImageUrl);

    const socialLinks = [
        { name: 'Facebook', icon: '📘', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: '#1877f2' },
        { name: 'X (Twitter)', icon: '🐦', url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, color: '#000000' },
        { name: 'WhatsApp', icon: '📱', url: `https://api.whatsapp.com/send?text=${encodedTitle}%20-%20${encodedUrl}`, color: '#25d366' },
        { name: 'Telegram', icon: '✈️', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, color: '#26a5e4' },
        { name: 'Pinterest', icon: '📌', url: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`, color: '#e60023' },
        { name: 'LinkedIn', icon: '💼', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, color: '#0a66c2' },
        { name: 'Reddit', icon: '👽', url: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`, color: '#ff4500' },
        { name: 'Email', icon: '📧', url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`, color: '#888' }
    ];

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    return (
        <div className="social-share">
            <h4>📢 {t('socialShare.title')}</h4>
            <div className="share-buttons">
                {socialLinks.map(social => (
                    <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ backgroundColor: social.color }} title={social.name}>
                        <span className="share-icon">{social.icon}</span>
                        <span className="share-label">{social.name}</span>
                    </a>
                ))}
            </div>
            <div className="copy-link-section">
                <input type="text" value={shareUrl} readOnly className="share-url-input" />
                <button onClick={copyToClipboard} className="copy-btn">
                    {showCopied ? t('socialShare.copied') : t('socialShare.copyLink')}
                </button>
            </div>
            <p className="share-hint">{t('socialShare.shareHint')}</p>
        </div>
    );
};
export default SocialShare;
