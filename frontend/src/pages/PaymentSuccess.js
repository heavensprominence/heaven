import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const paypalOrderId = searchParams.get('token') || searchParams.get('PayerID');
    const isMock = searchParams.get('mock') === 'true';

    console.log('Payment success page loaded:', { orderId, paypalOrderId, isMock });

    if (isMock) {
      setStatus('success');
      setMessage('✅ Test payment successful! (Mock Mode)');
      setOrderDetails({ type: 'mock', amount: searchParams.get('amount') });
      setTimeout(() => navigate('/credon?tab=wallet'), 3000);
    } else if (paypalOrderId && orderId) {
      capturePayment(orderId, paypalOrderId);
    } else if (orderId) {
      // Try to capture without PayPal order ID (for redirect from PayPal)
      capturePayment(orderId, orderId);
    } else {
      setStatus('error');
      setMessage('Missing payment information. Please contact support.');
      setTimeout(() => navigate('/credon'), 3000);
    }
  }, []);

  const capturePayment = async (orderId, paypalOrderId) => {
    try {
      console.log('Capturing payment:', { orderId, paypalOrderId });
      
      const response = await fetch(`/api/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paypalOrderId })
      });

      const data = await response.json();
      console.log('Capture response:', data);

      if (response.ok) {
        setStatus('success');
        setMessage('✅ Payment successful! Your order has been confirmed.');
        setOrderDetails(data.order);
        setTimeout(() => navigate('/credon?tab=wallet'), 4000);
      } else {
        setStatus('error');
        setMessage(`❌ Payment failed: ${data.error || 'Unknown error'}`);
        setTimeout(() => navigate('/credon'), 3000);
      }
    } catch (error) {
      console.error('Capture error:', error);
      setStatus('error');
      setMessage('❌ Error processing payment. Please contact support.');
      setTimeout(() => navigate('/credon'), 3000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div className="auth-header">
          <h1>🏦 Payment Status</h1>
        </div>
        
        {status === 'processing' && (
          <>
            <div style={{ fontSize: '3rem', margin: '20px 0' }}>⏳</div>
            <p>Processing your payment...</p>
            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Please wait, do not close this window.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', margin: '20px 0' }}>✅</div>
            <p style={{ color: '#00ff88', fontSize: '1.2rem' }}>{message}</p>
            {orderDetails && (
              <div style={{ background: '#00ff8820', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                <p><strong>Order ID:</strong> {orderDetails.id}</p>
                <p><strong>Type:</strong> {orderDetails.type === 'donation' ? '💝 Donation' : orderDetails.type === 'memorabilia_set' ? '📜 Memorabilia Set' : '💿 Premium USB'}</p>
                <p><strong>Amount:</strong> ${orderDetails.amount_usd} USD</p>
                {orderDetails.type !== 'donation' && (
                  <p><strong>Shipping:</strong> You will receive tracking via email</p>
                )}
              </div>
            )}
            <p style={{ marginTop: '20px' }}>Redirecting to wallet...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', margin: '20px 0' }}>❌</div>
            <p style={{ color: '#ff8888' }}>{message}</p>
            <p>Redirecting to dashboard...</p>
          </>
        )}
        
        <div className="auth-disclaimer" style={{ marginTop: '30px' }}>
          <p>⚠️ TESTING SYSTEM ONLY - Real payments are processed via PayPal</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
