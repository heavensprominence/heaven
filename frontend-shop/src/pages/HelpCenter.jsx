import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './HelpCenter.css';

const HelpCenter = () => {
    const { t } = useTranslation();
    const [articles, setArticles] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { value: 'all', label: t('helpCenter.allTopics') },
        { value: 'buyer', label: t('helpCenter.forBuyers') },
        { value: 'seller', label: t('helpCenter.forSellers') },
        { value: 'shipping', label: t('helpCenter.shipping') },
        { value: 'general', label: t('helpCenter.general') }
    ];

    useEffect(() => { fetchArticles(); }, [selectedCategory]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
            const res = await axios.get(`/api/shop/support/help/articles${params}`);
            setArticles(res.data.articles || []);
        } catch (err) { console.error('Failed:', err); } finally { setLoading(false); }
    };

    const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="help-center">
            <div className="help-header">
                <h1>📚 {t('helpCenter.title')}</h1>
                <Link to="/" className="back-link">← {t('nav.shop')}</Link>
                <div className="help-search">
                    <input type="text" placeholder={t('helpCenter.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <span className="search-icon">🔍</span>
                </div>
            </div>
            <div className="help-content">
                <div className="category-filters">
                    {categories.map(cat => (
                        <button key={cat.value} className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.value)}>{cat.label}</button>
                    ))}
                </div>
                {loading ? <div className="loading">{t('common.loading')}</div> : filteredArticles.length === 0 ? (
                    <div className="empty-state"><p>{t('common.noResults')}</p><Link to="/contact" className="contact-link">{t('nav.contact')} →</Link></div>
                ) : (
                    <div className="articles-grid">
                        {filteredArticles.map(article => (
                            <Link to={`/help/article/${article.slug}`} key={article.id} className="article-card"><h3>{article.title}</h3><span className="article-category">{article.category}</span></Link>
                        ))}
                    </div>
                )}
                <div className="contact-section">
                    <h2>{t('helpCenter.stillNeedHelp')}</h2>
                    <p>{t('helpCenter.cantFind')}</p>
                    <Link to="/contact" className="contact-btn">{t('nav.contact')}</Link>
                </div>
            </div>
        </div>
    );
};
export default HelpCenter;
