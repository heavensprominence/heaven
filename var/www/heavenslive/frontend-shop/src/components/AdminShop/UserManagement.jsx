import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = ({ token, isSuperAdmin }) => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspendDays, setSuspendDays] = useState('');
    const [suspendReason, setSuspendReason] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line
    }, [page, search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/shop/admin/users?page=${page}&limit=20&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users);
            setTotalPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit));
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async () => {
        try {
            await axios.post(`/api/shop/admin/users/${selectedUser}/suspend`, 
                { duration_days: parseInt(suspendDays) || null, reason: suspendReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowSuspendModal(false);
            setSuspendDays('');
            setSuspendReason('');
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            alert('Failed to suspend: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleUnsuspend = async (userId) => {
        try {
            await axios.post(`/api/shop/admin/users/${userId}/unsuspend`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert('Failed to unsuspend: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleBan = async (userId) => {
        const reason = prompt('Reason for permanent ban:');
        if (!reason) return;
        
        try {
            await axios.post(`/api/shop/admin/users/${userId}/ban`, 
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchUsers();
        } catch (err) {
            alert('Failed to ban: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="user-management">
            <h1>User Management</h1>
            
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button onClick={fetchUsers}>🔍 Search</button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Name</th>
                                    <th>Listings</th>
                                    <th>Sales</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className={user.is_suspended ? 'suspended' : ''}>
                                        <td>{user.email}</td>
                                        <td>{user.full_name || '—'}</td>
                                        <td>{user.listing_count || 0}</td>
                                        <td>{user.sales_count || 0}</td>
                                        <td>
                                            {user.is_suspended ? (
                                                <span className="status-badge suspended">
                                                    {user.suspension_end_date 
                                                        ? `Suspended until ${new Date(user.suspension_end_date).toLocaleDateString()}`
                                                        : '🔴 Banned'}
                                                </span>
                                            ) : (
                                                <span className="status-badge active">✅ Active</span>
                                            )}
                                        </td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="actions">
                                            {user.is_suspended ? (
                                                <button 
                                                    className="unsuspend-btn"
                                                    onClick={() => handleUnsuspend(user.id)}
                                                >
                                                    ↻ Unsuspend
                                                </button>
                                            ) : (
                                                <>
                                                    <button 
                                                        className="suspend-btn"
                                                        onClick={() => {
                                                            setSelectedUser(user.id);
                                                            setShowSuspendModal(true);
                                                        }}
                                                    >
                                                        ⏸ Suspend
                                                    </button>
                                                    {isSuperAdmin && (
                                                        <button 
                                                            className="ban-btn"
                                                            onClick={() => handleBan(user.id)}
                                                        >
                                                            🚫 Ban
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
                            <span>{page} / {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                        </div>
                    )}
                </>
            )}

            {showSuspendModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Suspend User</h3>
                        <input
                            type="number"
                            placeholder="Days (leave empty for indefinite)"
                            value={suspendDays}
                            onChange={(e) => setSuspendDays(e.target.value)}
                            min="1"
                        />
                        <textarea
                            placeholder="Reason for suspension"
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            rows={3}
                        />
                        <div className="modal-actions">
                            <button onClick={handleSuspend} className="confirm-btn">Confirm</button>
                            <button onClick={() => setShowSuspendModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
