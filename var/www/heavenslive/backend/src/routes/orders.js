const express = require('express');
const router = express.Router();
const { createPayPalOrder } = require('../services/paypalService');

router.post('/', async (req, res) => {
  const { amountUsd, type } = req.body;
  
  try {
    console.log(`Creating PayPal order: $${amountUsd} for ${type}`);
    const paypalOrder = await createPayPalOrder(amountUsd, `${type} order`);
    
    const approvalUrl = paypalOrder.links.find(l => l.rel === 'approve').href;
    console.log(`Approval URL: ${approvalUrl}`);
    
    res.json({
      success: true,
      paypal_approval_url: approvalUrl,
      order: { id: paypalOrder.id }
    });
  } catch (error) {
    console.error('Order creation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
