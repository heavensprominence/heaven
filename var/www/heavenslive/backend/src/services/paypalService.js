/**
 * PayPal Checkout Service
 * Multi-currency: converts any currency → USD via live + static rates
 */
const axios = require('axios');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5000';
const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true' 
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const getPayPalAccessToken = async () => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return null;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } });
  return response.data.access_token;
};

// Static rates for 100+ currencies (1 USD = X units)
const STATIC_RATES = {
  'VND': 25470, 'IRR': 42000, 'BDT': 121, 'PKR': 278, 'NGN': 1550, 'EGP': 50.6,
  'UAH': 41.5, 'TWD': 32.5, 'CLP': 970, 'COP': 4100, 'PEN': 3.7, 'ARS': 1050,
  'KWD': 0.31, 'QAR': 3.64, 'OMR': 0.385, 'BHD': 0.376, 'JOD': 0.709,
  'LKR': 300, 'MMK': 2100, 'KHR': 4100, 'LAK': 22000, 'MNT': 3450,
  'XAF': 600, 'XOF': 600, 'XPF': 108, 'MAD': 9.85, 'TND': 3.1, 'DZD': 134,
  'GHS': 15.2, 'KES': 129, 'UGX': 3700, 'TZS': 2600, 'ETB': 130,
  'CRC': 510, 'DOP': 62, 'GTQ': 7.75, 'HNL': 25.5, 'NIO': 36.8, 'PAB': 1,
  'PYG': 7900, 'UYU': 43, 'BOB': 6.9, 'ISK': 130, 'NPR': 136, 'MUR': 46,
  'ZMW': 27, 'MWK': 1750, 'RWF': 1400, 'BIF': 2950, 'GNF': 8700,
  'MGA': 4700, 'AOA': 930, 'SLL': 22700, 'GMD': 71, 'SOS': 570,
  'SDG': 600, 'SSP': 4000, 'LYD': 4.85, 'YER': 250, 'SYP': 13000,
  'LBP': 89500, 'IQD': 1310, 'AFN': 72, 'UZS': 12700, 'KZT': 510,
  'AZN': 1.7, 'GEL': 2.8, 'AMD': 395, 'BYN': 3.15, 'MDL': 18.4,
  'KGS': 87, 'TJS': 10.9, 'TMT': 3.5, 'MKD': 57, 'ALL': 91, 'RSD': 107,
  'BAM': 1.83,
};

const convertToUSD = async (amount, fromCurrency) => {
  if (!fromCurrency || fromCurrency === 'USD' || fromCurrency === 'Credon-USD') {
    return { usdAmount: amount, rate: 1 };
  }
  const base = fromCurrency.startsWith('Credon-') ? fromCurrency.slice(7) : fromCurrency;

  try {
    // 1. Our cached rates
    const r = await axios.get('http://localhost:5000/api/wallet/exchange-rates', { timeout: 5000 });
    const rates = r.data.rates || {};
    let rate = rates[base] || rates[fromCurrency];
    if (rate && rate.rate) {
      return { usdAmount: Math.round(amount / rate.rate * 100) / 100, rate: rate.rate };
    }
    // 2. Frankfurter direct
    const ff = await axios.get(`https://api.frankfurter.app/latest?from=USD&to=${base}`, { timeout: 5000 });
    if (ff.data && ff.data.rates && ff.data.rates[base]) {
      const fr = ff.data.rates[base];
      return { usdAmount: Math.round(amount / fr * 100) / 100, rate: fr };
    }
  } catch (e) { console.log('Live rate failed:', e.message); }

  // 3. Static fallback
  if (STATIC_RATES[base]) {
    const sr = STATIC_RATES[base];
    return { usdAmount: Math.round(amount / sr * 100) / 100, rate: sr, source: 'static' };
  }
  
  return { usdAmount: amount, rate: 1, fallback: true };
};

const createPayPalOrder = async (amount, currency, description, orderId, type = 'purchase') => {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) throw new Error('PayPal not configured');

  const { usdAmount, rate, fallback } = await convertToUSD(amount, currency || 'USD');
  const note = (currency && currency !== 'USD')
    ? ` | ${amount} ${currency} → $${usdAmount} USD (1 USD = ${rate} ${currency})`
    : '';

  const resp = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: { currency_code: 'USD', value: usdAmount.toFixed(2) },
      description: (description || 'HeavensLive Purchase') + note,
      custom_id: orderId,
    }],
    application_context: {
      brand_name: 'HeavensLive',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${BASE_URL}/payment/success?orderId=${orderId}&type=${type}&amount=${usdAmount}&origAmount=${amount}&origCurrency=${currency||'USD'}`,
      cancel_url: `${BASE_URL}/payment/cancel?orderId=${orderId}&type=${type}`,
    },
  }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });

  return {
    paypalOrderId: resp.data.id,
    approvalUrl: resp.data.links.find(l => l.rel === 'approve')?.href,
    status: resp.data.status,
    usdAmount, originalAmount: amount, originalCurrency: currency || 'USD',
    conversionRate: rate, isFallback: !!fallback,
  };
};

const capturePayPalOrder = async (paypalOrderId) => {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) throw new Error('PayPal not configured');
  const resp = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {},
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
  return resp.data;
};

module.exports = { createPayPalOrder, capturePayPalOrder };
