import React, { useState } from 'react';
import CurrencySelector from './CurrencySelector';

const BalanceCard = ({ walletData, exchangeRates, onCurrencyChange }) => {
  const [displayCurrency, setDisplayCurrency] = useState('Credon-USD');
  const [showAllBalances, setShowAllBalances] = useState(false);

  const baseBalance = walletData?.balance_cents / 100 || 0;
  
  const getDisplayBalance = () => {
    if (displayCurrency === 'Credon-USD') {
      return baseBalance.toFixed(2);
    }
    if (walletData?.balances && walletData.balances[displayCurrency]) {
      return walletData.balances[displayCurrency].toFixed(4);
    }
    return '0.00';
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'Credon-USD': '$',
      'Credon-CAD': 'C$',
      'Credon-EUR': '€',
      'Credon-GBP': '£',
      'Credon-VND': '₫',
      'Credon-BTC': '₿',
      'Credon-ETH': 'Ξ',
    };
    return symbols[currency] || '';
  };

  const allCurrencies = exchangeRates?.currencies || ['Credon-USD', 'Credon-CAD', 'Credon-EUR'];

  return (
    <div className="balance-card-enhanced">
      <div className="balance-header">
        <h3>💰 Your Credon Wallet</h3>
        <div className="testing-badge-small">
          TESTING ONLY
        </div>
      </div>

      <div className="balance-main">
        <div className="balance-amount-large">
          {getCurrencySymbol(displayCurrency)}
          {getDisplayBalance()} {displayCurrency}
        </div>
        
        <div className="balance-base">
          Base Balance: ${baseBalance.toFixed(2)} Credon-USD
        </div>

        <div className="currency-selector-wrapper">
          <CurrencySelector
            currencies={allCurrencies}
            selectedCurrency={displayCurrency}
            onSelect={(c) => {
              setDisplayCurrency(c);
              if (onCurrencyChange) onCurrencyChange(c);
            }}
            label="Display in:"
          />
        </div>

        <button 
          className="toggle-balances-btn"
          onClick={() => setShowAllBalances(!showAllBalances)}
        >
          {showAllBalances ? 'Hide All Balances ▲' : 'Show All Balances ▼'}
        </button>

        {showAllBalances && walletData?.balances && (
          <div className="all-balances">
            <h4>All Currency Balances (Mock)</h4>
            <div className="balances-grid">
              {Object.entries(walletData.balances).map(([currency, amount]) => (
                <div key={currency} className="balance-item">
                  <span className="currency-name">{currency}</span>
                  <span className="currency-amount">
                    {getCurrencySymbol(currency)}{amount.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="balance-footer">
        <p className="disclaimer-small">
          ⚠️ This is a TESTING balance with no real cash value.
        </p>
      </div>
    </div>
  );
};

export default BalanceCard;