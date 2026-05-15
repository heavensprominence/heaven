import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategoryManager.css';

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭' }
];

const CategoryManager = ({ token }) => {
    const [categories, setCategories] = useState([]);
    const [flatCategories, setFlatCategories] = useState([]);
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeLang, setActiveLang] = useState('en');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ displayName: '', parentCategory: '', icon: '📁' });
    const [editForm, setEditForm] = useState({ displayName: '', icon: '📁', isActive: true, parentCategory: '' });
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [editingTranslation, setEditingTranslation] = useState({ category: '', lang: '', value: '' });
    
    const icons = ['📁', '📦', '📱', '👕', '🏠', '🏆', '🚗', '🛠️', '💎', '🎮', '📚', '🎵', '🐾', '🌿', '🍔', '💄'];

    useEffect(() => { fetchCategories(); fetchTranslations(); }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const [treeRes, flatRes] = await Promise.all([
                axios.get('/api/shop/categories/tree', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/shop/categories/flat', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setCategories(treeRes.data.tree || []);
            setFlatCategories(flatRes.data.categories || []);
        } catch (err) { console.error('Failed to fetch categories:', err); }
        finally { setLoading(false); }
    };

    const fetchTranslations = async () => {
        try {
            const res = await axios.get('/api/shop/categories/translations/all', { headers: { Authorization: `Bearer ${token}` } });
            const transMap = {};
            (res.data.translations || []).forEach(t => {
                if (!transMap[t.category]) transMap[t.category] = {};
                if (t.language_code && t.translated_name) {
                    transMap[t.category][t.language_code] = t.translated_name;
                }
            });
            setTranslations(transMap);
        } catch (err) { console.error('Failed to fetch translations:', err); }
    };

    const getDisplayName = (cat) => {
        if (activeLang === 'en') return cat.display_name;
        return translations[cat.category]?.[activeLang] || null;
    };

    const hasTranslation = (cat) => {
        if (activeLang === 'en') return true;
        const trans = translations[cat.category]?.[activeLang];
        return trans && trans !== cat.display_name;
    };

    const handleTranslate = async (category) => {
        try {
            await axios.post('/api/shop/categories/translate', 
                { slug: category.category, name: category.display_name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchTranslations();
            alert('Translations requested for: ' + category.display_name);
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    const startEditTranslation = (cat, lang) => {
        const current = translations[cat.category]?.[lang] || '';
        setEditingTranslation({ category: cat.category, lang, value: current });
    };

    const saveEditTranslation = async () => {
        const { category, lang, value } = editingTranslation;
        if (!value.trim()) return;
        try {
            await axios.put(`/api/shop/categories/translation/${category}`, 
                { language_code: lang, name: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchTranslations();
            setEditingTranslation({ category: '', lang: '', value: '' });
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    const handleCreate = async () => {
        if (!newCategory.displayName.trim()) { alert('Category name is required'); return; }
        try {
            await axios.post('/api/shop/categories/create', newCategory, { headers: { Authorization: `Bearer ${token}` } });
            setShowAddModal(false);
            setNewCategory({ displayName: '', parentCategory: '', icon: '📁' });
            fetchCategories();
            fetchTranslations();
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`/api/shop/categories/${selectedCategory.category}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
            setShowEditModal(false);
            fetchCategories();
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Delete "${category.display_name}" and ALL its subcategories?`)) return;
        try {
            await axios.delete(`/api/shop/categories/${category.category}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchCategories();
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    const handleToggleActive = async (category) => {
        try {
            await axios.put(`/api/shop/categories/${category.category}`, { isActive: !category.is_active }, { headers: { Authorization: `Bearer ${token}` } });
            fetchCategories();
        } catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    };

    const toggleExpand = (categoryId) => {
        const newExpanded = new Set(expandedNodes);
        newExpanded.has(categoryId) ? newExpanded.delete(categoryId) : newExpanded.add(categoryId);
        setExpandedNodes(newExpanded);
    };

    const expandAll = () => {
        const allIds = new Set();
        const collectIds = (items) => {
            items.forEach(item => { allIds.add(item.id); if (item.children) collectIds(item.children); });
        };
        collectIds(categories);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => setExpandedNodes(new Set());

    const renderCategoryRow = (cat, depth = 0) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedNodes.has(cat.id);
        const translatedName = getDisplayName(cat);
        const hasTrans = hasTranslation(cat);
        
        return (
            <React.Fragment key={cat.id}>
                <tr className={!cat.is_active ? 'inactive' : ''}>
                    <td style={{ paddingLeft: `${depth * 30 + 15}px` }}>
                        {hasChildren && <button className="expand-tree-btn" onClick={() => toggleExpand(cat.id)}>{isExpanded ? '▼' : '▶'}</button>}
                        <span className="category-icon">{cat.icon}</span>
                        <span className="category-name">
                            {activeLang === 'en' ? cat.display_name : (
                                editingTranslation.category === cat.category && editingTranslation.lang === activeLang ? (
                                    <span className="inline-edit">
                                        <input 
                                            value={editingTranslation.value}
                                            onChange={(e) => setEditingTranslation({...editingTranslation, value: e.target.value})}
                                            onBlur={saveEditTranslation}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEditTranslation()}
                                            autoFocus
                                            style={{ width: '200px' }}
                                        />
                                    </span>
                                ) : (
                                    <span onClick={() => startEditTranslation(cat, activeLang)} title="Click to edit translation">
                                        {hasTrans ? translatedName : <span className="no-trans">{cat.display_name} ⚠️</span>}
                                    </span>
                                )
                            )}
                        </span>
                        {!cat.is_active && <span className="inactive-badge">Inactive</span>}
                    </td>
                    <td>{cat.level}</td>
                    <td>{cat.parent_category || '—'}</td>
                    <td className="actions">
                        {activeLang !== 'en' && !hasTrans && (
                            <button className="translate-btn" onClick={() => handleTranslate(cat)} title="Auto-translate">🌐</button>
                        )}
                        <button className="edit-btn" onClick={() => {
                            setSelectedCategory(cat);
                            setEditForm({ displayName: cat.display_name, icon: cat.icon, isActive: cat.is_active, parentCategory: cat.parent_category || '' });
                            setShowEditModal(true);
                        }}>✏️</button>
                        <button className="add-child-btn" onClick={() => { setNewCategory({ displayName: '', parentCategory: cat.category, icon: '📁' }); setShowAddModal(true); }}>➕</button>
                        <button className="toggle-btn" onClick={() => handleToggleActive(cat)}>{cat.is_active ? '👁️' : '👁️‍🗨️'}</button>
                        <button className="delete-btn" onClick={() => handleDelete(cat)}>🗑️</button>
                    </td>
                </tr>
                {hasChildren && isExpanded && cat.children.map(child => renderCategoryRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    if (loading) return <div className="loading">Loading categories...</div>;

    return (
        <div className="category-manager">
            <div className="manager-header">
                <h2>Category Tree Manager</h2>
                <div className="header-actions">
                    <button className="expand-all-btn" onClick={expandAll}>▼ Expand All</button>
                    <button className="collapse-all-btn" onClick={collapseAll}>▶ Collapse All</button>
                    <button className="add-main-btn" onClick={() => { setNewCategory({ displayName: '', parentCategory: '', icon: '📁' }); setShowAddModal(true); }}>➕ Add Main Category</button>
                </div>
            </div>

            <div className="language-tabs">
                {languages.map(lang => (
                    <button key={lang.code} className={`lang-tab ${activeLang === lang.code ? 'active' : ''}`} onClick={() => setActiveLang(lang.code)} title={lang.name}>
                        {lang.flag} {lang.code.toUpperCase()}
                    </button>
                ))}
            </div>

            <table className="category-table">
                <thead>
                    <tr>
                        <th>Name {activeLang !== 'en' && <span className="lang-indicator">({activeLang.toUpperCase()})</span>}</th>
                        <th>Level</th>
                        <th>Parent</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => renderCategoryRow(cat))}
                </tbody>
            </table>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Add New Category</h3>
                        <div className="form-group">
                            <label>Display Name *</label>
                            <input type="text" value={newCategory.displayName} onChange={(e) => setNewCategory({...newCategory, displayName: e.target.value})} placeholder="e.g., Electronics" autoFocus />
                        </div>
                        <div className="form-group">
                            <label>Parent Category {newCategory.parentCategory && '(Selected)'}</label>
                            <select value={newCategory.parentCategory} onChange={(e) => setNewCategory({...newCategory, parentCategory: e.target.value})}>
                                <option value="">— Main Category (Top Level) —</option>
                                {flatCategories.map(cat => (
                                    <option key={cat.category} value={cat.category}>{'— '.repeat(cat.level - 1)}{cat.display_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Icon</label>
                            <div className="icon-selector">
                                {icons.map(i => (
                                    <button key={i} type="button" className={`icon-btn ${newCategory.icon === i ? 'active' : ''}`} onClick={() => setNewCategory({...newCategory, icon: i})}>{i}</button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleCreate} className="confirm-btn">Create</button>
                            <button onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && selectedCategory && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Edit Category: {selectedCategory.display_name}</h3>
                        <div className="form-group">
                            <label>Display Name</label>
                            <input type="text" value={editForm.displayName} onChange={(e) => setEditForm({...editForm, displayName: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Parent Category</label>
                            <select value={editForm.parentCategory} onChange={(e) => setEditForm({...editForm, parentCategory: e.target.value})}>
                                <option value="">— Main Category —</option>
                                {flatCategories.filter(cat => cat.category !== selectedCategory.category).map(cat => (
                                    <option key={cat.category} value={cat.category}>{'— '.repeat(cat.level - 1)}{cat.display_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Icon</label>
                            <div className="icon-selector">{icons.map(i => (
                                <button key={i} type="button" className={`icon-btn ${editForm.icon === i ? 'active' : ''}`} onClick={() => setEditForm({...editForm, icon: i})}>{i}</button>
                            ))}</div>
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label"><input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})} /> Active (visible to users)</label>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleUpdate} className="confirm-btn">Save Changes</button>
                            <button onClick={() => setShowEditModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;
