/**
 * Full Currency Denominations — Paper & Coin Designs
 * 34 fiat currencies (real-world denominations) + 50 cryptocurrencies (practical amounts)
 */
const { FIAT_META, CRYPTO_META } = require('../utils/constants');

// Real-world banknote and coin denominations for all supported fiats
const FIAT_DENOMINATIONS = {
  'USD': { paper:[1,2,5,10,20,50,100], coin:[0.01,0.05,0.10,0.25,0.50,1.00] },
  'EUR': { paper:[5,10,20,50,100,200,500], coin:[0.01,0.02,0.05,0.10,0.20,0.50,1,2] },
  'GBP': { paper:[5,10,20,50], coin:[0.01,0.02,0.05,0.10,0.20,0.50,1,2] },
  'JPY': { paper:[1000,2000,5000,10000], coin:[1,5,10,50,100,500] },
  'CNY': { paper:[1,5,10,20,50,100], coin:[0.01,0.05,0.10,0.50,1] },
  'CAD': { paper:[5,10,20,50,100], coin:[0.05,0.10,0.25,1,2] },
  'AUD': { paper:[5,10,20,50,100], coin:[0.05,0.10,0.20,0.50,1,2] },
  'CHF': { paper:[10,20,50,100,200,1000], coin:[0.05,0.10,0.20,0.50,1,2,5] },
  'HKD': { paper:[10,20,50,100,500,1000], coin:[0.10,0.20,0.50,1,2,5,10] },
  'SGD': { paper:[2,5,10,50,100,1000], coin:[0.05,0.10,0.20,0.50,1] },
  'SEK': { paper:[20,50,100,200,500,1000], coin:[1,2,5,10] },
  'KRW': { paper:[1000,5000,10000,50000], coin:[10,50,100,500] },
  'NOK': { paper:[50,100,200,500,1000], coin:[1,5,10,20] },
  'NZD': { paper:[5,10,20,50,100], coin:[0.10,0.20,0.50,1,2] },
  'INR': { paper:[10,20,50,100,200,500], coin:[1,2,5,10,20] },
  'MXN': { paper:[20,50,100,200,500,1000], coin:[0.05,0.10,0.20,0.50,1,2,5,10,20] },
  'BRL': { paper:[2,5,10,20,50,100,200], coin:[0.01,0.05,0.10,0.25,0.50,1] },
  'ZAR': { paper:[10,20,50,100,200], coin:[0.05,0.10,0.20,0.50,1,2,5] },
  'TRY': { paper:[5,10,20,50,100,200], coin:[0.01,0.05,0.10,0.25,0.50,1] },
  'RUB': { paper:[50,100,200,500,1000,2000,5000], coin:[1,2,5,10] },
  'PLN': { paper:[10,20,50,100,200,500], coin:[0.01,0.02,0.05,0.10,0.20,0.50,1,2,5] },
  'THB': { paper:[20,50,100,500,1000], coin:[0.25,0.50,1,2,5,10] },
  'IDR': { paper:[1000,2000,5000,10000,20000,50000,100000], coin:[100,200,500,1000] },
  'HUF': { paper:[500,1000,2000,5000,10000,20000], coin:[5,10,20,50,100,200] },
  'CZK': { paper:[100,200,500,1000,2000,5000], coin:[1,2,5,10,20,50] },
  'ILS': { paper:[20,50,100,200], coin:[0.10,0.50,1,2,5,10] },
  'DKK': { paper:[50,100,200,500,1000], coin:[0.50,1,2,5,10,20] },
  'PHP': { paper:[20,50,100,200,500,1000], coin:[0.01,0.05,0.10,0.25,1,5,10,20] },
  'MYR': { paper:[1,5,10,20,50,100], coin:[0.05,0.10,0.20,0.50] },
  'RON': { paper:[1,5,10,50,100,200,500], coin:[0.01,0.05,0.10,0.50] },
  'BGN': { paper:[5,10,20,50,100], coin:[0.01,0.02,0.05,0.10,0.20,0.50,1,2] },
  'ISK': { paper:[500,1000,2000,5000,10000], coin:[1,5,10,50,100] },
  'VND': { paper:[1000,2000,5000,10000,20000,50000,100000,200000,500000], coin:[200,500,1000,2000,5000] },
  'HRK': { paper:[10,20,50,100,200,500,1000], coin:[0.01,0.02,0.05,0.10,0.20,0.50,1,2,5] },
};

// Crypto denominations — practical everyday amounts
function generateCryptoDenom(decimals) {
  const denom = [];
  for (let i = -8; i <= 2; i++) {
    const amount = parseFloat(Math.pow(10, i).toFixed(Math.abs(Math.min(i,0))));
    if (amount >= 0.00000001) denom.push(amount);
  }
  return denom;
}

function buildAllDenominations() {
  const all = {};

  // Fiat currencies
  for (const [code, meta] of Object.entries(FIAT_META)) {
    const denom = FIAT_DENOMINATIONS[code] || { paper: [1,5,10,20,50,100], coin: [0.01,0.05,0.10,0.25,0.50,1] };
    all[code] = {
      ...meta,
      type: 'fiat',
      paper: denom.paper,
      coin: denom.coin,
      colors: denom.paper.reduce((acc, v, i) => {
        const hues = ['#85bb65','#B76E79','#9B59B6','#E67E22','#2ECC71','#E74C3C','#3498DB','#F39C12','#1ABC9C','#E91E63'];
        acc[v] = hues[i % hues.length];
        return acc;
      }, {}),
    };
  }

  // Crypto currencies
  for (const [code, meta] of Object.entries(CRYPTO_META)) {
    const cryptoDenom = generateCryptoDenom(meta.decimals);
    all[code] = {
      ...meta,
      type: 'crypto',
      paper: cryptoDenom.filter(v => v >= 0.0001),
      coin: cryptoDenom.filter(v => v < 0.0001 && v >= 0.00000001),
      colors: cryptoDenom.reduce((acc, v, i) => {
        const hues = ['#F7931A','#627EEA','#26A17B','#F3BA2F','#23292F','#0033AD','#9945FF','#C2A633','#E6007A','#345D9D','#2A5ADA','#E84142','#FF007A','#2E3148','#08B5E5','#8CC63F','#7B3FE4','#8247E5','#FF0420','#2D374B','#5F67FF','#0090FF','#14C8FF','#000000','#41CCB4','#1969FF','#33E6BF','#B6509E','#2C3E50','#3777FF','#B965F6','#1A73E8','#2B6EFD','#1761FF','#E63F56','#5687FF','#3572A5','#008ECC','#FB8C00','#00875A','#FF6600','#2F353B','#E97D23','#00B4D8','#8247E5','#04B1FC','#F5A623','#0052FF','#1034A6','#F6A623'];
        acc[v] = hues[i % hues.length];
        return acc;
      }, {}),
    };
  }

  return all;
}

const ALL_DENOMINATIONS = buildAllDenominations();

function getDenominationBreakdown(amount, currency) {
  const denom = ALL_DENOMINATIONS[currency];
  if (!denom) return null;

  const allUnits = [...denom.paper, ...denom.coin].sort((a, b) => b - a);
  let remaining = amount;
  const breakdown = [];

  for (const unit of allUnits) {
    const count = Math.floor(remaining / unit);
    if (count > 0) {
      breakdown.push({ value: unit, count, type: denom.paper.includes(unit) ? 'bill' : 'coin' });
      remaining = parseFloat((remaining - count * unit).toFixed(denom.decimals));
    }
  }

  return { currency, symbol: denom.symbol, name: denom.name, total: amount, breakdown };
}

function formatCurrencyAmount(amount, currency) {
  const denom = ALL_DENOMINATIONS[currency];
  if (!denom) return `${amount}`;
  return `${denom.symbol}${amount.toFixed(denom.decimals)}`;
}

module.exports = { ALL_DENOMINATIONS, getDenominationBreakdown, formatCurrencyAmount };
