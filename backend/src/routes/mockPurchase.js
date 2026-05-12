const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  console.log('Mock purchase request:', req.body);
  res.json({ 
    success: true, 
    message: 'Mock purchase successful',
    bonus_amount: 100,
    total_credits: 110
  });
});

module.exports = router;
