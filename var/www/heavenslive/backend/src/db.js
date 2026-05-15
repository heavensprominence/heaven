const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'heavenslive',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'heavenslive_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;
