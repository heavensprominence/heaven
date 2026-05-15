import React, { useState, useEffect } from 'react';

const LedgerDisplay = ({ token }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const response = await fetch('/api/wallet/ledger?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading ledger...</div>;

  return (
    <div className="ledger-display">
      <div className="ledger-table-container">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>User</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="5">No transactions found</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                  <td>{tx.type}</td>
                  <td>{tx.user_display || 'REDACTED'}</td>
                  <td className={tx.amount_cents >= 0 ? 'positive' : 'negative'}>
                    {tx.amount_cents >= 0 ? '+' : ''}${(Math.abs(tx.amount_cents) / 100).toFixed(2)}
                  </td>
                  <td>{tx.description || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerDisplay;
