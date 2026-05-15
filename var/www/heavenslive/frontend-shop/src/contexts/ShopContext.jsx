import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const ShopContext = createContext();
const API_URL = '/api/shop';

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [wishlist, setWishlist] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const handleStorageChange = () => {
            const newToken = localStorage.getItem('token');
            setToken(newToken);
            if (newToken) { fetchCart(); fetchWishlist(); }
            else { setCart([]); setCartCount(0); setWishlist([]); }
        };
        window.addEventListener('storage', handleStorageChange);
        handleStorageChange();
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => { fetchCategories(); }, []);
    
    // Re-fetch categories when language changes
    useEffect(() => {
        const handleLangChange = () => fetchCategories();
        window.addEventListener('languageChanged', handleLangChange);
        return () => window.removeEventListener('languageChanged', handleLangChange);
    }, []);

    const fetchCategories = async () => {
        try {
            const lang = localStorage.getItem('i18nextLng') || 'en';
            const res = await axios.get(`${API_URL}/categories?lang=${lang}`);
            setCategories(res.data.categories || []);
        } catch (err) { console.error('Failed to fetch categories:', err); }
        finally { setLoading(false); }
    };

    const fetchCart = useCallback(async () => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) { setCart([]); setCartCount(0); return; }
        try {
            const res = await axios.get(`${API_URL}/cart`, { headers: { Authorization: `Bearer ${currentToken}` } });
            const cartData = res.data.cart || [];
            setCart(cartData);
            setCartCount(cartData.reduce((sum, item) => sum + (item.quantity || 1), 0));
        } catch (err) { console.error('Failed to fetch cart:', err); }
    }, []);

    const fetchWishlist = useCallback(async () => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) { setWishlist([]); return; }
        try {
            const res = await axios.get(`${API_URL}/wishlist`, { headers: { Authorization: `Bearer ${currentToken}` } });
            setWishlist(res.data.wishlist || []);
        } catch (err) { console.error('Failed to fetch wishlist:', err); }
    }, []);

    const addToCart = async (listingId, quantity = 1) => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return { success: false, error: 'Please log in' };
        try {
            const res = await axios.post(`${API_URL}/cart/add`, { listingId, quantity }, { headers: { Authorization: `Bearer ${currentToken}` } });
            if (res.data.free) return { free: true };
            await fetchCart();
            return { success: true };
        } catch (err) { return { success: false, error: err.response?.data?.error || 'Failed' }; }
    };

    const removeFromCart = async (cartItemId) => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return { success: false };
        try {
            await axios.delete(`${API_URL}/cart/${cartItemId}`, { headers: { Authorization: `Bearer ${currentToken}` } });
            await fetchCart();
            return { success: true };
        } catch (err) { return { success: false }; }
    };

    const toggleWishlist = async (listingId) => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return { success: false, error: 'Please log in' };
        try {
            const res = await axios.post(`${API_URL}/wishlist/toggle`, { listingId }, { headers: { Authorization: `Bearer ${currentToken}` } });
            await fetchWishlist();
            return { success: true, added: res.data.added };
        } catch (err) { return { success: false }; }
    };

    const isInWishlist = (listingId) => wishlist.some(item => item.listing_id === listingId);

    return (
        <ShopContext.Provider value={{ cart, cartCount, wishlist, categories, loading, token, addToCart, removeFromCart, toggleWishlist, isInWishlist, fetchCart, fetchWishlist }}>
            {children}
        </ShopContext.Provider>
    );
};
