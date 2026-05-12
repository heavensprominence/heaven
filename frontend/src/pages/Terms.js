import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="terms-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '40px', border: '1px solid rgba(255,215,0,0.2)' }}>
        <h1 style={{ color: '#ffd700', marginBottom: '20px', fontSize: '2rem' }}>Terms of Use</h1>
        <p style={{ marginBottom: '20px', color: '#ccc' }}><strong>Last Updated: March 30, 2026</strong></p>
        
        <div style={{ background: '#ffd70020', padding: '15px', borderRadius: '10px', marginBottom: '30px' }}>
          <p style={{ color: '#ffd700', fontWeight: 'bold' }}>⚠️ IMPORTANT: THIS IS A TESTING SYSTEM ONLY</p>
          <p>No real currency or financial instruments are being offered. All clone currency transactions are simulated. Regulatory approval is being sought.</p>
        </div>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>1. Acceptance of Terms</h2>
        <p>By accessing or using the HeavensLive Credon Currency platform ("the Service"), you agree to be bound by these Terms of Use.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>2. Description of Service</h2>
        <p>The Service provides a testing environment for user registration, mock currency wallet management, simulated bidding system, appointment scheduling, physical memorabilia sales, and dispute resolution simulation.</p>
        <p><strong>All financial aspects of this site are for testing only and are not a promise of any service or financial instrument of any kind.</strong></p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>3. Testing Mode</h2>
        <p><strong>You acknowledge and agree that:</strong></p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>All "Credon Currency" balances are simulated with no real value</li>
          <li>No actual currency exchange occurs</li>
          <li>No real loans or interest are being provided</li>
          <li>No real financial services are being offered</li>
          <li>Credon Clone currencies have no cash value and cannot be redeemed for real currency</li>
        </ul>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>4. Physical Products</h2>
        <p><strong>Memorabilia Sets:</strong> Collectible paper notes sold as memorabilia only. $100 USD per set. Shipping via Canada Post or printing company. No refunds once shipped unless defective.</p>
        <p><strong>Premium USB:</strong> Contains prayer and healing frequency files. $100 USD. Digital content is non-refundable once shipped.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>5. Account Responsibilities</h2>
        <p>You are responsible for maintaining account security. You must provide accurate information. You may not create multiple accounts. Accounts may be suspended for violations.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>6. Prohibited Activities</h2>
        <p>You may not attempt to cash out or exchange Credon currency, use the Service for illegal activities, interfere with the operation of the Service, misrepresent your identity, or engage in harassment or abusive behavior.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>7. Appointment System</h2>
        <p>Appointments are 15-minute consultations via WhatsApp. You must add +1-647-228-1215 to your WhatsApp contacts. Cancellations must be made at least 1 hour in advance. No-shows may result in account restrictions.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>8. Dispute Resolution</h2>
        <p>Disputes are handled through the dispute center. We investigate and resolve issues in testing mode. Decisions are final for testing purposes.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>9. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts for violation of these Terms, suspicious activity, extended inactivity, or any reason at our discretion.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>10. Limitation of Liability</h2>
        <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong> THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES. WE ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM USE. NO REAL FINANCIAL LOSS CAN OCCUR AS ALL TRANSACTIONS ARE SIMULATED.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>11. Governing Law</h2>
        <p>These Terms shall be governed by the laws of Canada.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>12. Changes to Terms</h2>
        <p>We may modify these Terms. Continued use constitutes acceptance.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>13. Contact</h2>
        <p>Questions? Contact: <a href="mailto:bmirkalami@gmail.com" style={{ color: '#ffd700' }}>bmirkalami@gmail.com</a></p>

        <hr style={{ margin: '40px 0', borderColor: 'rgba(255,215,0,0.2)' }} />
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="credon" style={{ color: '#ffd700', marginRight: '20px' }}>← Back to Dashboard</Link>
          <Link to="privacy" style={{ color: '#ffd700' }}>Privacy Statement →</Link>
        </div>
        
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#ffd700', fontSize: '0.8rem' }}>
          ⚠️ TESTING SYSTEM ONLY - NOT FOR REAL FINANCIAL USE
        </p>
      </div>
    </div>
  );
};

export default Terms;
