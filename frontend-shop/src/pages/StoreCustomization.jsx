import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './StoreCustomization.css';

const StoreCustomization = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [theme, setTheme] = useState({
        theme_color: '#0b1f3f',
        secondary_color: '#ffd700',
        text_color: '#f5f5f5',
        font_family: 'Arial, sans-serif',
        layout_style: 'grid',
        show_seller_info: true
    });

    const presetThemes = [
        { name: 'Default Dark', primary: '#0b1f3f', secondary: '#ffd700', text: '#f5f5f5' },
        { name: 'Ocean Blue', primary: '#1a3a5c', secondary: '#00bcd4', text: '#ffffff' },
        { name: 'Forest Green', primary: '#1b3a2a', secondary: '#4caf50', text: '#f0f0f0' },
        { name: 'Sunset Orange', primary: '#3a1a1a', secondary: '#ff6b6b', text: '#ffe0e0' },
        { name: 'Royal Purple', primary: '#2a1a3a', secondary: '#9c27b0', text: '#f5e6ff' },
        { name: 'Light Mode', primary: '#f5f5f5', secondary: '#2196f3', text: '#333333' }
    ];

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const res = await axios.get('/api/shop/stores/my-store', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.store) {
                setStore(res.data.store);
                setTheme({
                    theme_color: res.data.store.theme_color || '#0b1f3f',
                    secondary_color: res.data.store.secondary_color || '#ffd700',
                    text_color: res.data.store.text_color || '#f5f5f5',
                    font_family: res.data.store.font_family || 'Arial, sans-serif',
                    layout_style: res.data.store.layout_style || 'grid',
                    show_seller_info: res.data.store.show_seller_info !== false
                });
            }
        } catch (err) {
            console.error('Failed to fetch store:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (type, file) => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append(type, file);
        try {
            const res = await axios.post(`/api/shop/stores/upload-${type}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            setStore({ ...store, [`${type}_url`]: res.data.url });
            alert(`${type} uploaded successfully!`);
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
        }
    };

    const applyPresetTheme = (preset) => {
        setTheme({
            ...theme,
            theme_color: preset.primary,
            secondary_color: preset.secondary,
            text_color: preset.text
        });
    };

    const handleSaveTheme = async () => {
        setSaving(true);
        try {
            await axios.put('/api/shop/stores/theme', theme, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Theme saved successfully!');
        } catch (err) {
            alert('Failed to save theme: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!store) return <div className="error">Please create a store first.</div>;

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <div className="store-customization">
                    <h1>🎨 Store Customization</h1>
                <Link to="/seller/dashboard" className="back-link">← Back to Posts Dashboard</Link>
                    <Link to={`/store/${store.slug}`} target="_blank" className="preview-link">
                        Preview Store →
                    </Link>

                    {/* Banner Upload */}
                    <div className="customization-section">
                        <h2>Store Banner</h2>
                        <div className="banner-upload">
                            {store.banner_url ? (
                                <img src={store.banner_url} alt="Store Banner" className="banner-preview" />
                            ) : (
                                <div className="banner-placeholder">No banner uploaded</div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload('banner', e.target.files[0])} disabled={uploading} />
                            <p className="hint">Recommended size: 1200 x 300 pixels</p>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="customization-section">
                        <h2>Store Logo</h2>
                        <div className="logo-upload">
                            {store.logo_url ? (
                                <img src={store.logo_url} alt="Store Logo" className="logo-preview" />
                            ) : (
                                <div className="logo-placeholder">No logo</div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload('logo', e.target.files[0])} disabled={uploading} />
                            <p className="hint">Recommended size: 200 x 200 pixels (square)</p>
                        </div>
                    </div>

                    {/* Preset Themes */}
                    <div className="customization-section">
                        <h2>Preset Themes</h2>
                        <div className="preset-themes">
                            {presetThemes.map((preset, i) => (
                                <button key={i} className="preset-btn" onClick={() => applyPresetTheme(preset)} style={{ background: preset.primary, color: preset.text }}>
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="customization-section">
                        <h2>Custom Colors</h2>
                        <div className="color-pickers">
                            <div className="color-item">
                                <label>Primary Color</label>
                                <input type="color" value={theme.theme_color} onChange={(e) => setTheme({...theme, theme_color: e.target.value})} />
                            </div>
                            <div className="color-item">
                                <label>Accent Color</label>
                                <input type="color" value={theme.secondary_color} onChange={(e) => setTheme({...theme, secondary_color: e.target.value})} />
                            </div>
                            <div className="color-item">
                                <label>Text Color</label>
                                <input type="color" value={theme.text_color} onChange={(e) => setTheme({...theme, text_color: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Layout Options */}
                    <div className="customization-section">
                        <h2>Layout Options</h2>
                        <div className="layout-options">
                            <label>
                                <input type="radio" value="grid" checked={theme.layout_style === 'grid'} onChange={(e) => setTheme({...theme, layout_style: e.target.value})} />
                                Grid View
                            </label>
                            <label>
                                <input type="radio" value="list" checked={theme.layout_style === 'list'} onChange={(e) => setTheme({...theme, layout_style: e.target.value})} />
                                List View
                            </label>
                        </div>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={theme.show_seller_info} onChange={(e) => setTheme({...theme, show_seller_info: e.target.checked})} />
                            Show seller information on store page
                        </label>
                    </div>

                    {/* Live Preview */}
                    <div className="customization-section">
                        <h2>Live Preview</h2>
                        <div className="live-preview" style={{ background: theme.theme_color, color: theme.text_color }}>
                            <div className="preview-header" style={{ borderBottom: `2px solid ${theme.secondary_color}` }}>
                                {store.logo_url && <img src={store.logo_url} alt="Logo" className="preview-logo" />}
                                <h3 style={{ color: theme.secondary_color }}>{store.store_name}</h3>
                            </div>
                            <div className="preview-content">
                                <p>Your store items will appear here with your chosen theme.</p>
                                <button style={{ background: theme.secondary_color, color: theme.theme_color }}>Sample Button</button>
                            </div>
                        </div>
                    </div>

                    <button className="save-theme-btn" onClick={handleSaveTheme} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoreCustomization;
