import React from 'react';

const CurrencySelector = ({ currencies, selectedCurrency, onSelect, label = "Select Currency" }) => {
  // Group currencies by type
  const cloneCurrencies = currencies.filter(c => c.startsWith('Credon-'));
  const legalCurrencies = currencies.filter(c => !c.startsWith('Credon-'));

  return (
    <div className="currency-selector-component">
      <label>{label}</label>
      <select 
        value={selectedCurrency} 
        onChange={(e) => onSelect(e.target.value)}
        className="currency-select"
      >
        {cloneCurrencies.length > 0 && (
          <optgroup label="Credon Clone Currencies">
            {cloneCurrencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </optgroup>
        )}
        
        {legalCurrencies.length > 0 && (
          <optgroup label="Legal Tenders (Mock)">
            {legalCurrencies.map(currency => (
              <option key={currency} value={currency}>{currency} (Mock)</option>
            ))}
          </optgroup>
        )}
      </select>
      
      <div className="currency-hint">
        <small>⚠️ Legal tenders are for mock bidding only</small>
      </div>
    </div>
  );
};

export default CurrencySelector;