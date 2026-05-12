import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoanRequest = () => {
  const { user, token } = useAuth();
  const [loanType, setLoanType] = useState('interest_free');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/loans/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: loanType,
          amount: parseFloat(amount),
          purpose
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Loan request error:', error);
      alert('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-request">
      <div className="loan-header">
        <h2>🏦 Loan Request (TESTING ONLY)</h2>
        <div className="warning-banner">
          ⚠️ THIS IS A TESTING LOAN SYSTEM - No real loans are being issued
        </div>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="loan-form">
          <div className="form-group">
            <label>Loan Type</label>
            <div className="loan-types">
              <label className="loan-option">
                <input
                  type="radio"
                  value="interest_free"
                  checked={loanType === 'interest_free'}
                  onChange={(e) => setLoanType(e.target.value)}
                />
                <div>
                  <strong>Interest-Free Loan</strong>
                  <small>0% interest, flexible repayment</small>
                </div>
              </label>
              <label className="loan-option">
                <input
                  type="radio"
                  value="interest_bearing"
                  checked={loanType === 'interest_bearing'}
                  onChange={(e) => setLoanType(e.target.value)}
                />
                <div>
                  <strong>Interest-Bearing Loan</strong>
                  <small>Rate determined during interview</small>
                </div>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Requested Amount (Credon-USD)</label>
            <input
              type="number"
              min="10"
              step="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g., 100"
            />
            <small>Minimum request: 10 Credon-USD</small>
          </div>

          <div className="form-group">
            <label>Purpose of Loan</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows="4"
              placeholder="Please describe how you intend to use the funds..."
            />
          </div>

          <div className="loan-info">
            <h4>📋 Next Steps</h4>
            <ol>
              <li>Submit this request (TESTING)</li>
              <li>Schedule a WhatsApp consultation</li>
              <li>Discussion of terms and repayment flexibility</li>
              <li>If approved, funds added to your wallet (TESTING)</li>
            </ol>
            <p className="note">
              ⚠️ TESTING ONLY: This is a simulated loan request system.
              No real loans are being issued.
            </p>
          </div>

          <button type="submit" className="submit-loan-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Loan Request (TESTING)'}
          </button>
        </form>
      ) : (
        <div className="submitted-confirmation">
          <div className="success-icon">✅</div>
          <h3>Request Submitted (TESTING)</h3>
          <p>Your loan request has been received.</p>
          <div className="next-steps">
            <h4>Next Steps:</h4>
            <p>1. You will receive an email confirmation</p>
            <p>2. Schedule a WhatsApp consultation for interview</p>
            <p>3. Terms will be discussed during the 15-minute call</p>
            <p>4. If approved, funds will be added to your wallet (TESTING)</p>
          </div>
          <button 
            className="schedule-btn"
            onClick={() => window.location.href = '/credon?tab=appointments'}
          >
            Schedule Consultation
          </button>
        </div>
      )}

      <div className="disclaimer">
        <p>⚠️ TESTING ONLY: This is a mock loan system. No real loans are being issued.</p>
        <p>Regulatory approval is being sought for future operation.</p>
      </div>
    </div>
  );
};

export default LoanRequest;