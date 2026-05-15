import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MockPurchaseSection = ({ onPurchaseComplete }) => {
  const { token } = useAuth();
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMockPurchase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // This is a MOCK purchase - no real money
      const response = await fetch('/api/mock-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amountUsd: amount,
          type: 'mock_clone_purchase'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process mock purchase');
      }

      setMessage(`✅ MOCK Purchase successful! You received ${data.bonus_amount} Credon-USD as bonus!`);
      if (onPurchaseComplete) onPurchaseComplete();
      
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mock-purchase-section" style={{ 
      background: 'linear-gradient(135deg, #2a2a2a, #1a1a2a)',
      borderRadius: '20px',
      padding: '25px',
      marginTop: '30px',
      border: '1px solid #00ff88'
    }}>
      <h3 style={{ color: '#00ff88', marginBottom: '15px' }}>🎮 Purchase Credon Clone Currency (TESTING ONLY)</h3>
      <p style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '15px' }}>
        <strong>⚠️ NO REAL MONEY</strong> - This is a simulated purchase for testing the bonus system.
        No actual payment is processed. You will receive mock currency with bonuses according to the schedule.
      </p>
      
      <form onSubmit={handleMockPurchase}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Amount (USD equivalent):</label>
          <select 
            value={amount} 
            onChange={(e) => setAmount(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #00ff88',
              borderRadius: '8px',
              color: 'white',
              marginTop: '8px'
            }}
          >
            <option value={10}>$10 USD (qualifies for bonuses)</option>
            <option value={20}>$20 USD</option>
            <option value={50}>$50 USD</option>
            <option value={100}>$100 USD</option>
          </select>
        </div>

        <div style={{ background: '#00ff8820', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            🎁 You will receive bonus Credon-USD according to the bonus schedule.
            This is a SIMULATED transaction for testing the currency system.
          </p>
          <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#00ff88' }}>
            ✨ NO REAL MONEY WILL BE CHARGED ✨
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            background: '#00ff88',
            color: '#0b1f3f',
            border: 'none',
            padding: '14px',
            borderRadius: '30px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Processing Mock Purchase...' : `🎮 Simulate Purchase - $${amount} (No Real Money)`}
        </button>

        {message && (
          <div style={{ 
            marginTop: '15px', 
            padding: '12px', 
            background: message.includes('✅') ? '#00ff8820' : '#ff444420',
            borderRadius: '8px',
            color: message.includes('✅') ? '#00ff88' : '#ff8888',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default MockPurchaseSection;
