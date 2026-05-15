/**
 * Application Constants
 * All currencies — 34 fiat + 50 crypto + their Credon- clones = 168 total
 */
const FIAT_META = {
  'USD': { name: 'US Dollar', symbol: '$', decimals: 2 },
  'EUR': { name: 'Euro', symbol: '€', decimals: 2 },
  'GBP': { name: 'British Pound', symbol: '£', decimals: 2 },
  'JPY': { name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  'CNY': { name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  'CAD': { name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  'AUD': { name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  'CHF': { name: 'Swiss Franc', symbol: 'Fr', decimals: 2 },
  'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  'SGD': { name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  'SEK': { name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  'KRW': { name: 'South Korean Won', symbol: '₩', decimals: 0 },
  'NOK': { name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  'NZD': { name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  'INR': { name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  'MXN': { name: 'Mexican Peso', symbol: 'Mex$', decimals: 2 },
  'BRL': { name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  'ZAR': { name: 'South African Rand', symbol: 'R', decimals: 2 },
  'TRY': { name: 'Turkish Lira', symbol: '₺', decimals: 2 },
  'RUB': { name: 'Russian Ruble', symbol: '₽', decimals: 2 },
  'PLN': { name: 'Polish Zloty', symbol: 'zł', decimals: 2 },
  'THB': { name: 'Thai Baht', symbol: '฿', decimals: 2 },
  'IDR': { name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0 },
  'HUF': { name: 'Hungarian Forint', symbol: 'Ft', decimals: 0 },
  'CZK': { name: 'Czech Koruna', symbol: 'Kč', decimals: 2 },
  'ILS': { name: 'Israeli Shekel', symbol: '₪', decimals: 2 },
  'DKK': { name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  'PHP': { name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  'MYR': { name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  'RON': { name: 'Romanian Leu', symbol: 'lei', decimals: 2 },
  'BGN': { name: 'Bulgarian Lev', symbol: 'лв', decimals: 2 },
  'ISK': { name: 'Icelandic Króna', symbol: 'kr', decimals: 0 },
  'VND': { name: 'Vietnamese Dong', symbol: '₫', decimals: 0 },
  'HRK': { name: 'Croatian Kuna', symbol: 'kn', decimals: 2 },
};

const CRYPTO_META = {
  'BTC':  { name: 'Bitcoin', symbol: '₿', decimals: 8 },
  'ETH':  { name: 'Ethereum', symbol: 'Ξ', decimals: 8 },
  'USDT': { name: 'Tether', symbol: '₮', decimals: 2 },
  'BNB':  { name: 'BNB', symbol: 'BNB', decimals: 8 },
  'XRP':  { name: 'XRP', symbol: 'XRP', decimals: 6 },
  'ADA':  { name: 'Cardano', symbol: 'ADA', decimals: 6 },
  'SOL':  { name: 'Solana', symbol: 'SOL', decimals: 8 },
  'DOGE': { name: 'Dogecoin', symbol: 'Ð', decimals: 8 },
  'DOT':  { name: 'Polkadot', symbol: 'DOT', decimals: 8 },
  'LTC':  { name: 'Litecoin', symbol: 'Ł', decimals: 8 },
  'LINK': { name: 'Chainlink', symbol: 'LINK', decimals: 8 },
  'AVAX': { name: 'Avalanche', symbol: 'AVAX', decimals: 8 },
  'UNI':  { name: 'Uniswap', symbol: 'UNI', decimals: 8 },
  'ATOM': { name: 'Cosmos', symbol: 'ATOM', decimals: 8 },
  'XLM':  { name: 'Stellar', symbol: 'XLM', decimals: 7 },
  'BCH':  { name: 'Bitcoin Cash', symbol: 'BCH', decimals: 8 },
  'NEAR': { name: 'NEAR Protocol', symbol: 'NEAR', decimals: 8 },
  'MATIC':{ name: 'Polygon', symbol: 'MATIC', decimals: 8 },
  'OP':   { name: 'Optimism', symbol: 'OP', decimals: 8 },
  'ARB':  { name: 'Arbitrum', symbol: 'ARB', decimals: 8 },
  'APT':  { name: 'Aptos', symbol: 'APT', decimals: 8 },
  'FIL':  { name: 'Filecoin', symbol: 'FIL', decimals: 8 },
  'INJ':  { name: 'Injective', symbol: 'INJ', decimals: 8 },
  'ALGO': { name: 'Algorand', symbol: 'ALGO', decimals: 6 },
  'VET':  { name: 'VeChain', symbol: 'VET', decimals: 8 },
  'FTM':  { name: 'Fantom', symbol: 'FTM', decimals: 8 },
  'RUNE': { name: 'THORChain', symbol: 'RUNE', decimals: 8 },
  'AAVE': { name: 'Aave', symbol: 'AAVE', decimals: 8 },
  'QNT':  { name: 'Quant', symbol: 'QNT', decimals: 8 },
  'STX':  { name: 'Stacks', symbol: 'STX', decimals: 6 },
  'GRT':  { name: 'The Graph', symbol: 'GRT', decimals: 8 },
  'IMX':  { name: 'Immutable X', symbol: 'IMX', decimals: 8 },
  'FLOW': { name: 'Flow', symbol: 'FLOW', decimals: 8 },
  'XTZ':  { name: 'Tezos', symbol: 'XTZ', decimals: 6 },
  'CRO':  { name: 'Cronos', symbol: 'CRO', decimals: 8 },
  'MKR':  { name: 'Maker', symbol: 'MKR', decimals: 8 },
  'KCS':  { name: 'KuCoin', symbol: 'KCS', decimals: 8 },
  'ZEC':  { name: 'Zcash', symbol: 'ZEC', decimals: 8 },
  'EOS':  { name: 'EOS', symbol: 'EOS', decimals: 4 },
  'DASH': { name: 'Dash', symbol: 'DASH', decimals: 8 },
  'NEO':  { name: 'Neo', symbol: 'NEO', decimals: 0 },
  'XMR':  { name: 'Monero', symbol: 'XMR', decimals: 12 },
  'HBAR': { name: 'Hedera', symbol: 'HBAR', decimals: 8 },
  'ICP':  { name: 'Internet Computer', symbol: 'ICP', decimals: 8 },
  'SAND': { name: 'The Sandbox', symbol: 'SAND', decimals: 8 },
  'MANA': { name: 'Decentraland', symbol: 'MANA', decimals: 8 },
  'APE':  { name: 'ApeCoin', symbol: 'APE', decimals: 8 },
  'THETA':{ name: 'Theta', symbol: 'THETA', decimals: 8 },
  'AXS':  { name: 'Axie Infinity', symbol: 'AXS', decimals: 8 },
};

// Build SUPPORTED_CURRENCIES dynamically (real + Credon- clones)
const SUPPORTED_CURRENCIES = {};
for (const [code, meta] of Object.entries(FIAT_META)) {
  SUPPORTED_CURRENCIES[code] = { ...meta, isClone: false, type: 'fiat' };
  SUPPORTED_CURRENCIES[`Credon-${code}`] = { ...meta, name: `Credon ${meta.name}`, isClone: true, type: 'fiat' };
}
for (const [code, meta] of Object.entries(CRYPTO_META)) {
  SUPPORTED_CURRENCIES[code] = { ...meta, isClone: false, type: 'crypto' };
  SUPPORTED_CURRENCIES[`Credon-${code}`] = { ...meta, name: `Credon ${meta.name}`, isClone: true, type: 'crypto' };
}

const REAL_FIAT = Object.keys(FIAT_META);
const REAL_CRYPTO = Object.keys(CRYPTO_META);

// Order types
const ORDER_TYPES = {
  DONATION: 'donation',
  PAPER_CURRENCY: 'paper_currency',
  PREMIUM_USB: 'premium_usb',
};

const ORDER_STATUS = {
  PENDING: 'pending', PAID: 'paid', SHIPPED: 'shipped',
  DELIVERED: 'delivered', CANCELLED: 'cancelled', REFUNDED: 'refunded',
};

const TRANSACTION_TYPES = {
  PURCHASE: 'purchase', BONUS: 'bonus', MINT: 'mint', BURN: 'burn',
  REFUND: 'refund', TRANSFER_SENT: 'transfer_sent', TRANSFER_RECEIVED: 'transfer_received',
};

const APPOINTMENT_DURATIONS = { DEFAULT: 15, MIN: 15, MAX: 60 };

const BONUS_SCHEDULE = [
  { minPurchase: 1, maxPurchase: 1, multiplier: 10 },
  { minPurchase: 2, maxPurchase: 2, multiplier: 9 },
  { minPurchase: 3, maxPurchase: 3, multiplier: 8 },
  { minPurchase: 4, maxPurchase: 10, multiplier: 7 },
  { minPurchase: 11, maxPurchase: 100, multiplier: 6 },
  { minPurchase: 101, maxPurchase: 1000, multiplier: 5 },
  { minPurchase: 1001, maxPurchase: 10000, multiplier: 4 },
  { minPurchase: 10001, maxPurchase: 100000, multiplier: 3 },
  { minPurchase: 100001, maxPurchase: 1000000, multiplier: 2 },
  { minPurchase: 1000001, maxPurchase: 10000000, multiplier: 1 },
];

const TESTING_DISCLAIMER = {
  short: 'TESTING SYSTEM ONLY',
  full: 'THIS IS A TESTING SYSTEM ONLY. No real currency or financial instruments are being offered.',
};

module.exports = {
  SUPPORTED_CURRENCIES, FIAT_META, CRYPTO_META, REAL_FIAT, REAL_CRYPTO,
  ORDER_TYPES, ORDER_STATUS, TRANSACTION_TYPES,
  APPOINTMENT_DURATIONS, BONUS_SCHEDULE, TESTING_DISCLAIMER,
};
