import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategorySuggestions = ({ token: propToken }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [displayName, setDisplayName] = useState('');
    const [icon, setIcon] = useState('📦');
    const [rejectReason, setRejectReason] = useState('');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Get token from prop or localStorage
    const token = propToken || localStorage.getItem('token');
    
    console.log('CategorySuggestions mounted, token exists:', !!token);

    useEffect(() => {
        if (token) {
            console.log('Fetching suggestions with token...');
            fetchSuggestions();
        } else {
            console.log('No token found');
            setError('No authentication token found. Please log in again.');
            setLoading(false);
        }
    }, [token]);

    const fetchSuggestions = async () => {
        setLoading(true);
        setError('');
        
        try {
            console.log('Making request to /api/shop/categories/suggestions/pending');
            const res = await axios.get('/api/shop/categories/suggestions/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Response received:', res.data);
            setSuggestions(res.data.suggestions || []);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            console.error('Response status:', err.response?.status);
            console.error('Response data:', err.response?.data);
            if (err.response?.status === 401) {
                setError('Your session has expired. Please log out and log in again.');
            } else if (err.response?.status === 403) {
                setError('You do not have admin access to view category suggestions.');
            } else {
                setError('Failed to load suggestions: ' + (err.response?.data?.error || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await axios.post(`/api/shop/categories/suggestions/${selectedSuggestion}/approve`, {
                displayName,
                icon
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowApproveModal(false);
            setSelectedSuggestion(null);
            setDisplayName('');
            setIcon('📦');
            fetchSuggestions();
        } catch (err) {
            alert('Failed to approve: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleReject = async () => {
        try {
            await axios.post(`/api/shop/categories/suggestions/${selectedSuggestion}/reject`, {
                reason: rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowRejectModal(false);
            setSelectedSuggestion(null);
            setRejectReason('');
            fetchSuggestions();
        } catch (err) {
            alert('Failed to reject: ' + (err.response?.data?.error || err.message));
        }
    };

    const icons = ['📦', '📱', '👕', '🏠', '🏆', '🚗', '🛠️', '💎', '🎮', '📚', '🎵', '🐾', '🌿', '🍔', '💄'];

    if (loading) return <div className="loading-message">Loading suggestions...</div>;
    
    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">❌ {error}</p>
                <button onClick={() => window.location.href = '/shop/login'} className="retry-btn">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="category-suggestions">
            <h2>Category Suggestions</h2>
            
            {suggestions.length === 0 ? (
                <p className="empty-message">No pending category suggestions.</p>
            ) : (
                <table className="suggestions-table">
                    <thead>
                        <tr>
                            <th>Suggested Name</th>
                            <th>Parent Category</th>
                            <th>Description</th>
                            <th>Suggested By</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suggestions.map(s => (
                            <tr key={s.id}>
                                <td><strong>{s.suggested_name}</strong></td>
                                <td>{s.parent_category || '—'}</td>
                                <td>{s.description || '—'}</td>
                                <td>{s.user_email || 'Anonymous'}</td>
                                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="approve-btn"
                                        onClick={() => {
                                            setSelectedSuggestion(s.id);
                                            setDisplayName(s.suggested_name);
                                            setShowApproveModal(true);
                                        }}
                                    >
                                        ✅ Approve
                                    </button>
                                    <button 
                                        className="reject-btn"
                                        onClick={() => {
                                            setSelectedSuggestion(s.id);
                                            setShowRejectModal(true);
                                        }}
                                    >
                                        ❌ Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showApproveModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Approve Category</h3>
                        <div className="form-group">
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Icon</label>
                            <div className="icon-selector">
                                {icons.map(i => (
                                    <button
                                        key={i}
                                        className={`icon-btn ${icon === i ? 'active' : ''}`}
                                        onClick={() => setIcon(i)}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleApprove} className="confirm-btn">Approve</button>
                            <button onClick={() => setShowApproveModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Reject Suggestion</h3>
                        <textarea
                            placeholder="Reason for rejection (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button onClick={handleReject} className="confirm-btn">Reject</button>
                            <button onClick={() => setShowRejectModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategorySuggestions;
