import React, { useState, useEffect } from 'react';

const BiddingSystem = ({ exchangeRates, walletBalance, token }) => {
  const [openBids, setOpenBids] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [bidType, setBidType] = useState('sell');
  const [fromCurrency, setFromCurrency] = useState('Credon-USD');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');

  const currencies = ['Credon-USD', 'Credon-CAD', 'Credon-EUR', 'USD', 'CAD', 'EUR'];

  useEffect(() => {
    fetchOpenBids();
    fetchMyBids();
  }, [fromCurrency, toCurrency]);

  const fetchOpenBids = async () => {
    try {
      const response = await fetch(`/api/bids/open?from=${fromCurrency}&to=${toCurrency}`);
      const data = await response.json();
      setOpenBids(data.bids || []);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
  };

  const fetchMyBids = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/bids/my-bids', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMyBids(data.bids || []);
    } catch (error) {
      console.error('Failed to fetch my bids:', error);
    }
  };

  const createBid = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please login to create bids');
      return;
    }

    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: bidType,
          fromCurrency,
          toCurrency,
          amount: parseFloat(amount),
          exchangeRate: parseFloat(exchangeRate)
        })
      });

      if (response.ok) {
        alert(`${bidType.toUpperCase()} bid created (TESTING ONLY)`);
        setAmount('');
        setExchangeRate('');
        fetchMyBids();
        fetchOpenBids();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create bid');
      }
    } catch (error) {
      console.error('Create bid error:', error);
      alert('Failed to create bid');
    }
  };

  return (
    <div className="bidding-system">
      {/* Removed the "Credon Currency Bidding System" header that looked like a menu */}
      
      <div className="currency-pair-selector">
        <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
          {currencies.map(c => <option key={c}>{c}</option>)}
        </select>
        <span>→</span>
        <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
          {currencies.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <form onSubmit={createBid}>
        <div>
          <label>Bid Type:</label>
          <button type="button" onClick={() => setBidType('sell')} style={{ background: bidType === 'sell' ? '#ffd700' : '#333', padding: '8px 16px', margin: '5px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Sell</button>
          <button type="button" onClick={() => setBidType('buy')} style={{ background: bidType === 'buy' ? '#ffd700' : '#333', padding: '8px 16px', margin: '5px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Buy</button>
        </div>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ width: '100%', padding: '10px', margin: '10px 0', background: '#0b1f3f', border: '1px solid #ffd700', borderRadius: '5px', color: 'white' }} />
        <input type="number" step="0.000001" placeholder="Exchange Rate" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} required style={{ width: '100%', padding: '10px', margin: '10px 0', background: '#0b1f3f', border: '1px solid #ffd700', borderRadius: '5px', color: 'white' }} />
        <button type="submit" style={{ background: '#ffd700', color: '#0b1f3f', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Place {bidType} Order</button>
      </form>

      <h4 style={{ color: '#ffd700', marginTop: '20px' }}>Open Bids</h4>
      {openBids.length === 0 ? (
        <p>No open bids</p>
      ) : (
        openBids.map(bid => (
          <div key={bid.id} style={{ background: '#0b1f3f', padding: '10px', margin: '5px 0', borderRadius: '5px' }}>
            {bid.type.toUpperCase()}: {bid.amount_cents/100} {bid.from_currency} @ {bid.exchange_rate} {bid.to_currency}
          </div>
        ))
      )}

      <h4 style={{ color: '#ffd700', marginTop: '20px' }}>My Bids</h4>
      {myBids.length === 0 ? (
        <p>No bids yet</p>
      ) : (
        myBids.map(bid => (
          <div key={bid.id} style={{ background: '#0b1f3f', padding: '10px', margin: '5px 0', borderRadius: '5px' }}>
            {bid.type.toUpperCase()}: {bid.amount_cents/100} {bid.from_currency} @ {bid.exchange_rate} {bid.to_currency} - Status: {bid.status}
          </div>
        ))
      )}
    </div>
  );
};

export default BiddingSystem;
