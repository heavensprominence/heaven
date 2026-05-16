const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Bid = require('../models/Bid');
const Wallet = require('../models/Wallet');

// CREATE a bid
router.post('/', verifyToken, async (req, res) => {
  const { type, fromCurrency, toCurrency, amount, exchangeRate } = req.body;
  
  // Validate amount (minimum 1 Credon-USD equivalent)
  if (amount < 1) {
    return res.status(400).json({ error: 'Minimum bid amount is 1 Credon-USD' });
  }
  
  // Convert amount to cents if fromCurrency is Credon-USD
  let amountCents;
  if (fromCurrency === 'Credon-USD') {
    amountCents = amount * 100;
  } else {
    // For mock, assume 1:1 for non-Credon currencies
    amountCents = amount * 100;
  }
  
  try {
    // Check if user has sufficient balance for sell orders
    if (type === 'sell') {
      const balance = await Wallet.getBalance(req.userId);
      if (balance < amountCents) {
        return res.status(400).json({ error: 'Insufficient balance for this sell order' });
      }
    }
    
    const bid = await Bid.create({
      userId: req.userId,
      type,
      fromCurrency,
      toCurrency,
      amountCents,
      exchangeRate
    });
    
    res.json({
      ...bid,
      testing_disclaimer: "THIS IS A MOCK BID FOR TESTING ONLY. No real currency is being exchanged."
    });
  } catch (error) {
    console.error('Create bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET open bids for a currency pair
router.get('/open', async (req, res) => {
  const { from, to, type } = req.query;
  
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required parameters: from, to' });
  }
  
  try {
    const bids = await Bid.getOpenBids(from, to, type);
    res.json({
      bids,
      count: bids.length,
      testing_disclaimer: "THESE ARE MOCK BIDS FOR TESTING ONLY"
    });
  } catch (error) {
    console.error('Get open bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET user's bids
router.get('/my-bids', verifyToken, async (req, res) => {
  const { status } = req.query;
  
  try {
    const bids = await Bid.getUserBids(req.userId, status);
    res.json({ bids });
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CANCEL a bid
router.delete('/:bidId', verifyToken, async (req, res) => {
  const { bidId } = req.params;
  
  try {
    const cancelled = await Bid.cancelBid(bidId, req.userId);
    if (!cancelled) {
      return res.status(404).json({ error: 'Bid not found or cannot be cancelled' });
    }
    
    res.json({ message: 'Bid cancelled successfully', bid: cancelled });
  } catch (error) {
    console.error('Cancel bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MOCK match bids (admin only in real implementation)
router.post('/mock-match', verifyToken, async (req, res) => {
  const { buyBidId, sellBidId } = req.body;
  
  // In testing mode, anyone can trigger a mock match
  try {
    const match = await Bid.matchBids(buyBidId, sellBidId);
    res.json({
      ...match,
      testing_disclaimer: "THIS IS A MOCK BID MATCH FOR TESTING ONLY. No real currency has been exchanged."
    });
  } catch (error) {
    console.error('Match bids error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;