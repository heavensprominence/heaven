module.exports = {
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Password Hashing
  bcryptRounds: 12,
  
  // Rate Limiting
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitLoginMax: 10,
  rateLimitMax: 100,
  
  // Session
  sessionSecret: process.env.SESSION_SECRET,
  
  // Testing Mode Flag
  isTestingMode: process.env.TESTING_MODE === 'true',
  isMockCurrencyEnabled: process.env.MOCK_CURRENCY_ENABLED === 'true',
};