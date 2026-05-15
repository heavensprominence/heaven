import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './FileDispute.css';

const FileDispute = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const purchaseId = searchParams.get('purchaseId');
    
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        purchaseId: purchaseId || '',
        disputeType: 'item_not_received',
        title: '',
        description: '',
        desiredResolution: 'refund'
    });

    useEffect(() => {
        fetchEligiblePurchases();
    }, []);

    const fetchEligiblePurchases = async () => {
        try {
            // Get both buyer and seller purchases
            const res = await axios.get('/api/shop/purchases/eligible-for-dispute', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPurchases(res.data.purchases || []);
            if (!purchaseId && res.data.purchases?.length > 0) {
                setFormData(f => ({ ...f, purchaseId: res.data.purchases[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch purchases:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedPurchase = purchases.find(p => p.id === formData.purchaseId);
        if (!selectedPurchase) {
            alert('Please select a valid purchase');
            return;
        }
        
        setSubmitting(true);
        try {
            await axios.post('/api/shop/disputes', {
                purchaseId: formData.purchaseId,
                listingId: selectedPurchase.listing_id,
                filedAgainst: selectedPurchase.other_party_id,
                ...formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Dispute filed successfully. An administrator will review your case.');
            navigate('/disputes');
        } catch (err) {
            alert('Failed to file dispute: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="file-dispute">
            <h1>File a Dispute</h1>
                <Link to="/disputes" className="back-link">← Back to Disputes</Link>
            
            <form onSubmit={handleSubmit} className="dispute-form">
                <div className="form-group">
                    <label>Select Transaction *</label>
                    <select value={formData.purchaseId} onChange={(e) => setFormData({...formData, purchaseId: e.target.value})} required>
                        <option value="">-- Select a transaction --</option>
                        {purchases.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.title} - ${(p.amount_cents/100).toFixed(2)} with {p.other_party_name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label>Dispute Type *</label>
                    <select value={formData.disputeType} onChange={(e) => setFormData({...formData, disputeType: e.target.value})}>
                        <option value="item_not_received">Item Not Received</option>
                        <option value="item_not_as_described">Item Not As Described</option>
                        <option value="damaged">Item Damaged</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label>Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                
                <div className="form-group">
                    <label>Description *</label>
                    <textarea rows="5" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                </div>
                
                <div className="form-group">
                    <label>Desired Resolution *</label>
                    <select value={formData.desiredResolution} onChange={(e) => setFormData({...formData, desiredResolution: e.target.value})}>
                        <option value="refund">Full Refund</option>
                        <option value="partial_refund">Partial Refund</option>
                        <option value="return">Return Item</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <button type="submit" className="submit-btn" disabled={submitting || loading}>
                    {submitting ? 'Filing...' : 'File Dispute'}
                </button>
            </form>
        </div>
    );
};

export default FileDispute;
