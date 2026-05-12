import React, { useState, useEffect } from 'react';

const DisputeCenter = ({ token, user }) => {
  const [disputes, setDisputes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/disputes/my-disputes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDisputes(data.disputes || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDispute = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          transactionId: transactionId || null
        })
      });

      if (response.ok) {
        alert('Dispute filed successfully. You will receive updates via email.');
        setShowForm(false);
        setTitle('');
        setDescription('');
        setTransactionId('');
        fetchDisputes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to file dispute');
      }
    } catch (error) {
      console.error('Create dispute error:', error);
      alert('Failed to file dispute');
    }
  };

  const addNote = async (disputeId, note) => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });

      if (response.ok) {
        alert('Note added');
        fetchDisputes();
      }
    } catch (error) {
      console.error('Add note error:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: <span className="status-badge open">🟡 Open</span>,
      investigating: <span className="status-badge investigating">🔍 Investigating</span>,
      resolved: <span className="status-badge resolved">✅ Resolved</span>,
      closed: <span className="status-badge closed">🔒 Closed</span>
    };
    return badges[status] || <span>{status}</span>;
  };

  return (
    <div className="dispute-center">
      <div className="dispute-header">
        <h2>⚖️ Dispute Resolution Center</h2>
        <p>
          If you believe there has been an error, fraud, or mistake in any transaction,
          you can file a dispute here. Our team will investigate and resolve the issue.
        </p>
      </div>

      <div className="dispute-actions">
        <button className="new-dispute-btn" onClick={() => setShowForm(true)}>
          + File New Dispute
        </button>
      </div>

      {showForm && (
        <div className="dispute-form-modal">
          <div className="dispute-form">
            <h3>File a Dispute</h3>
            <form onSubmit={createDispute}>
              <div className="form-group">
                <label>Dispute Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div className="form-group">
                <label>Transaction ID (if applicable)</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g., tx_abc123"
                />
              </div>

              <div className="form-group">
                <label>Detailed Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows="5"
                  placeholder="Please provide as much detail as possible about the issue..."
                />
              </div>

              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  File Dispute
                </button>
              </div>
            </form>
            <p className="testing-note">⚠️ TESTING ONLY: Dispute resolution is simulated for testing.</p>
          </div>
        </div>
      )}

      <div className="disputes-list">
        <h3>Your Disputes</h3>
        {loading ? (
          <p>Loading disputes...</p>
        ) : disputes.length === 0 ? (
          <div className="no-disputes">
            <p>You have no active disputes.</p>
            <p className="info-text">If you experience any issues with transactions, file a dispute above.</p>
          </div>
        ) : (
          disputes.map(dispute => (
            <div key={dispute.id} className="dispute-card">
              <div className="dispute-header-row">
                <h4>{dispute.title}</h4>
                {getStatusBadge(dispute.status)}
              </div>
              <div className="dispute-date">
                Filed: {new Date(dispute.created_at).toLocaleString()}
              </div>
              <div className="dispute-description">
                <strong>Description:</strong> {dispute.description}
              </div>
              {dispute.resolution_notes && (
                <div className="dispute-resolution">
                  <strong>Resolution Notes:</strong> {dispute.resolution_notes}
                </div>
              )}
              {dispute.status !== 'closed' && (
                <button 
                  className="add-note-btn"
                  onClick={() => {
                    const note = prompt('Add a note to this dispute:');
                    if (note) addNote(dispute.id, note);
                  }}
                >
                  + Add Note
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="dispute-info">
        <h4>📋 Dispute Process</h4>
        <ol>
          <li>File a dispute with details of the issue</li>
          <li>Our team will investigate within 2-3 business days</li>
          <li>You may be contacted via WhatsApp for additional information</li>
          <li>Resolution may include transaction reversal (for verified errors)</li>
          <li>All decisions are final and documented</li>
        </ol>
        <p className="warning">⚠️ TESTING ONLY: Dispute resolution is simulated for testing purposes.</p>
      </div>
    </div>
  );
};

export default DisputeCenter;