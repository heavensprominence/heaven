/**
 * Exchange Rate Service — Full Coverage
 * Fiat rates: Frankfurter API (free, no API key, ECB data) — 30+ currencies
 * Crypto rates: CoinGecko API (free, no API key) — top 100 cryptos
 * Falls back to mock rates if APIs unreachable.
 * Cache: 5 minutes in-memory.
 */
const db = require('../db');
require('dotenv').config();

const FRANKFURTER_URL = 'https://api.frankfurter.app';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3';
const CACHE_TTL_MS = 5 * 60 * 1000;

// All fiat currencies supported by Frankfurter API
const FIAT_CURRENCIES = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'EUR', 'GBP', 'HKD', 'HRK', 'HUF', 'IDR', 'ILS', 'INR',
  'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP',
  'PLN', 'RON', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'USD',
  'VND', 'ZAR',
];

// Top cryptocurrencies by market cap (CoinGecko IDs)
const CRYPTO_CURRENCIES = {
  // Top 10
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binancecoin',
  'XRP': 'ripple', 'ADA': 'cardano', 'SOL': 'solana', 'DOGE': 'dogecoin',
  'DOT': 'polkadot', 'LTC': 'litecoin',
  // 11-25
  'LINK': 'chainlink', 'AVAX': 'avalanche-2', 'UNI': 'uniswap',
  'ATOM': 'cosmos', 'XLM': 'stellar', 'BCH': 'bitcoin-cash',
  'NEAR': 'near', 'MATIC': 'matic-network', 'OP': 'optimism',
  'ARB': 'arbitrum', 'APT': 'aptos', 'FIL': 'filecoin',
  'INJ': 'injective-protocol', 'ALGO': 'algorand', 'VET': 'vechain',
  // 26-50
  'FTM': 'fantom', 'RUNE': 'thorchain', 'AAVE': 'aave', 'QNT': 'quant',
  'STX': 'blockstack', 'GRT': 'the-graph', 'IMX': 'immutable-x',
  'FLOW': 'flow', 'XTZ': 'tezos', 'CRO': 'crypto-com-chain',
  'MKR': 'maker', 'KCS': 'kucoin-shares', 'ZEC': 'zcash',
  'EOS': 'eos', 'DASH': 'dash', 'NEO': 'neo', 'XMR': 'monero',
  'HBAR': 'hedera-hashgraph', 'ICP': 'internet-computer',
  'SAND': 'the-sandbox', 'MANA': 'decentraland', 'APE': 'apecoin',
  'THETA': 'theta-token', 'AXS': 'axie-infinity',
};

// In-memory cache
let rateCache = null;
let cacheTimestamp = 0;

async function fetchFrankfurterRates(base = 'USD') {
  try {
    const response = await fetch(`${FRANKFURTER_URL}/latest?from=${base}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.rates;
  } catch (err) {
    console.error('Frankfurter API error:', err.message);
    return null;
  }
}

async function fetchCoinGeckoRates() {
  try {
    const ids = Object.values(CRYPTO_CURRENCIES).join(',');
    const response = await fetch(
      `${COINGECKO_URL}/simple/price?ids=${ids}&vs_currencies=usd`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('CoinGecko API error:', err.message);
    return null;
  }
}

// Mock rates fallback — generated dynamically from all currencies
function getMockRates() {
  const { FIAT_META, CRYPTO_META } = require('../utils/constants');
  const rates = {};
  const fiatMocks = { 'USD':1.0,'EUR':0.92,'GBP':0.79,'JPY':150.5,'CNY':7.24,'CAD':1.37,'AUD':1.52,'CHF':0.89,'HKD':7.82,'SGD':1.34,'SEK':10.5,'KRW':1350,'NOK':10.7,'NZD':1.63,'INR':83.5,'MXN':17.1,'BRL':5.05,'ZAR':18.3,'TRY':32.5,'RUB':92.0,'PLN':3.97,'THB':36.2,'IDR':15800,'HUF':360,'CZK':23.1,'ILS':3.72,'DKK':6.87,'PHP':57.5,'MYR':4.72,'RON':4.58,'BGN':1.80,'HRK':6.93,'ISK':138,'VND':25400,'KES':130 };
  for (const code of Object.keys(FIAT_META)) {
    rates[code] = { rate: fiatMocks[code] || 1.0, source: 'fallback', type: 'fiat', updated: new Date().toISOString() };
  }
  const cryptoMocks = { 'BTC':65000,'ETH':3200,'USDT':1,'BNB':580,'XRP':0.52,'ADA':0.45,'SOL':145,'DOGE':0.12,'DOT':6.8,'LTC':72,'LINK':14.5,'AVAX':34,'UNI':7.5,'ATOM':8.2,'XLM':0.11,'BCH':240,'NEAR':5.2,'MATIC':0.72,'OP':2.4,'ARB':1.15,'APT':8.9,'FIL':5.8,'INJ':22,'ALGO':0.18,'VET':0.035,'FTM':0.48,'RUNE':5.2,'AAVE':95,'QNT':105,'STX':1.8,'GRT':0.22,'IMX':2.1,'FLOW':0.85,'XTZ':0.95,'CRO':0.09,'MKR':2100,'KCS':9.8,'ZEC':28,'EOS':0.75,'DASH':28,'NEO':14,'XMR':165,'HBAR':0.08,'ICP':12,'SAND':0.42,'MANA':0.38,'APE':1.25,'THETA':1.5,'AXS':7.2 };
  for (const code of Object.keys(CRYPTO_META)) {
    const inverse = cryptoMocks[code] || 10;
    rates[code] = { rate: 1/inverse, rate_inverse: inverse, source: 'fallback', type: 'crypto', updated: new Date().toISOString() };
  }
  return rates;
}

async function buildRateTable() {
  const now = Date.now();
  if (rateCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return rateCache;
  }

  const rates = {};
  let liveData = false;

  // Fetch fiat rates from Frankfurter
  const fiatRates = await fetchFrankfurterRates('USD');
  if (fiatRates) {
    liveData = true;
    for (const currency of FIAT_CURRENCIES) {
      if (fiatRates[currency] || currency === 'USD') {
        rates[currency] = {
          rate: currency === 'USD' ? 1.0 : fiatRates[currency],
          source: 'frankfurter',
          type: 'fiat',
          updated: new Date().toISOString(),
        };
      }
    }
    // Fill in any FIAT_META currencies not covered by Frankfurter (e.g. KES)
    const mockFiat = getMockRates();
    const { FIAT_META } = require('../utils/constants');
    for (const currency of Object.keys(FIAT_META)) {
      if (!rates[currency] && mockFiat[currency]) {
        rates[currency] = mockFiat[currency];
      }
    }
  }

  // Fetch crypto rates from CoinGecko
  const cryptoRates = await fetchCoinGeckoRates();
  if (cryptoRates) {
    liveData = true;
    for (const [symbol, id] of Object.entries(CRYPTO_CURRENCIES)) {
      if (cryptoRates[id]?.usd) {
        rates[symbol] = {
          rate: 1 / cryptoRates[id].usd,
          rate_inverse: cryptoRates[id].usd,
          source: 'coingecko',
          type: 'crypto',
          updated: new Date().toISOString(),
        };
      }
    }
  }

  // Fallback to mock rates if APIs failed
  if (!liveData) {
    console.warn('⚠️ All rate APIs failed — using fallback mock rates');
    const mocks = getMockRates();
    for (const [currency, data] of Object.entries(mocks)) {
      if (typeof data === 'number') {
        rates[currency] = { rate: data, source: 'fallback', type: 'fiat', updated: new Date().toISOString() };
      } else {
        rates[currency] = { rate: data.rate, rate_inverse: data.inverse, source: 'fallback', type: 'crypto', updated: new Date().toISOString() };
      }
    }
  }

  rateCache = rates;
  cacheTimestamp = now;
  return rates;
}

async function convert(amount, fromCurrency, toCurrency) {
  const rates = await buildRateTable();
  const from = fromCurrency.replace('Credon-', '');
  const to = toCurrency.replace('Credon-', '');

  if (!rates[from] || !rates[to]) {
    throw new Error(`Unsupported currency: ${!rates[from] ? fromCurrency : toCurrency}`);
  }

  const fromRate = rates[from].rate;
  const toRate = rates[to].rate;
  const amountInUSD = amount / fromRate;
  const result = amountInUSD * toRate;

  const isCrypto = rates[from].type === 'crypto' || rates[to].type === 'crypto';
  return parseFloat(result.toFixed(isCrypto ? 8 : 2));
}

async function getAllRates(baseCurrency = 'USD') {
  const rates = await buildRateTable();
  const base = baseCurrency.replace('Credon-', '');
  if (base === 'USD') return rates;
  
  const rebased = {};
  const baseRate = rates[base]?.rate || 1;
  for (const [currency, data] of Object.entries(rates)) {
    rebased[currency] = {
      ...data,
      rate: currency === base ? 1.0 : parseFloat((data.rate / baseRate).toFixed(6)),
    };
  }
  return rebased;
}

async function getRate(fromCurrency, toCurrency) {
  const rates = await buildRateTable();
  const from = fromCurrency.replace('Credon-', '');
  const to = toCurrency.replace('Credon-', '');
  return parseFloat((rates[to].rate / rates[from].rate).toFixed(6));
}

async function getSupportedCurrencies() {
  const rates = await buildRateTable();
  const currencies = Object.keys(rates);
  return [...currencies.map(c => `Credon-${c}`), ...currencies];
}

module.exports = { convert, getAllRates, getRate, getSupportedCurrencies, buildRateTable };
