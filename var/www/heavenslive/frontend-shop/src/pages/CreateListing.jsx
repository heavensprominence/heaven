import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CreateListing.css';

const CreateListing = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategoriesCache, setSubcategoriesCache] = useState({});
    const [selectedPath, setSelectedPath] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [myStore, setMyStore] = useState(null);
    const [myPlan, setMyPlan] = useState(null);
    
    const [formData, setFormData] = useState({
        type: 'mall',
        title: '',
        description: '',
        category: '',
        store_id: '',
        price_cents: '',
        min_bid_cents: '',
        max_bid_cents: '',
        quantity_available: 1,
        duration: '2weeks',
        location_city: '',
        location_state: '',
        location_country: 'US',
        weight_oz: '',
        dimensions: { length: '', width: '', height: '' },
        shipping_options: [],
        images: [],
        is_featured: false
    });

    const types = [
        { value: 'mall', label: '🛍️ Mall (Fixed Price)', priceLabel: 'Price ($)' },
        { value: 'classifieds', label: '📰 Classifieds (Fixed Price)', priceLabel: 'Price ($)' },
        { value: 'auction', label: '🔨 Auction', priceLabel: 'Minimum Bid ($)' },
        { value: 'reverse_auction', label: '📋 Procurement', priceLabel: 'Maximum Bid ($)' }
    ];

    const durations = [
        { value: '2weeks', label: '2 Weeks' },
        { value: '1year', label: '1 Year' },
        { value: 'forever', label: 'Forever' }
    ];

    useEffect(() => {
        fetchMainCategories();
        if (token) {
            fetchMyStore();
            fetchMyPlan();
        }
    }, [token]);

    const fetchMainCategories = async () => {
        try {
            const res = await axios.get('/api/shop/categories');
            const sorted = (res.data.categories || []).sort((a, b) => {
                if (a.slug === 'other' || a.name === 'Other') return 1;
                if (b.slug === 'other' || b.name === 'Other') return -1;
                return (a.name || '').localeCompare(b.name || '');
            });
            setCategories(sorted);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchMyStore = async () => {
        try {
            const res = await axios.get('/api/shop/stores/my-store', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.store) {
                setMyStore(res.data.store);
            }
        } catch (err) {
            console.error('Failed to fetch store:', err);
        }
    };

    const fetchMyPlan = async () => {
        try {
            const res = await axios.get('/api/shop/subscriptions/my-plan', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyPlan(res.data);
        } catch (err) {
            console.error('Failed to fetch plan:', err);
        }
    };

    const fetchSubcategories = async (parentSlug) => {
        if (subcategoriesCache[parentSlug]) return subcategoriesCache[parentSlug];
        
        try {
            const res = await axios.get(`/api/shop/categories/subcategories/${parentSlug}?lang=${localStorage.getItem('i18nextLng') || 'en'}`);
            const subs = (res.data.subcategories || []).sort((a, b) => {
                if (a.name === 'Other' || a.slug.includes('_other')) return 1;
                if (b.name === 'Other' || b.slug.includes('_other')) return -1;
                return (a.name || '').localeCompare(b.name || '');
            });
            setSubcategoriesCache(prev => ({ ...prev, [parentSlug]: subs }));
            return subs;
        } catch (err) {
            console.error('Failed to fetch subcategories:', err);
            return [];
        }
    };

    const handleCategorySelect = async (level, categorySlug, categoryName) => {
        const newPath = [...selectedPath.slice(0, level), { slug: categorySlug, name: categoryName }];
        setSelectedPath(newPath);
        setFormData(prev => ({ ...prev, category: categorySlug }));
        await fetchSubcategories(categorySlug);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDimensionChange = (dim, value) => {
        setFormData(prev => ({
            ...prev,
            dimensions: { ...prev.dimensions, [dim]: value }
        }));
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        
        const validFiles = files.filter(file => file.size <= 3 * 1024 * 1024);
        if (validFiles.length !== files.length) {
            alert('Some images exceed 3MB and were skipped.');
        }
        
        const selectedFiles = validFiles.slice(0, 3);
        setImageFiles(selectedFiles);
        
        const previews = selectedFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const removeImage = (index) => {
        const newFiles = imageFiles.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
        URL.revokeObjectURL(imagePreviews[index]);
    };

    const uploadImages = async () => {
        if (imageFiles.length === 0) return [];
        
        setUploading(true);
        const uploadedUrls = [];
        
        try {
            for (const file of imageFiles) {
                const formData = new FormData();
                formData.append('image', file);
                
                const res = await axios.post('/api/shop/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (res.data.url) {
                    uploadedUrls.push(res.data.url);
                }
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            throw new Error('Failed to upload images');
        } finally {
            setUploading(false);
        }
        
        return uploadedUrls;
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            alert('Please enter a title');
            return false;
        }
        if (!formData.category) {
            alert('Please select a category');
            return false;
        }
        
        const priceField = formData.type === 'auction' ? 'min_bid_cents' : 
                          formData.type === 'reverse_auction' ? 'max_bid_cents' : 'price_cents';
        
        const priceValue = formData[priceField];
        if (priceValue !== '' && priceValue !== null && priceValue !== undefined) {
            const numericPrice = parseFloat(priceValue);
            if (isNaN(numericPrice) || numericPrice < 0) {
                alert('Please enter a valid price (0 or greater)');
                return false;
            }
        }
        
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            let imageUrls = [];
            if (imageFiles.length > 0) {
                imageUrls = await uploadImages();
            }
            
            const priceField = formData.type === 'auction' ? 'min_bid_cents' : 
                              formData.type === 'reverse_auction' ? 'max_bid_cents' : 'price_cents';
            
            const priceValue = formData[priceField];
            let priceCents = 0;
            
            if (priceValue && priceValue !== '') {
                priceCents = Math.round(parseFloat(priceValue) * 100);
                if (isNaN(priceCents)) priceCents = 0;
            }
            
            const payload = {
                type: formData.type,
                title: formData.title.trim(),
                description: formData.description || '',
                category: formData.category,
                store_id: formData.store_id || null,
                quantity_available: parseInt(formData.quantity_available) || 1,
                duration: formData.duration,
                location_city: formData.location_city || '',
                location_state: formData.location_state || '',
                location_country: formData.location_country || 'US',
                weight_oz: formData.weight_oz ? parseInt(formData.weight_oz) : null,
                dimensions: formData.dimensions,
                shipping_options: formData.shipping_options || [],
                images: imageUrls,
                is_featured: formData.is_featured
            };
            
            if (formData.type === 'auction') {
                payload.min_bid_cents = priceCents;
            } else if (formData.type === 'reverse_auction') {
                payload.max_bid_cents = priceCents;
            } else {
                payload.price_cents = priceCents;
            }
            
            await axios.post('/api/shop/listings', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Listing submitted for approval!');
            navigate('/shop/seller/dashboard');
        } catch (err) {
            console.error('Submit error:', err);
            alert('Failed to create listing: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const selectedType = types.find(t => t.value === formData.type);
    const priceLabel = selectedType?.priceLabel || 'Price ($)';
    const priceField = formData.type === 'auction' ? 'min_bid_cents' : 
                      formData.type === 'reverse_auction' ? 'max_bid_cents' : 'price_cents';

    const getCurrentLevelCategories = () => {
        if (selectedPath.length === 0) return categories;
        const parentSlug = selectedPath[selectedPath.length - 1].slug;
        return subcategoriesCache[parentSlug] || [];
    };

    const currentLevelCategories = getCurrentLevelCategories();
    const canGoDeeper = currentLevelCategories.length > 0;

    // Featured listing logic
    const maxFeatured = myPlan?.limits?.featuredListings || 0;
    const currentFeatured = myPlan?.usage?.currentFeatured || 0;
    const canFeature = maxFeatured === -1 ? true : currentFeatured < maxFeatured;
    const isFreePlan = !myPlan || myPlan.planSlug === 'free';
    const featuredDisabled = isFreePlan || !canFeature;

    // Build the upgrade URL (opens in new tab so form data is preserved)
    const upgradeUrl = '/pricing';

    return (
        <div className="create-listing">
            <div className="listing-header">
                <h1>Create New Listing</h1>
                <Link to="/" className="back-link">← Back to Shop</Link>
                <div className="steps">
                    <span className={step >= 1 ? 'active' : ''}>1. Basic Info</span>
                    <span className={step >= 2 ? 'active' : ''}>2. Images</span>
                    <span className={step >= 3 ? 'active' : ''}>3. Pricing</span>
                    <span className={step >= 4 ? 'active' : ''}>4. Shipping</span>
                    <span className={step >= 5 ? 'active' : ''}>5. Review</span>
                </div>
            </div>

            <div className="listing-form">
                {step === 1 && (
                    <div className="form-section">
                        <h2>Basic Information</h2>
                        
                        {/* Featured Listing Checkbox - MOVED TO TOP */}
                        <div className="form-group featured-group featured-top">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={formData.is_featured}
                                    onChange={(e) => handleChange('is_featured', e.target.checked)}
                                    disabled={featuredDisabled}
                                />
                                <span className="featured-text">
                                    🌟 Feature This Listing
                                    {featuredDisabled && (
                                        <span className="featured-info">
                                            {isFreePlan ? (
                                                <span>
                                                    {' '}-{' '}
                                                    <a href={upgradeUrl} target="_blank" rel="noopener noreferrer" className="upgrade-link">
                                                        Upgrade to feature listings (opens new tab)
                                                    </a>
                                                </span>
                                            ) : (
                                                <span className="featured-used">
                                                    {' '}-{' '}{currentFeatured}/{maxFeatured} used{' '}
                                                    <a href={upgradeUrl} target="_blank" rel="noopener noreferrer" className="upgrade-link">
                                                        (upgrade for more - opens new tab)
                                                    </a>
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    {!featuredDisabled && (
                                        <span className="featured-info">
                                            {' '}-{' '}{maxFeatured === -1 ? 'Unlimited' : `${maxFeatured - currentFeatured} remaining`}
                                        </span>
                                    )}
                                </span>
                            </label>
                            <p className="field-hint">
                                Featured listings appear at the top of search results and get 5x more views!
                            </p>
                        </div>

                        {/* Store Selection Dropdown */}
                        {myStore && (
                            <div className="form-group store-select-group">
                                <label>Post As</label>
                                <select 
                                    value={formData.store_id} 
                                    onChange={(e) => handleChange('store_id', e.target.value)}
                                >
                                    <option value="">👤 Personal Listing</option>
                                    <option value={myStore.id}>🏪 {myStore.store_name}</option>
                                </select>
                                <p className="field-hint">
                                    Choose "Personal Listing" or post to your store for better visibility
                                </p>
                            </div>
                        )}
                        
                        {!myStore && (
                            <div className="form-group no-store-hint">
                                <p className="field-hint">
                                    💡 <a href="/seller/settings" target="_blank" rel="noopener noreferrer" className="upgrade-link">Create a store (opens new tab)</a> to organize your listings and build your brand!
                                </p>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Listing Type</label>
                            <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
                                {types.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Title *</label>
                            <input type="text" value={formData.title} 
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="e.g., Vintage Leather Jacket" />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea rows="5" value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Describe your item in detail..." />
                        </div>

                        <div className="form-group">
                            <label>Category *</label>
                            
                            {selectedPath.length > 0 && (
                                <div className="selected-category-path">
                                    📁 Selected: {selectedPath.map(p => p.name).join(' > ')}
                                    <button className="clear-category-btn" onClick={() => {
                                        setSelectedPath([]);
                                        setFormData(prev => ({ ...prev, category: '' }));
                                    }}>✕</button>
                                </div>
                            )}
                            
                            <div className="category-selector">
                                <select value="" onChange={async (e) => {
                                    const selected = currentLevelCategories.find(c => c.slug === e.target.value);
                                    if (selected) {
                                        await handleCategorySelect(selectedPath.length, selected.slug, selected.name);
                                    }
                                }}>
                                    <option value="">
                                        {selectedPath.length === 0 ? 'Select a main category' : 
                                            canGoDeeper ? `Select a subcategory under "${selectedPath[selectedPath.length - 1].name}" (optional)` :
                                            `No subcategories available under "${selectedPath[selectedPath.length - 1].name}"`}
                                    </option>
                                    {currentLevelCategories.map(cat => (
                                        <option key={cat.slug} value={cat.slug}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Quantity Available</label>
                            <input type="number" min="1" value={formData.quantity_available}
                                onChange={(e) => handleChange('quantity_available', parseInt(e.target.value) || 1)} />
                        </div>

                        <div className="form-group">
                            <label>Duration</label>
                            <select value={formData.duration} onChange={(e) => handleChange('duration', e.target.value)}>
                                {durations.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-section">
                        <h2>Images (Up to 3, max 3MB each)</h2>
                        
                        <div className="form-group">
                            <label>Upload Images</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                onChange={handleImageSelect}
                                className="file-input"
                            />
                            <p className="field-hint">First image will be the cover photo</p>
                        </div>
                        
                        {imagePreviews.length > 0 && (
                            <div className="image-previews">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="image-preview-item">
                                        <img src={preview} alt={`Preview ${index + 1}`} />
                                        <button className="remove-image-btn" onClick={() => removeImage(index)}>
                                            ✕
                                        </button>
                                        {index === 0 && <span className="cover-badge">Cover</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="form-section">
                        <h2>Pricing</h2>
                        
                        <div className="form-group">
                            <label>{priceLabel}</label>
                            <input type="number" min="0" step="0.01"
                                value={formData[priceField] || ''}
                                onChange={(e) => handleChange(priceField, e.target.value)}
                                placeholder="0.00" />
                            <p className="field-hint">Enter 0 for free listings</p>
                        </div>

                        {formData.type === 'auction' && (
                            <div className="info-box">
                                <p>💡 Bid increments will be 10% of the minimum bid.</p>
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="form-section">
                        <h2>Shipping Information</h2>
                        
                        <div className="form-group">
                            <label>Location</label>
                            <div className="location-inputs">
                                <input type="text" placeholder="City" value={formData.location_city}
                                    onChange={(e) => handleChange('location_city', e.target.value)} />
                                <input type="text" placeholder="State" value={formData.location_state}
                                    onChange={(e) => handleChange('location_state', e.target.value)} />
                                <input type="text" placeholder="Country" value={formData.location_country}
                                    onChange={(e) => handleChange('location_country', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="form-section">
                        <h2>Review Your Listing</h2>
                        
                        <div className="review-card">
                            {imagePreviews.length > 0 && (
                                <img src={imagePreviews[0]} alt="Cover" className="review-cover" />
                            )}
                            <h3>
                                {formData.is_featured && <span className="featured-badge">🌟 Featured</span>}
                                {formData.title || '(No title)'}
                            </h3>
                            <p className="type-badge">{selectedType?.label}</p>
                            {formData.store_id && myStore && (
                                <p className="store-badge">🏪 Posted in: {myStore.store_name}</p>
                            )}
                            {!formData.store_id && (
                                <p className="store-badge">👤 Personal Listing</p>
                            )}
                            <p className="price">{formData[priceField] ? `$${formData[priceField]}` : 'Free'}</p>
                            <p className="category">📁 {selectedPath.map(p => p.name).join(' > ') || 'None'}</p>
                            <p className="description">{formData.description || '(No description)'}</p>
                            {formData.is_featured && (
                                <p className="featured-review-note">⭐ This listing will be featured and boost your visibility!</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    {step > 1 && (
                        <button className="secondary-btn" onClick={() => setStep(s => s - 1)}>← Back</button>
                    )}
                    {step < 5 ? (
                        <button className="primary-btn" onClick={() => setStep(s => s + 1)}>Continue</button>
                    ) : (
                        <button className="primary-btn" onClick={handleSubmit} disabled={loading || uploading}>
                            {loading || uploading ? 'Submitting...' : 'Submit for Approval'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateListing;
