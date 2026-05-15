import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CredonGoLive = ({ token, isSuperAdmin }) => {
    const [credonEnabled, setCredonEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/shop/admin/settings/credon', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCredonEnabled(res.data.credon_enabled);
        } catch (err) {
            console.error('Failed to fetch Credon status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        if (!isSuperAdmin) {
            alert('Only super admin can toggle Credon Go Live');
            return;
        }
        
        setToggling(true);
        try {
            const res = await axios.post('/api/shop/admin/settings/credon/toggle', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCredonEnabled(res.data.credon_enabled);
        } catch (err) {
            alert('Failed to toggle: ' + (err.response?.data?.error || err.message));
        } finally {
            setToggling(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="credon-go-live">
            <h1>🚀 Credon Go Live</h1>
            
            <div className="credon-status-card">
                <div className={`status-indicator ${credonEnabled ? 'live' : 'offline'}`}>
                    <div className="status-dot"></div>
                    <span className="status-text">
                        {credonEnabled ? 'CREDON IS LIVE' : 'CREDON IS OFFLINE'}
                    </span>
                </div>
                
                <p className="status-description">
                    {credonEnabled 
                        ? 'Credon currency payments are currently ENABLED on the platform.'
                        : 'Credon currency payments are currently DISABLED. Enable only after regulatory approval.'}
                </p>
                
                {isSuperAdmin ? (
                    <button 
                        className={`toggle-btn ${credonEnabled ? 'danger' : 'success'}`}
                        onClick={handleToggle}
                        disabled={toggling}
                    >
                        {toggling 
                            ? 'Processing...' 
                            : credonEnabled 
                                ? '🔴 Disable Credon Payments' 
                                : '🟢 Enable Credon Payments'}
                    </button>
                ) : (
                    <p className="permission-note">
                        ⚠️ Only Super Admin can toggle Credon Go Live status.
                    </p>
                )}
                
                <div className="warning-box">
                    <h4>⚠️ Regulatory Notice</h4>
                    <p>Credon currency is currently in testing phase. The "Go Live" button should only be activated after receiving proper regulatory approval for clone currency operations.</p>
                </div>
            </div>
        </div>
    );
};

export default CredonGoLive;
