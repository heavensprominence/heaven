const pool = require('../config/database');

class MockExchangeRates {
  // Get rate between two currencies
  static async getRate(fromCurrency, toCurrency) {
    // If same currency
    if (fromCurrency === toCurrency) {
      return 1;
    }
    
    // Try direct rate
    let result = await pool.query(
      `SELECT rate FROM exchange_rates 
       WHERE from_currency = $1 AND to_currency = $2`,
      [fromCurrency, toCurrency]
    );
    
    if (result.rows.length > 0) {
      return parseFloat(result.rows[0].rate);
    }
    
    // Try reverse rate
    result = await pool.query(
      `SELECT rate FROM exchange_rates 
       WHERE from_currency = $1 AND to_currency = $2`,
      [toCurrency, fromCurrency]
    );
    
    if (result.rows.length > 0) {
      return 1 / parseFloat(result.rows[0].rate);
    }
    
    // Default fallback
    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    return 1;
  }
  
  // Convert amount from one currency to another
  static async convert(amount, fromCurrency, toCurrency) {
    const rate = await this.getRate(fromCurrency, toCurrency);
    return amount * rate;
  }
  
  // Get all rates for a currency (to base USD equivalent)
  static async getAllRates(baseCurrency = 'Credon-USD') {
    const result = await pool.query(
      `SELECT from_currency, to_currency, rate FROM exchange_rates`
    );
    
    const rates = {};
    for (const row of result.rows) {
      if (row.from_currency === baseCurrency) {
        rates[row.to_currency] = parseFloat(row.rate);
      }
    }
    
    // Add base to itself
    rates[baseCurrency] = 1;
    
    return rates;
  }
  
  // Update rate (admin only)
  static async updateRate(fromCurrency, toCurrency, rate, adminId) {
    const result = await pool.query(
      `INSERT INTO exchange_rates (from_currency, to_currency, rate, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (from_currency, to_currency) 
       DO UPDATE SET rate = EXCLUDED.rate, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [fromCurrency, toCurrency, rate, adminId]
    );
    
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'UPDATE_EXCHANGE_RATE', 'exchange_rate', result.rows[0].id, JSON.stringify({ fromCurrency, toCurrency, rate })]
    );
    
    return result.rows[0];
  }
  
  // Get all supported currencies
  static async getSupportedCurrencies() {
    const result = await pool.query(
      `SELECT DISTINCT from_currency as currency FROM exchange_rates
       UNION
       SELECT DISTINCT to_currency as currency FROM exchange_rates`
    );
    
    return result.rows.map(r => r.currency);
  }
  
  // Mock API call to free exchange rate provider (simulated for testing)
  static async mockFetchExternalRates() {
    // This simulates calling a free API like exchangerate-api.com
    // In testing mode, returns mock data
    console.log('[MOCK] Fetching external exchange rates...');
    
    // Mock response data
    const mockRates = {
      'USD': 1,
      'CAD': 1.35,
      'EUR': 0.92,
      'GBP': 0.79,
      'VND': 25000,
      'JPY': 150.5,
      'CNY': 7.25,
      'BTC': 0.000015,
      'ETH': 0.00025
    };
    
    return mockRates;
  }
  
  // Sync rates from external provider (mock)
  static async syncExternalRates(adminId) {
    const externalRates = await this.mockFetchExternalRates();
    
    for (const [currency, rate] of Object.entries(externalRates)) {
      if (currency !== 'USD') {
        await this.updateRate('Credon-USD', `Credon-${currency}`, rate, adminId);
      }
    }
    
    console.log('[MOCK] Synced exchange rates from external provider');
    return true;
  }
}

module.exports = MockExchangeRates;