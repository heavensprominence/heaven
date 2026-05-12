import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export function useTranslatedListing(listing) {
    const { i18n } = useTranslation();
    const [translatedListing, setTranslatedListing] = useState(listing);
    const [isTranslated, setIsTranslated] = useState(false);
    const [translating, setTranslating] = useState(false);
    
    const currentLang = i18n.language?.split('-')[0] || 'en';
    
    useEffect(() => {
        if (!listing || !listing.id) return;
        
        // If language is English, use original
        if (currentLang === 'en') {
            setTranslatedListing(listing);
            setIsTranslated(false);
            return;
        }
        
        // Try to get translation from API
        const fetchTranslation = async () => {
            setTranslating(true);
            try {
                const res = await axios.get(
                    `/api/shop/translations/listing/${listing.id}?lang=${currentLang}`
                );
                
                const translations = res.data.translations || [];
                if (translations.length > 0) {
                    const t = translations[0];
                    setTranslatedListing({
                        ...listing,
                        title: t.title || listing.title,
                        description: t.description || listing.description
                    });
                    setIsTranslated(true);
                } else {
                    setTranslatedListing(listing);
                    setIsTranslated(false);
                }
            } catch (err) {
                console.error('Translation fetch error:', err);
                setTranslatedListing(listing);
            } finally {
                setTranslating(false);
            }
        };
        
        fetchTranslation();
    }, [listing?.id, currentLang]);
    
    return { translatedListing, isTranslated, translating };
}
