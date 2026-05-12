module.exports = {
  apps: [{
    name: 'heavenslive-api',
    cwd: '/var/www/heavenslive/backend',
    script: 'src/index.js',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || '5000',
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      TESTING_MODE: process.env.TESTING_MODE,
      MOCK_CURRENCY_ENABLED: process.env.MOCK_CURRENCY_ENABLED,
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
      PAYPAL_MODE: process.env.PAYPAL_MODE,
      FRONTEND_URL: process.env.FRONTEND_URL,
      PAYPAL_RETURN_URL: process.env.PAYPAL_RETURN_URL,
      PAYPAL_CANCEL_URL: process.env.PAYPAL_CANCEL_URL,
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_SECURE: process.env.EMAIL_SECURE,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
      EMAIL_FROM: process.env.EMAIL_FROM,
      SHIPENGINE_API_KEY: process.env.SHIPENGINE_API_KEY,
      SHIPENGINE_CARRIER_IDS: process.env.SHIPENGINE_CARRIER_IDS,
      SHIPENGINE_FROM_ADDRESS: process.env.SHIPENGINE_FROM_ADDRESS
    }
  }]
}