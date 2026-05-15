import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PurchaseSection = ({ onPurchaseComplete }) => {
  const { token } = useAuth();
  const [purchaseType, setPurchaseType] = useState('donation');
  const [donationAmount, setDonationAmount] = useState(10);
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPayPal, setShowPayPal] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');

  const donationOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const handlePurchase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setShowPayPal(false);

    let amount = 0;
    let type = purchaseType;
    
    if (purchaseType === 'donation') {
      amount = donationAmount;
    } else if (purchaseType === 'memorabilia') {
      amount = 100;
      type = 'memorabilia_set';
    } else if (purchaseType === 'premium_usb') {
      amount = 100;
      type = 'premium_usb';
    }

    try {
      // Create order with real payment flag
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: type,
          amountUsd: amount,
          shippingAddress: purchaseType !== 'donation' ? shippingAddress : null,
          realPayment: true  // This indicates it's a real money transaction
        })
      });

      const orderData = await response.json();
      
      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Show PayPal button/link for real payment
      if (orderData.paypal_approval_url) {
        setPaypalUrl(orderData.paypal_approval_url);
        setShowPayPal(true);
        setMessage('✅ Order created! Click the PayPal button to complete your payment.');
      } else {
        setMessage('❌ Failed to get payment link');
      }
      
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalRedirect = () => {
    window.open(paypalUrl, '_blank');
    setMessage('Payment window opened. Complete payment to finalize your purchase.');
  };

  return (
    <div className="purchase-section" style={{ 
      background: 'linear-gradient(135deg, #1a2a6c, #0b1f3f)',
      borderRadius: '20px',
      padding: '25px',
      marginTop: '30px',
      border: '2px solid #ffd700'
    }}>
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>💝 Support the Mission (Real USD)</h3>
      <p style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '15px' }}>
        These are real financial transactions to support the project. 
        You will be redirected to PayPal to complete payment securely.
      </p>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="radio" name="purchase" value="donation" checked={purchaseType === 'donation'} onChange={() => { setPurchaseType('donation'); setShowPayPal(false); }} />
          <span>💝 Donation ($10-$100)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="radio" name="purchase" value="memorabilia" checked={purchaseType === 'memorabilia'} onChange={() => { setPurchaseType('memorabilia'); setShowPayPal(false); }} />
          <span>📜 Collectible Bill Set ($100)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="radio" name="purchase" value="premium_usb" checked={purchaseType === 'premium_usb'} onChange={() => { setPurchaseType('premium_usb'); setShowPayPal(false); }} />
          <span>💿 Premium Prayers + Frequencies on USB ($100)</span>
        </label>
      </div>

      <form onSubmit={handlePurchase}>
        {purchaseType === 'donation' && (
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Donation Amount (USD):</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {donationOptions.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setDonationAmount(amount)}
                  style={{
                    background: donationAmount === amount ? '#ffd700' : 'rgba(255,255,255,0.1)',
                    color: donationAmount === amount ? '#0b1f3f' : '#fff',
                    border: '1px solid #ffd700',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>
        )}

        {(purchaseType === 'memorabilia' || purchaseType === 'premium_usb') && (
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Shipping Address:</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
              rows="3"
              placeholder="Full address for shipping"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid #ffd700',
                borderRadius: '8px',
                color: 'white',
                marginTop: '8px'
              }}
            />
          </div>
        )}

        <div style={{ background: '#ffd70020', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {purchaseType === 'donation' && '💝 Donations support the project and help with regulatory fees. This is a REAL financial transaction.'}
            {purchaseType === 'memorabilia' && '📜 You will receive a complete set of collectible Credon bills (physical memorabilia). REAL payment required.'}
            {purchaseType === 'premium_usb' && '💿 USB drive with the most updated prayer and healing frequencies. REAL payment required.'}
          </p>
          <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#ffaa00' }}>
            ⚠️ REAL MONEY TRANSACTION - You will be charged in USD via PayPal
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            background: '#0070ba',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '30px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Creating Order...' : `💳 Proceed with PayPal - $${purchaseType === 'donation' ? donationAmount : '100'} USD`}
        </button>

        {showPayPal && (
          <button 
            onClick={handlePayPalRedirect}
            style={{
              background: '#ffd700',
              color: '#0b1f3f',
              border: 'none',
              padding: '14px',
              borderRadius: '30px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              marginTop: '10px'
            }}
          >
            💳 Pay with PayPal (Real Money)
          </button>
        )}

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

        <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '15px', color: '#aaa' }}>
          💳 Secure payment via PayPal. Your payment information is never stored on our servers.
        </p>
      </form>
    </div>
  );
};

export default PurchaseSection;
