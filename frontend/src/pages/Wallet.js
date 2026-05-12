import React, { useState, useEffect } from 'react';
import PurchaseSection from '../components/PurchaseSection';
import MockPurchaseSection from '../components/MockPurchaseSection';

const Wallet = ({ walletData, fetchWalletData }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet/transactions?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    try {
      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail,
          amount: parseFloat(sendAmount) * 100,
          currency: 'Credon-USD'
        })
      });

      if (response.ok) {
        alert('Transfer completed (TESTING ONLY)');
        setSendModal(false);
        setRecipientEmail('');
        setSendAmount('');
        setConfirmStep(false);
        if (fetchWalletData) fetchWalletData();
        fetchTransactions();
      } else {
        const error = await response.json();
        alert(error.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Send error:', error);
      alert('Failed to send');
    }
  };

  const handleRequest = async () => {
    try {
      const response = await fetch('/api/wallet/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fromEmail: recipientEmail,
          amount: parseFloat(sendAmount) * 100,
          currency: 'Credon-USD'
        })
      });

      if (response.ok) {
        alert('Payment request sent (TESTING ONLY)');
        setRequestModal(false);
        setRecipientEmail('');
        setSendAmount('');
      } else {
        const error = await response.json();
        alert(error.error || 'Request failed');
      }
    } catch (error) {
      console.error('Request error:', error);
      alert('Failed to send request');
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-actions">
        <button className="action-btn send" onClick={() => setSendModal(true)}>
          📤 Send Credon
        </button>
        <button className="action-btn request" onClick={() => setRequestModal(true)}>
          📥 Request Payment
        </button>
      </div>

      <PurchaseSection onPurchaseComplete={() => { if (fetchWalletData) fetchWalletData(); fetchTransactions(); }} />
      <MockPurchaseSection onPurchaseComplete={() => { if (fetchWalletData) fetchWalletData(); fetchTransactions(); }} />

      <div className="transaction-history">
        <h3>Transaction History</h3>
        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet.</p>
        ) : (
          <div className="transactions-list">
            {transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-details">
                  <div className="tx-type">{tx.type}</div>
                  <div className="tx-date">{new Date(tx.created_at).toLocaleString()}</div>
                  {tx.description && <div className="tx-desc">{tx.description}</div>}
                </div>
                <div className={`tx-amount ${tx.amount_cents >= 0 ? 'positive' : 'negative'}`}>
                  {tx.amount_cents >= 0 ? '+' : '-'}${(Math.abs(tx.amount_cents) / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Modal */}
      {sendModal && (
        <div className="modal-overlay" onClick={() => { setSendModal(false); setConfirmStep(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{confirmStep ? 'Confirm Transfer' : 'Send Credon Currency'}</h3>
            {confirmStep ? (
              <>
                <p>Send to: {recipientEmail}</p>
                <p>Amount: ${parseFloat(sendAmount).toFixed(2)} Credon-USD</p>
                <div className="modal-buttons">
                  <button className="back-btn" onClick={() => setConfirmStep(false)}>Back</button>
                  <button className="confirm-btn" onClick={handleSend}>Confirm</button>
                </div>
              </>
            ) : (
              <>
                <input type="email" placeholder="Recipient Email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
                <input type="number" placeholder="Amount (Credon-USD)" value={sendAmount} onChange={e => setSendAmount(e.target.value)} />
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={() => setSendModal(false)}>Cancel</button>
                  <button className="next-btn" onClick={handleSend}>Next</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {requestModal && (
        <div className="modal-overlay" onClick={() => setRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Request Payment</h3>
            <input type="email" placeholder="Request From (Email)" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
            <input type="number" placeholder="Amount (Credon-USD)" value={sendAmount} onChange={e => setSendAmount(e.target.value)} />
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setRequestModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={handleRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
