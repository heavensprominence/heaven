/**
 * Currency Serial Number System
 * 
 * Every printed Credon note has a unique serial: HL-{CURRENCY}-{8-DIGIT-SEQ}
 * Format: HL-USD-00000001, HL-EUR-00000001, etc.
 * 
 * Verification: GET /api/verify/HL-USD-00000001
 * Returns: currency, denomination, batch, status, authenticity guarantees
 */
const crypto = require('crypto');
const db = require('../db');

class SerialRegistry {
  /**
   * Generate the next serial number for a currency.
   */
  static async generateSerial(currency) {
    // Get or create counter
    let counter = await db.query(
      'SELECT last_sequence FROM serial_counters WHERE currency = $1',
      [currency]
    );
    
    let seq;
    if (counter.rows.length === 0) {
      seq = 1;
      await db.query(
        'INSERT INTO serial_counters (currency, last_sequence, prefix) VALUES ($1, $2, $3)',
        [currency, seq, `HL-${currency}`]
      );
    } else {
      seq = parseInt(counter.rows[0].last_sequence) + 1;
      await db.query(
        'UPDATE serial_counters SET last_sequence = $1 WHERE currency = $2',
        [seq, currency]
      );
    }
    
    return `HL-${currency}-${String(seq).padStart(8, '0')}`;
  }

  /**
   * Register a batch of notes for printing.
   */
  static async registerBatch(currency, denominationCents, denominationValue, count, batchId) {
    const serials = [];
    for (let i = 0; i < count; i++) {
      const serial = await this.generateSerial(currency);
      // Generate a design hash for tamper detection
      const designHash = crypto.createHash('sha256')
        .update(`${serial}|${currency}|${denominationCents}|${batchId}|${Date.now()}`)
        .digest('hex').substring(0, 16);
      
      await db.query(
        `INSERT INTO currency_serials (serial_number, currency, denomination_cents, denomination_value, 
         front_design_hash, print_batch, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending_print')`,
        [serial, currency, denominationCents, denominationValue, designHash, batchId]
      );
      serials.push({ serial, designHash });
    }
    return { batchId, currency, count, serials };
  }

  /**
   * Mark serials as printed (called when printing press confirms).
   */
  static async markPrinted(serials, printerId) {
    for (const serial of serials) {
      await db.query(
        `UPDATE currency_serials SET status = 'printed', printed_at = NOW(), printer_id = $1
         WHERE serial_number = $2`,
        [printerId, serial]
      );
    }
    return { printed: serials.length };
  }

  /**
   * Verify a serial number — public anti-counterfeit check.
   */
  static async verify(serialNumber, ipAddress = null) {
    const result = await db.query(
      `SELECT cs.*, pco.id as order_id FROM currency_serials cs
       LEFT JOIN paper_currency_orders pco ON cs.order_id = pco.id
       WHERE cs.serial_number = $1`,
      [serialNumber]
    );

    // Log the verification attempt
    const verified = result.rows.length > 0;
    const details = verified ? {
      currency: result.rows[0].currency,
      denomination: result.rows[0].denomination_value,
      status: result.rows[0].status,
      design_hash: result.rows[0].front_design_hash,
      print_batch: result.rows[0].print_batch,
      printed_at: result.rows[0].printed_at,
    } : { serial_number: serialNumber };

    await db.query(
      `INSERT INTO currency_verifications (serial_number, verified_by_ip, result, details)
       VALUES ($1, $2, $3, $4)`,
      [serialNumber, ipAddress, verified ? 'authentic' : 'counterfeit', JSON.stringify(details)]
    );

    if (verified) {
      await db.query(
        'UPDATE currency_serials SET verified_count = verified_count + 1, last_verified_at = NOW() WHERE serial_number = $1',
        [serialNumber]
      );
    }

    return {
      authentic: verified,
      serial_number: serialNumber,
      ...details,
      verification_id: verified ? null : 'COUNTERFEIT — This serial does not exist in the Credon registry',
      verified_at: new Date().toISOString(),
    };
  }

  /**
   * Get verification statistics.
   */
  static async getStats() {
    const total = await db.query('SELECT COUNT(*) as count FROM currency_serials');
    const printed = await db.query("SELECT COUNT(*) as count FROM currency_serials WHERE status = 'printed'");
    const verifications = await db.query('SELECT COUNT(*) as count FROM currency_verifications');
    const counterfeits = await db.query("SELECT COUNT(*) as count FROM currency_verifications WHERE result = 'counterfeit'");

    return {
      total_serials: parseInt(total.rows[0].count),
      printed: parseInt(printed.rows[0].count),
      total_verifications: parseInt(verifications.rows[0].count),
      counterfeits_detected: parseInt(counterfeits.rows[0].count),
    };
  }
}

module.exports = SerialRegistry;
