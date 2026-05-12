import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MockPurchase = ({ onPurchaseComplete }) => {
  const { token, user } = useAuth();
  const [purchaseType, setPurchaseType] = useState('donation');
  const [amount, setAmount] = useState(10);
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const purchaseTypes = [
    { id: 'donation', name: '💝 Donation', min: 10, max: 100, description: 'Support the project (TESTING)' },
    { id: 'memorabilia_set', name: '📜 Memorabilia Bill Set', amount: 100, description: 'Complete set of collectible bills (TESTING)' },
    { id: 'premium_usb', name: '💿 Premium USB Prayer Set', amount: 100, description: 'USB with prayers + healing frequencies (TESTING)' },
  ];

  const selectedType = purchaseTypes.find(t => t.id === purchaseType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: purchaseType,
          amountUsd: selectedType.amount || amount,
          shippingAddress: purchaseType !== 'donation' ? shippingAddress : null
        })
      });

      const orderData = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Simulate PayPal redirect (in testing, just show approval URL)
      setMessage(`Order created! (TESTING) PayPal approval URL: ${orderData.paypal_approval_url}`);
      
      // In testing, you can simulate successful capture
      // For demo purposes, show success after a delay
      setTimeout(() => {
        setMessage('✅ TEST PURCHASE COMPLETED - Bonus applied to wallet (TESTING ONLY)');
        if (onPurchaseComplete) onPurchaseComplete();
      }, 2000);
      
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mock-purchase">
      <div className="purchase-header">
        <h2>🛒 Purchase (TESTING ONLY)</h2>
        <div className="warning-banner">
          ⚠️ THIS IS A TESTING PURCHASE - No real money will be charged
        </div>
      </div>

      <form onSubmit={handleSubmit} className="purchase-form">
        <div className="form-group">
          <label>Purchase Type</label>
          <div className="purchase-options">
            {purchaseTypes.map(type => (
              <label key={type.id} className="purchase-option">
                <input
                  type="radio"
                  name="purchaseType"
                  value={type.id}
                  checked={purchaseType === type.id}
                  onChange={(e) => setPurchaseType(e.target.value)}
                />
                <div className="option-content">
                  <strong>{type.name}</strong>
                  <small>{type.description}</small>
                  <span className="price">
                    {type.amount ? `$${type.amount} USD` : `$${type.min}-$${type.max} USD`}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {purchaseType === 'donation' && (
          <div className="form-group">
            <label>Donation Amount (USD) - $10 to $100</label>
            <input
              type="number"
              min="10"
              max="100"
              step="10"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              className="amount-input"
            />
            <small>Donations in $10 increments up to $100</small>
          </div>
        )}

        {purchaseType !== 'donation' && (
          <div className="form-group">
            <label>Shipping Address</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
              rows="3"
              placeholder="Full address for shipping physical items"
            />
          </div>
        )}

        <div className="bonus-info">
          <h4>🎁 Bonus Information (TESTING ONLY)</h4>
          <p>
            {purchaseType === 'donation' 
              ? 'Donations support the project but do not receive bonuses.'
              : 'This purchase qualifies for bonus Credon currency according to the bonus schedule!'}
          </p>
          <div className="bonus-preview">
            <strong>Purchase #{Math.floor(Math.random() * 100) + 1} would receive:</strong>
            <code>${selectedType?.amount || amount} × ?x = ? Credon-USD bonus</code>
          </div>
        </div>

        <button type="submit" className="purchase-btn" disabled={loading}>
          {loading ? 'Processing (TESTING)...' : `Proceed to PayPal (TESTING) - $${selectedType?.amount || amount} USD`}
        </button>

        {message && (
          <div className={`purchase-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="testing-notice">
          <p>🔬 TESTING MODE: This is a simulated purchase. No actual PayPal transaction occurs in testing.</p>
          <p>In production, this would connect to PayPal sandbox.</p>
        </div>
      </form>
    </div>
  );
};

export default MockPurchase;