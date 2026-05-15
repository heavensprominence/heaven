/**
 * System Settings Service
 * Global toggles managed by super admins.
 */
const db = require('../db');

const DEFAULTS = {
  withdrawals_enabled: false,  // 🔒 OFF by default — prevent fraud
  registrations_open: true,
  marketplace_open: true,
  paper_currency_orders: true,
  minting_enabled: true,
};

class SystemSettings {
  /**
   * Get a setting value.
   */
  static async get(key) {
    try {
      const result = await db.query(
        'SELECT setting_value FROM system_settings WHERE setting_key = $1',
        [key]
      );
      if (result.rows.length > 0) {
        const val = result.rows[0].setting_value;
        if (val === 'true') return true;
        if (val === 'false') return false;
        if (!isNaN(val)) return Number(val);
        return val;
      }
      return DEFAULTS[key] !== undefined ? DEFAULTS[key] : null;
    } catch (e) {
      // Table might not exist yet — return default
      return DEFAULTS[key];
    }
  }

  /**
   * Set a setting value.
   */
  static async set(key, value) {
    await db.query(
      `INSERT INTO system_settings (setting_key, setting_value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = NOW()`,
      [key, String(value)]
    );
  }

  /**
   * Get all settings.
   */
  static async getAll() {
    try {
      const result = await db.query('SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key');
      const settings = { ...DEFAULTS };
      for (const row of result.rows) {
        const val = row.setting_value;
        if (val === 'true') settings[row.setting_key] = true;
        else if (val === 'false') settings[row.setting_key] = false;
        else if (!isNaN(val)) settings[row.setting_key] = Number(val);
        else settings[row.setting_key] = val;
      }
      return settings;
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  /**
   * Check if withdrawals are enabled.
   * Throws if disabled.
   */
  static async assertWithdrawalsEnabled() {
    const enabled = await this.get('withdrawals_enabled');
    if (!enabled) {
      const error = new Error('WITHDRAWALS_DISABLED');
      error.statusCode = 403;
      error.userMessage = 'Withdrawals are currently disabled. The system needs to grow and stabilize before fund withdrawals, digital or paper, are permitted. This protects all members from fraud.';
      throw error;
    }
  }
}

module.exports = SystemSettings;
