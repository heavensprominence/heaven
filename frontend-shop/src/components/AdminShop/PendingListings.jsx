import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PendingListings = ({ token, onUpdate }) => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedListing, setSelectedListing] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchListings();
    }, [page]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/shop/admin/listings/pending?page=${page}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListings(res.data.listings);
            setTotalPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit));
        } catch (err) {
            console.error('Failed to fetch listings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.post(`/api/shop/admin/listings/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchListings();
            onUpdate();
        } catch (err) {
            alert('Failed to approve: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleReject = async () => {
        try {
            await axios.post(`/api/shop/admin/listings/${selectedListing}/reject`, 
                { reason: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedListing(null);
            fetchListings();
            onUpdate();
        } catch (err) {
            alert('Failed to reject: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading && listings.length === 0) {
        return <div className="pending-loading">Loading pending listings...</div>;
    }

    return (
        <div className="pending-listings">
            <h1>Pending Listings Approval</h1>
            
            {listings.length === 0 ? (
                <div className="empty-state">
                    <p>✅ No pending listings to approve!</p>
                </div>
            ) : (
                <>
                    <div className="listings-table-container">
                        <table className="listings-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Title</th>
                                    <th>Seller</th>
                                    <th>Price</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map(listing => (
                                    <tr key={listing.id}>
                                        <td>
                                            <span className={`type-badge ${listing.type}`}>
                                                {listing.type}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/listing/${listing.id}`} target="_blank" style={{ color: '#ffd700', textDecoration: 'none' }}>
                                                {listing.title}
                                            </Link>
                                        </td>
                                        <td>{listing.seller_email}</td>
                                        <td>
                                            {listing.price_cents 
                                                ? `$${(listing.price_cents / 100).toFixed(2)}`
                                                : listing.min_bid_cents 
                                                    ? `From $${(listing.min_bid_cents / 100).toFixed(2)}`
                                                    : 'Free'}
                                        </td>
                                        <td>{new Date(listing.created_at).toLocaleDateString()}</td>
                                        <td className="actions">
                                            <Link to={`/listing/${listing.id}`} target="_blank" className="view-btn">
                                                👁️ View
                                            </Link>
                                            <button 
                                                className="approve-btn"
                                                onClick={() => handleApprove(listing.id)}
                                            >
                                                ✅ Approve
                                            </button>
                                            <button 
                                                className="reject-btn"
                                                onClick={() => {
                                                    setSelectedListing(listing.id);
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
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                ← Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button 
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Reject Listing</h3>
                        <textarea
                            placeholder="Reason for rejection (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button onClick={handleReject} className="confirm-btn">Confirm Reject</button>
                            <button onClick={() => setShowRejectModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingListings;
