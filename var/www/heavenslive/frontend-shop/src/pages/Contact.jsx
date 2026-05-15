import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Contact.css';

const Contact = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', category: 'general', message: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const categories = [
        { value: 'general', label: 'General Inquiry' }, { value: 'account', label: 'Account Issues' },
        { value: 'listing', label: 'Listing Help' }, { value: 'payment', label: 'Payment Issues' },
        { value: 'shipping', label: 'Shipping Questions' }, { value: 'dispute', label: 'Dispute Resolution' },
        { value: 'enterprise', label: 'Enterprise Sales' }
    ];
    const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); setError('');
        try { await axios.post('/api/shop/contact', formData); setSuccess('Message sent!'); }
        catch (err) { setError(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
    };
    return (
        <div className="contact-page"><h1>📧 {t('nav.contact')}</h1><Link to="/" className="back-link">← {t('nav.shop')}</Link>
            {success ? <div className="success-message">{success}</div> : (
                <form onSubmit={handleSubmit} className="contact-form">
                    {error && <div className="error-message">{error}</div>}
                    <div className="form-group"><label>{t('profile.fullName')}</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                    <div className="form-group"><label>{t('auth.email')}</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
                    <div className="form-group"><label>Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>{categories.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}</select></div>
                    <div className="form-group"><label>Subject</label><input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required /></div>
                    <div className="form-group"><label>{t('createListing.description')}</label><textarea rows="5" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required /></div>
                    <button type="submit" disabled={loading}>{loading ? t('common.processing') : t('common.submit')}</button>
                </form>
            )}
        </div>
    );
};
export default Contact;
