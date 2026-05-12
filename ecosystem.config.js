module.exports = {
  apps: [{
    name: 'heavenslive-api',
    cwd: '/var/www/heavenslive/backend',
    script: 'src/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'heavenslive_db',
      DB_USER: 'heavenslive',
      DB_PASSWORD: 'hl940857',
      JWT_SECRET: '940857962329TrinhTuyetTrangHueThiNguyen1987DanMatthewMirkalami2016ViDaoHo2009',
      TESTING_MODE: 'true',
      MOCK_CURRENCY_ENABLED: 'true',
      PAYPAL_CLIENT_ID: 'AVFS9GYd4ZphFuDlYYxjIBOsgXog9REdcgh6t8PsLHgJ80TyL-lA9Szs7hsHN2rMMLETJKTxsWb0AxR3',
      PAYPAL_CLIENT_SECRET: 'EPhEJIy_Pui9ftrOncFb_g6GqPzwTDsNEUNXfxy-u-cwPMPSrSpB0kMnXpj7M72RCOzzjuAxiqU5CfNQ',
      PAYPAL_MODE: 'live',
      FRONTEND_URL: 'https://heavenslive.com',
      PAYPAL_RETURN_URL: 'https://heavenslive.com/credon/payment-success',
      PAYPAL_CANCEL_URL: 'https://heavenslive.com/credon/payment-cancel',
      EMAIL_HOST: 'smtp.ionos.com',
      EMAIL_PORT: '587',
      EMAIL_SECURE: 'false',
      EMAIL_USER: 'no_reply@heavenslive.com',
      EMAIL_PASS: 'pD3yXSCt5x9qf5c',
      EMAIL_FROM: 'no_reply@heavenslive.com',
      SHIPENGINE_API_KEY: 'a6JwCYPitRrUBVZduK8KIB66hdhkRf/dnMIWsvWeq2Y',
      SHIPENGINE_CARRIER_IDS: 'se-5352697,se-5352698,se-5352699',
      SHIPENGINE_FROM_ADDRESS: 'Toronto,ON,Canada'
    }
  }]
}