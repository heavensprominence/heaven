import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FeeManagement = ({ token }) => {
    const [feePercent, setFeePercent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tempFee, setTempFee] = useState(0);

    useEffect(() => {
        fetchCurrentFee();
    }, []);

    const fetchCurrentFee = async () => {
        try {
            const res = await axios.get('/api/shop/admin/settings/fees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeePercent(res.data.fee_percent);
            setTempFee(res.data.fee_percent);
        } catch (err) {
            console.error('Failed to fetch fee:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post('/api/shop/admin/settings/fees', 
                { fee_percent: parseFloat(tempFee) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFeePercent(tempFee);
            alert('Platform fee updated successfully!');
        } catch (err) {
            alert('Failed to update: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="fee-management">
            <h1>Platform Fee Management</h1>
            
            <div className="fee-card">
                <div className="current-fee">
                    <h2>Current Platform Fee</h2>
                    <div className="fee-display">{feePercent}%</div>
                </div>
                
                <div className="fee-adjustment">
                    <h3>Adjust Fee</h3>
                    <p className="fee-note">Fee applies to all transactions. Currently set to 0% (free).</p>
                    
                    <div className="slider-container">
                        <input
                            type="range"
                            min="0"
                            max="20"
                            step="0.5"
                            value={tempFee}
                            onChange={(e) => setTempFee(e.target.value)}
                        />
                        <div className="fee-value">{tempFee}%</div>
                    </div>
                    
                    <div className="fee-examples">
                        <h4>Example:</h4>
                        <p>$100 sale → Platform fee: ${((100 * tempFee) / 100).toFixed(2)}</p>
                        <p>$1000 sale → Platform fee: ${((1000 * tempFee) / 100).toFixed(2)}</p>
                    </div>
                    
                    <button 
                        className="save-btn"
                        onClick={handleSave}
                        disabled={saving || tempFee === feePercent}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;
