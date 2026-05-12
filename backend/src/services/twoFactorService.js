/**
 * Multi-Provider 2FA Service
 * Email (already working) + TOTP (already working) + Telegram + WhatsApp
 * 
 * Env vars:
 *   TELEGRAM_BOT_TOKEN — from @BotFather
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER — from Twilio
 */
const db = require('../db');
const crypto = require('crypto');

// === TELEGRAM 2FA ===
async function sendTelegramCode(userId, email, code) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    // Look up user's Telegram chat ID (stored during setup)
    const result = await db.query(
      'SELECT telegram_chat_id FROM user_2fa_settings WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0 || !result.rows[0].telegram_chat_id) return false;

    const chatId = result.rows[0].telegram_chat_id;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔐 *HeavensLive Verification Code*\n\nYour code is: *${code}*\n\nExpires in 10 minutes.`,
        parse_mode: 'Markdown',
      }),
    });
    return true;
  } catch (err) {
    console.error('Telegram 2FA error:', err.message);
    return false;
  }
}

// === WHATSAPP 2FA (via Twilio) ===
async function sendWhatsAppCode(userId, email, code) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!sid || !auth || !from) return false;

  try {
    // Look up user's WhatsApp number
    const result = await db.query(
      'SELECT whatsapp_number FROM user_2fa_settings WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0 || !result.rows[0].whatsapp_number) return false;

    const to = result.rows[0].whatsapp_number;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const authStr = Buffer.from(`${sid}:${auth}`).toString('base64');

    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authStr}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:${to}`,
        Body: `🔐 HeavensLive Verification Code: ${code}\n\nExpires in 10 minutes.`,
      }).toString(),
    });
    return true;
  } catch (err) {
    console.error('WhatsApp 2FA error:', err.message);
    return false;
  }
}

// === UNIFIED 2FA CODE SENDER ===
// Tries all enabled providers for the user
async function send2FACode(userId, email, code) {
  const results = { email: false, totp: false, telegram: false, whatsapp: false };
  
  // Check user's 2FA preferences
  const prefs = await db.query(
    'SELECT * FROM user_2fa_settings WHERE user_id = $1',
    [userId]
  );
  const settings = prefs.rows[0] || {};

  // Send via enabled channels
  if (settings.telegram_enabled) {
    results.telegram = await sendTelegramCode(userId, email, code);
  }
  if (settings.whatsapp_enabled) {
    results.whatsapp = await sendWhatsAppCode(userId, email, code);
  }
  // Email is always available as fallback
  results.email = true; // Sent separately by email service

  return results;
}

// === 2FA SETTINGS MANAGEMENT ===

// Get user's 2FA preferences
async function getUser2FASettings(userId) {
  const result = await db.query(
    'SELECT * FROM user_2fa_settings WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) {
    // Create defaults
    await db.query(
      'INSERT INTO user_2fa_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [userId]
    );
    return {
      telegram_enabled: false,
      telegram_chat_id: null,
      whatsapp_enabled: false,
      whatsapp_number: null,
      preferred_method: 'email',
    };
  }
  return result.rows[0];
}

// Set Telegram chat ID
async function setTelegramChatId(userId, chatId) {
  await db.query(
    `INSERT INTO user_2fa_settings (user_id, telegram_chat_id, telegram_enabled)
     VALUES ($1, $2, true)
     ON CONFLICT (user_id) DO UPDATE SET telegram_chat_id = $2, telegram_enabled = true`,
    [userId, chatId]
  );
}

// Set WhatsApp number
async function setWhatsAppNumber(userId, phoneNumber) {
  await db.query(
    `INSERT INTO user_2fa_settings (user_id, whatsapp_number, whatsapp_enabled)
     VALUES ($1, $2, true)
     ON CONFLICT (user_id) DO UPDATE SET whatsapp_number = $2, whatsapp_enabled = true`,
    [userId, phoneNumber]
  );
}

// Set preferred 2FA method
async function setPreferredMethod(userId, method) {
  await db.query(
    `INSERT INTO user_2fa_settings (user_id, preferred_method)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET preferred_method = $2`,
    [userId, method]
  );
}

module.exports = {
  send2FACode,
  sendTelegramCode,
  sendWhatsAppCode,
  getUser2FASettings,
  setTelegramChatId,
  setWhatsAppNumber,
  setPreferredMethod,
};
