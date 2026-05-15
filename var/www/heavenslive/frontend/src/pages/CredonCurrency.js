import { getLoginPath } from '../utils/pathHelper';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import Wallet from './Wallet';
import BiddingSystem from './BiddingSystem';
import BonusSchedule from '../components/BonusSchedule';
import LedgerDisplay from '../components/LedgerDisplay';
import AppointmentScheduler from './AppointmentScheduler';
import DisputeCenter from './DisputeCenter';
import AdminDashboard from './AdminDashboard';

const CredonCurrency = () => {
  const { user, token, logout, isSuperAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('wallet');
  const [walletData, setWalletData] = useState(null);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('Credon-USD');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const validTabs = ['wallet', 'bids', 'bonus', 'ledger', 'appointments', 'disputes'];
    if (isSuperAdmin) validTabs.push('admin');
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location, isSuperAdmin]);

  useEffect(() => {
    if (token && user) {
      Promise.all([fetchWalletData(), fetchExchangeRates()]).finally(() => setDataLoading(false));
    } else if (!authLoading && !user) {
      setDataLoading(false);
    }
  }, [token, user, authLoading]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setWalletData(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      return null;
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('/api/wallet/exchange-rates?base=Credon-USD', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setExchangeRates(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      return null;
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="credon-container">
        <div className="balance-card" style={{ textAlign: 'center', padding: '50px' }}>
          <h3>Loading your dashboard...</h3>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="credon-container">
        <div className="login-prompt">
          <h2>🔐 Please Log In</h2>
          <p>You need to be logged in to access the Credon Currency system.</p>
          <a href={getLoginPath()} className="btn-primary">Login / Register</a>
        </div>
      </div>
    );
  }

  return (
    <div className="credon-container">
      {/* Navigation Bar – visible only when logged in; hidden on small screens */}
      {user && (
        <div className="nav-bar credon-nav">
          <div className="nav-logo">
            <span>🏦</span>
            <span>Credon Currency</span>
          </div>
          <div className="nav-links">
            <button onClick={() => setActiveTab('wallet')} className={`nav-link ${activeTab === 'wallet' ? 'active' : ''}`}>
              💰 Wallet
            </button>
            <button onClick={() => setActiveTab('bids')} className={`nav-link ${activeTab === 'bids' ? 'active' : ''}`}>
              📊 Bids
            </button>
            <button onClick={() => setActiveTab('bonus')} className={`nav-link ${activeTab === 'bonus' ? 'active' : ''}`}>
              🎁 Bonuses
            </button>
            <button onClick={() => setActiveTab('ledger')} className={`nav-link ${activeTab === 'ledger' ? 'active' : ''}`}>
              📒 Ledger
            </button>
            <button onClick={() => setActiveTab('appointments')} className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}>
              📅 Appointments
            </button>
            <button onClick={() => setActiveTab('disputes')} className={`nav-link ${activeTab === 'disputes' ? 'active' : ''}`}>
              ⚖️ Disputes
            </button>
            {isSuperAdmin && (
              <button onClick={() => setActiveTab('admin')} className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}>
                👑 Admin
              </button>
            )}
            <button onClick={logout} className="nav-link logout-btn">🚪 Logout</button>
          </div>
        </div>
      )}

      <div className="credondashboard-content">
        {activeTab === 'wallet' && <Wallet walletData={walletData} exchangeRates={exchangeRates} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />}
        {activeTab === 'bids' && <BiddingSystem token={token} />}
        {activeTab === 'bonus' && <BonusSchedule token={token} />}
        {activeTab === 'ledger' && <LedgerDisplay token={token} />}
        {activeTab === 'appointments' && <AppointmentScheduler token={token} />}
        {activeTab === 'disputes' && <DisputeCenter token={token} />}
        {activeTab === 'admin' && isSuperAdmin && <AdminDashboard token={token} />}
      </div>
    </div>
  );
};

export default CredonCurrency;
