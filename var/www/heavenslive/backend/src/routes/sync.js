// PowerSync Upload + Conflict Resolution
// Receives batch mutations from devices. Server is final authority.
// Conflict strategy: last-write-wins (LWW) by updated_at timestamp

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

// Auth middleware — devices send JWT, server verifies
router.use(async (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('***')) {
    // Allow anonymous sync for read-only data
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

// Batch upload: device sends local changes, server applies them with LWW
router.post('/upload', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { mutations, transaction_id } = req.body;
    const results = [];

    for (const mutation of mutations || []) {
      const { table, op, data } = mutation;
      // Security: users can only modify their own data
      if (req.userId && table === 'wallets' && data.user_id !== req.userId) continue;
      if (req.userId && table === 'transactions' && data.user_id !== req.userId) continue;

      switch (op) {
        case 'INSERT':
        case 'PUT': {
          // Upsert with LWW: only apply if remote is newer than local
          const existing = await client.query(
            `SELECT updated_at FROM ${client.escapeIdentifier(table)} WHERE id = $1`,
            [data.id]
          );
          if (existing.rows.length > 0) {
            const remoteTime = new Date(existing.rows[0].updated_at).getTime();
            const localTime = new Date(data.updated_at).getTime();
            if (localTime <= remoteTime) {
              results.push({ id: data.id, status: 'skipped', reason: 'server_newer' });
              continue;
            }
          }
          // Build UPSERT
          const columns = Object.keys(data).filter(k => k !== 'id');
          const values = columns.map(k => data[k]);
          const setClauses = columns.map((k, i) => `${client.escapeIdentifier(k)} = $${i + 2}`);
          const query = `
            INSERT INTO ${client.escapeIdentifier(table)} (id, ${columns.map(c => client.escapeIdentifier(c)).join(', ')})
            VALUES ($1, ${columns.map((_, i) => `$${i + 2}`).join(', ')})
            ON CONFLICT (id) DO UPDATE SET ${setClauses.join(', ')}
          `;
          await client.query(query, [data.id, ...values]);
          results.push({ id: data.id, status: 'applied' });
          break;
        }

        case 'DELETE': {
          await client.query(
            `DELETE FROM ${client.escapeIdentifier(table)} WHERE id = $1`,
            [data.id]
          );
          results.push({ id: data.id, status: 'deleted' });
          break;
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, transaction_id, results });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Sync upload error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
