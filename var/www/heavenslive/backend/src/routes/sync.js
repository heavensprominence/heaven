// PowerSync Upload + Immutable Data Protection
// Server is the final authority. First-write-wins (FWW).
// Once written, data cannot be overwritten — only replaced by new records.

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Auth middleware
router.use(async (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('***')) {
    req.userId = null;
    return next();
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(auth.replace('***', ''), process.env.JWT_SECRET);
    req.userId = decoded.id || decoded.userId;
  } catch (_) {
    req.userId = null;
  }
  next();
});

// Immutable tables — first write wins, no edits allowed
const IMMUTABLE = ['transactions', 'listings', 'orders', 'bids', 'audit_logs'];

router.post('/upload', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { mutations } = req.body;
    const results = [];

    for (const mutation of mutations || []) {
      const { table, op, data } = mutation;

      // Security: users can only modify their own data
      if (req.userId && data.user_id && data.user_id !== req.userId) {
        results.push({ id: data.id, status: 'rejected', reason: 'not_owner' });
        continue;
      }

      switch (op) {
        case 'INSERT':
        case 'PUT': {
          // Immutable tables: first-write-wins
          if (IMMUTABLE.includes(table)) {
            const existing = await client.query(
              `SELECT id FROM ${client.escapeIdentifier(table)} WHERE id = $1`,
              [data.id]
            );
            if (existing.rows.length > 0) {
              // Server already has this record — reject the write
              results.push({ id: data.id, status: 'rejected', reason: 'immutable_exists' });
              continue;
            }
          }

          // Wallets: server balance always wins (anti-tampering)
          if (table === 'wallets' && op === 'PUT') {
            const serverWallet = await client.query(
              `SELECT balance_cents FROM wallets WHERE id = $1`,
              [data.id]
            );
            if (serverWallet.rows.length > 0) {
              // Preserve server's balance — override device value
              const correctBalance = serverWallet.rows[0].balance_cents;
              data.balance_cents = correctBalance;
            }
          }

          // Insert new record
          const columns = Object.keys(data).filter(k => k !== 'id');
          const values = columns.map(k => data[k]);
          const query = `
            INSERT INTO ${client.escapeIdentifier(table)} (id, ${columns.map(c => client.escapeIdentifier(c)).join(', ')})
            VALUES ($1, ${columns.map((_, i) => `$${i + 2}`).join(', ')})
            ON CONFLICT (id) DO NOTHING
          `;
          await client.query(query, [data.id, ...values]);
          results.push({ id: data.id, status: 'inserted' });
          break;
        }

        case 'DELETE':
          // Never delete immutable data
          if (IMMUTABLE.includes(table)) {
            results.push({ id: data.id, status: 'rejected', reason: 'immutable_no_delete' });
            continue;
          }
          await client.query(
            `DELETE FROM ${client.escapeIdentifier(table)} WHERE id = $1`,
            [data.id]
          );
          results.push({ id: data.id, status: 'deleted' });
          break;
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, results });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Sync upload error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
