import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './SearchFilters.css';

const conditionOptions = [
    { value: '', label: 'Any Condition' },
    { value: 'new', label: '🆕 New' },
    { value: 'like_new', label: '✨ Like New' },
    { value: 'very_good', label: '👍 Very Good' },
    { value: 'good', label: '👌 Good' },
    { value: 'fair', label: '📦 Fair' },
    { value: 'poor', label: '🔧 Poor / For Parts' }
];

const SearchFilters = ({ filters, categories, onFilterChange, token }) => {
    const { t } = useTranslation();
    const [priceRange, setPriceRange] = useState({ min: filters.minPrice || '', max: filters.maxPrice || '' });
    const [expandedCategories, setExpandedCategories] = useState({});
    const [subcategories, setSubcategories] = useState({});
    const [loadingSubcategories, setLoadingSubcategories] = useState({});

    const sortedCategories = [...categories].sort((a, b) => {
        if (a.slug === 'other' || a.name === 'Other') return 1;
        if (b.slug === 'other' || b.name === 'Other') return -1;
        return (a.name || '').localeCompare(b.name || '');
    });

    const toggleCategory = async (categorySlug, parentPath = '') => {
        const cacheKey = parentPath ? `${parentPath}/${categorySlug}` : categorySlug;
        if (expandedCategories[cacheKey]) {
            setExpandedCategories(prev => ({ ...prev, [cacheKey]: false }));
        } else {
            setExpandedCategories(prev => ({ ...prev, [cacheKey]: true }));
            if (!subcategories[cacheKey]) {
                setLoadingSubcategories(prev => ({ ...prev, [cacheKey]: true }));
                try {
                    const lang = localStorage.getItem('i18nextLng') || 'en';
                    const res = await axios.get(`/api/shop/categories/subcategories/${categorySlug}?lang=${lang}`);
                    const subs = (res.data.subcategories || []).sort((a, b) => {
                        if (a.name === 'Other' || a.slug.includes('_other')) return 1;
                        if (b.name === 'Other' || b.slug.includes('_other')) return -1;
                        return (a.name || '').localeCompare(b.name || '');
                    });
                    setSubcategories(prev => ({ ...prev, [cacheKey]: subs }));
                } catch (err) { console.error('Failed to fetch subcategories:', err); }
                finally { setLoadingSubcategories(prev => ({ ...prev, [cacheKey]: false })); }
            }
        }
    };

    const handleCategorySelect = (categorySlug) => onFilterChange({ category: categorySlug });

    const renderCategoryTree = (cats, depth = 0, parentPath = '') => {
        return cats.map(cat => {
            const cacheKey = parentPath ? `${parentPath}/${cat.slug}` : cat.slug;
            const isExpanded = expandedCategories[cacheKey];
            const children = subcategories[cacheKey] || [];
            const hasChildren = cat.subcategory_count > 0 || children.length > 0;
            const isLoading = loadingSubcategories[cacheKey];
            return (
                <div key={cat.slug} className="category-tree-item">
                    <div className="category-row">
                        <button className={`category-btn ${filters.category === cat.slug ? 'active' : ''}`} onClick={() => handleCategorySelect(cat.slug)} style={{ paddingLeft: `${depth * 20 + 12}px` }}>
                            <span>{cat.icon} {cat.name}</span><span className="count">({cat.count})</span>
                        </button>
                        {hasChildren && <button className="expand-btn" onClick={() => toggleCategory(cat.slug, parentPath)}>{isExpanded ? '▼' : '▶'}</button>}
                    </div>
                    {isExpanded && (
                        <div className="subcategory-container">
                            {isLoading ? <div className="loading-subcategories" style={{ paddingLeft: `${(depth + 1) * 20 + 12}px` }}>{t('common.loading')}</div> : 
                             children.length > 0 ? renderCategoryTree(children, depth + 1, cacheKey) : 
                             <div className="no-subcategories" style={{ paddingLeft: `${(depth + 1) * 20 + 12}px` }}>{t('searchFilters.noSubcategories')}</div>}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="search-filters">
            <div className="filter-section"><h3>{t('searchFilters.categories')}</h3><div className="category-list">{renderCategoryTree(sortedCategories)}</div></div>
            
            <div className="filter-section">
                <h3>{t('searchFilters.condition')}</h3>
                <select value={filters.condition || ''} onChange={(e) => onFilterChange({ condition: e.target.value })} className="condition-select">
                    {conditionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            
            <div className="filter-section">
                <h3>{t('searchFilters.priceRange')}</h3>
                <div className="price-inputs">
                    <input type="number" placeholder={t('searchFilters.min')} value={priceRange.min} onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))} />
                    <span>-</span>
                    <input type="number" placeholder={t('searchFilters.max')} value={priceRange.max} onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))} />
                    <button onClick={() => onFilterChange({ minPrice: priceRange.min, maxPrice: priceRange.max })}>{t('common.search')}</button>
                </div>
            </div>
            
            <button className="clear-filters-btn" onClick={() => { setExpandedCategories({}); onFilterChange({ q: '', type: '', category: '', condition: '', minPrice: '', maxPrice: '' }); }}>
                {t('searchFilters.clearAll')}
            </button>
        </div>
    );
};

export default SearchFilters;
