import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategorySuggest.css';

const CategorySuggest = ({ currentCategory, onClose }) => {
    const [suggestedName, setSuggestedName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [needsLogin, setNeedsLogin] = useState(false);
    const [validating, setValidating] = useState(true);
    const [validToken, setValidToken] = useState(null);
    const [parentCategory, setParentCategory] = useState(currentCategory || '');
    const [categories, setCategories] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [loadingTree, setLoadingTree] = useState(false);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setNeedsLogin(true);
                setValidating(false);
                return;
            }
            
            try {
                const response = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                    setValidToken(token);
                    setNeedsLogin(false);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setNeedsLogin(true);
                }
            } catch (err) {
                setNeedsLogin(true);
            } finally {
                setValidating(false);
            }
        };
        
        validateToken();
    }, []);

    // Load category tree
    useEffect(() => {
        const loadTree = async () => {
            setLoadingTree(true);
            try {
                const res = await axios.get('/api/shop/categories/tree?all=true');
                setCategories(res.data.categories || []);
                // Auto-expand to show the current category
                if (currentCategory) {
                    const toExpand = new Set();
                    const findPath = (cats, target, path) => {
                        for (const cat of cats) {
                            if (cat.slug === target) {
                                path.forEach(p => toExpand.add(p));
                                return true;
                            }
                            if (cat.subcategories && findPath(cat.subcategories, target, [...path, cat.slug])) {
                                toExpand.add(cat.slug);
                                return true;
                            }
                        }
                        return false;
                    };
                    findPath(res.data.categories || [], currentCategory, []);
                    setExpandedNodes(toExpand);
                }
            } catch (e) { console.error('Failed to load category tree:', e); }
            finally { setLoadingTree(false); }
        };
        loadTree();
    }, [currentCategory]);

    const toggleExpand = (slug) => {
        const newExpanded = new Set(expandedNodes);
        newExpanded.has(slug) ? newExpanded.delete(slug) : newExpanded.add(slug);
        setExpandedNodes(newExpanded);
    };

    const renderCategoryTree = (cats, depth = 0) => {
        return cats.map(cat => {
            const hasChildren = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = expandedNodes.has(cat.slug);
            const isSelected = parentCategory === cat.slug;
            const indent = '— '.repeat(depth);
            return (
                <div key={cat.slug} className="category-tree-item">
                    <div className="category-row">
                        <button 
                            className={`category-btn suggest-tree-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => setParentCategory(cat.slug)}
                            style={{ paddingLeft: `${depth * 20 + 12}px` }}
                        >
                            <span>{indent}{cat.icon || '📁'} {cat.name}</span>
                            <span className="count">({cat.count || 0})</span>
                        </button>
                        {hasChildren && (
                            <button className="expand-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(cat.slug); }}>
                                {isExpanded ? '▼' : '▶'}
                            </button>
                        )}
                    </div>
                    {hasChildren && isExpanded && (
                        <div className="subcategory-container">
                            {renderCategoryTree(cat.subcategories, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const submitSuggestion = async (name, desc, category) => {
        if (!validToken) {
            setNeedsLogin(true);
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('/api/shop/categories/suggest', {
                parentCategory: category,
                suggestedName: name,
                description: desc
            }, {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            
            if (response.data.success) {
                setSubmitted(true);
                setSuggestedName('');
                setDescription('');
            }
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setValidToken(null);
                setNeedsLogin(true);
                setError('Your session has expired. Please log in again.');
            } else {
                setError(err.response?.data?.error || 'Failed to submit suggestion');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validToken || needsLogin) {
            setNeedsLogin(true);
            return;
        }
        
        if (!parentCategory) {
            setError('Please select a parent category from the tree below.');
            return;
        }
        
        await submitSuggestion(suggestedName, description, parentCategory);
    };

    const handleLogin = () => {
        const returnPath = window.location.pathname + window.location.search + window.location.hash;
        sessionStorage.setItem('shopReturnPath', returnPath);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const loginPath = window.location.hostname === 'shop.heavenslive.com' 
            ? '/login'
            : '/shop/login';
        window.location.href = loginPath;
    };

    const handleLogoutAndRetry = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setValidToken(null);
        setNeedsLogin(true);
        setError('');
    };

    if (validating) {
        return (
            <div className="category-suggest">
                <h4>Suggest a Category</h4>
                <p className="loading-message">Validating session...</p>
            </div>
        );
    }

    if (needsLogin) {
        return (
            <div className="category-suggest">
                <h4>🔐 Login Required</h4>
                <p className="login-message">Please log in to suggest a category.</p>
                <div className="suggest-actions">
                    <button onClick={handleLogin} className="login-btn">
                        Go to Login
                    </button>
                    <button onClick={onClose} className="cancel-btn">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="category-suggest-success">
                <span>✅ Suggestion submitted for review!</span>
                <button onClick={onClose}>Close</button>
            </div>
        );
    }

    return (
        <div className="category-suggest">
            <h4>Suggest a Category</h4>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Category name"
                    value={suggestedName}
                    onChange={(e) => setSuggestedName(e.target.value)}
                    required
                    minLength={2}
                />
                <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
                <div className="form-group">
                    <label>Parent Category: <strong>{parentCategory || 'None selected'}</strong></label>
                    {loadingTree ? (
                        <div className="loading-subcategories">Loading category tree...</div>
                    ) : (
                        <div className="category-tree-scroll">
                            {renderCategoryTree(categories)}
                        </div>
                    )}
                </div>
                {error && (
                    <div className="error-message">
                        {error}
                        {error.includes('expired') && (
                            <button 
                                onClick={handleLogoutAndRetry}
                                className="retry-link"
                            >
                                Click here to log in again
                            </button>
                        )}
                    </div>
                )}
                <div className="suggest-actions">
                    <button type="submit" disabled={loading || !parentCategory}>
                        {loading ? 'Submitting...' : 'Submit for Review'}
                    </button>
                    <button type="button" onClick={onClose} className="cancel-btn">
                        Cancel
                    </button>
                </div>
                <p className="suggest-note">
                    📝 Select a parent category above, then name your suggested subcategory.
                </p>
            </form>
        </div>
    );
};

export default CategorySuggest;
