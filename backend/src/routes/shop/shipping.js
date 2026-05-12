/**
 * Shipping Routes — EasyShip powered
 * Multi-carrier rates (3+ options), labels, tracking, landed cost (tax/duties)
 */
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const {
  getShippingRates,
  createShipment,
  trackShipment,
  calculateLandedCost,
} = require('../../services/easyShipService');

/**
 * GET /api/shop/shipping/rates
 * Get shipping rates with 3+ courier options.
 * Supports guest checkout (optional auth).
 */
router.post('/rates', async (req, res) => {
  try {
    const { shipFrom, shipTo, packages, options } = req.body;

    if (!shipTo || !shipTo.postalCode) {
      return res.status(400).json({ error: 'Destination address with postal code required' });
    }

    const rates = await getShippingRates(shipFrom || {}, shipTo, packages || [], options || {});
    res.json({ rates, count: rates.length });
  } catch (error) {
    console.error('Shipping rates error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shop/shipping/landed-cost
 * Calculate taxes and duties for international orders.
 */
router.post('/landed-cost', async (req, res) => {
  try {
    const { shipFrom, shipTo, items, currency } = req.body;

    if (!shipTo || !items || items.length === 0) {
      return res.status(400).json({ error: 'Destination and items required' });
    }

    const landedCost = await calculateLandedCost(shipFrom || {}, shipTo, items, currency);
    res.json({ landed_cost: landedCost });
  } catch (error) {
    console.error('Landed cost error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shop/shipping/create-label
 * Create shipment and generate label (seller only).
 */
router.post('/create-label', verifyToken, async (req, res) => {
  try {
    const { shipFrom, shipTo, packages, rateId, options } = req.body;

    if (!rateId || !shipTo) {
      return res.status(400).json({ error: 'Rate ID and destination required' });
    }

    if (rateId === 'local_pickup' || rateId === 'mock_pickup') {
      return res.json({
        label: {
          tracking_number: 'PICKUP-' + Date.now(),
          label_url: null,
          courier_name: 'Local Pickup',
          status: 'pickup_scheduled',
        },
      });
    }

    const label = await createShipment(shipFrom || {}, shipTo, packages || [], rateId, options || {});
    res.json({ label });
  } catch (error) {
    console.error('Create label error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shop/shipping/track/:trackingNumber
 * Track a shipment (public).
 */
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { courierId } = req.query;
    const tracking = await trackShipment(trackingNumber, courierId);
    if (!tracking) return res.status(404).json({ error: 'Tracking not found' });
    res.json({ tracking });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
