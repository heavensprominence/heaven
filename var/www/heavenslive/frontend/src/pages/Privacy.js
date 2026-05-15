import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="privacy-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '40px', border: '1px solid rgba(255,215,0,0.2)' }}>
        <h1 style={{ color: '#ffd700', marginBottom: '20px', fontSize: '2rem' }}>Privacy Statement</h1>
        <p style={{ marginBottom: '20px', color: '#ccc' }}><strong>Last Updated: March 30, 2026</strong></p>
        
        <div style={{ background: '#ffd70020', padding: '15px', borderRadius: '10px', marginBottom: '30px' }}>
          <p style={{ color: '#ffd700', fontWeight: 'bold' }}>⚠️ IMPORTANT: This is a TESTING SYSTEM ONLY</p>
          <p>No real currency or financial instruments are being offered. Regulatory approval is being sought.</p>
        </div>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>1. Introduction</h2>
        <p>HeavensLive ("we," "us," or "our") operates the HeavensLive Credon Currency platform. This Privacy Statement explains how we collect, use, and protect your personal information.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>2. Information We Collect</h2>
        <p><strong>Information You Provide:</strong></p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Account Information: Email address, password (encrypted), full name (optional), WhatsApp number (optional)</li>
          <li>Transaction Information: Details of mock currency transactions</li>
          <li>Communication: Messages sent through the dispute system, appointment notes</li>
        </ul>
        <p><strong>Automatically Collected Information:</strong></p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Usage Data: Pages visited, features used</li>
          <li>Device Information: IP address, browser type, operating system</li>
          <li>Cookies: Essential cookies only (no tracking cookies)</li>
        </ul>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>3. How We Use Your Information</h2>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>To provide and maintain the testing platform</li>
          <li>To authenticate your identity</li>
          <li>To process orders for physical memorabilia and USB devices</li>
          <li>To schedule and manage appointments</li>
          <li>To respond to disputes and support requests</li>
          <li>To improve the platform for future development</li>
        </ul>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>4. Information Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share information with your consent or to comply with legal obligations.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>5. Data Security</h2>
        <p>We implement reasonable security measures including:</p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Encrypted passwords (bcrypt)</li>
          <li>JWT tokens for authentication</li>
          <li>Secure database connections</li>
          <li>Regular security updates</li>
        </ul>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your account</li>
          <li>Opt out of communications</li>
        </ul>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>7. Children's Privacy</h2>
        <p>This service is not intended for children under 18. We do not knowingly collect information from minors.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>8. Cookies</h2>
        <p>We use only essential cookies required for the operation of the website. No tracking or analytics cookies are used.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>9. Changes to This Statement</h2>
        <p>We may update this Privacy Statement. Changes will be posted on this page with an updated "Last Updated" date.</p>

        <h2 style={{ color: '#ffd700', marginTop: '25px', marginBottom: '15px' }}>10. Contact Us</h2>
        <p>For privacy concerns, contact: <a href="mailto:bmirkalami@gmail.com" style={{ color: '#ffd700' }}>bmirkalami@gmail.com</a></p>

        <hr style={{ margin: '40px 0', borderColor: 'rgba(255,215,0,0.2)' }} />
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="credon" style={{ color: '#ffd700', marginRight: '20px' }}>← Back to Dashboard</Link>
          <Link to="terms" style={{ color: '#ffd700' }}>Terms of Use →</Link>
        </div>
        
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#ffd700', fontSize: '0.8rem' }}>
          ⚠️ TESTING SYSTEM ONLY - No real financial services are being provided
        </p>
      </div>
    </div>
  );
};

export default Privacy;
