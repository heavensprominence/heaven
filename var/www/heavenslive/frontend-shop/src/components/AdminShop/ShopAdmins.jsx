import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShopAdmins = ({ token }) => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('moderator');
    const [permissions, setPermissions] = useState({
        approve_listings: true,
        manage_disputes: true,
        suspend_users: false,
        adjust_fees: false,
        view_analytics: true
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('/api/shop/admin/admins', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmins(res.data.admins);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async () => {
        try {
            await axios.post('/api/shop/admin/admins', {
                email: newAdminEmail,
                role: newAdminRole,
                permissions
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddModal(false);
            setNewAdminEmail('');
            fetchAdmins();
        } catch (err) {
            alert('Failed to add admin: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleRemoveAdmin = async (userId) => {
        if (!window.confirm('Remove this shop admin?')) return;
        
        try {
            await axios.delete(`/api/shop/admin/admins/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdmins();
        } catch (err) {
            alert('Failed to remove: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="shop-admins">
            <div className="section-header">
                <h1>Shop Administrators</h1>
                <button className="add-btn" onClick={() => setShowAddModal(true)}>
                    ➕ Add Admin
                </button>
            </div>
            
            <div className="admins-list">
                {admins.length === 0 ? (
                    <p className="empty-message">No shop admins configured yet.</p>
                ) : (
                    <table className="admins-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Added</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin.id}>
                                    <td>{admin.email}</td>
                                    <td>{admin.full_name || '—'}</td>
                                    <td>
                                        <span className={`role-badge ${admin.role}`}>
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button 
                                            className="remove-btn"
                                            onClick={() => handleRemoveAdmin(admin.user_id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal large">
                        <h3>Add Shop Administrator</h3>
                        
                        <div className="form-group">
                            <label>User Email</label>
                            <input
                                type="email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                placeholder="user@example.com"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Role</label>
                            <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)}>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Permissions</label>
                            <div className="permissions-grid">
                                {Object.keys(permissions).map(perm => (
                                    <label key={perm} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={permissions[perm]}
                                            onChange={(e) => setPermissions({
                                                ...permissions,
                                                [perm]: e.target.checked
                                            })}
                                        />
                                        {perm.replace(/_/g, ' ')}
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="modal-actions">
                            <button onClick={handleAddAdmin} className="confirm-btn">Add Admin</button>
                            <button onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopAdmins;
