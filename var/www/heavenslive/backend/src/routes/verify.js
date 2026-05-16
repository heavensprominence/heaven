/**
 * Currency Verification API — Anti-Counterfeit
 * Public endpoint: anyone can verify a serial number
 */
const express = require('express');
const router = express.Router();
const SerialRegistry = require('../services/serialRegistry');

// GET /api/verify/:serial — Public verification (no auth required)
router.get('/:serial', async (req, res) => {
    try {
        const { serial } = req.params;
        if (!serial || !serial.startsWith('HL-')) {
            return res.status(400).json({ 
                authentic: false, 
                error: 'Invalid serial format. Valid format: HL-XXX-XXXXXXXX' 
            });
        }

        const result = await SerialRegistry.verify(serial, req.ip);
        
        if (!result.authentic) {
            return res.status(404).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/verify — Verification stats
router.get('/', async (req, res) => {
    try {
        const stats = await SerialRegistry.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
