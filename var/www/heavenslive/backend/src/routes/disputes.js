const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Dispute = require('../models/Dispute');

// Create a dispute
router.post('/', verifyToken, async (req, res) => {
  const { title, description, transactionId } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  
  try {
    const dispute = await Dispute.create({
      userId: req.userId,
      transactionId: transactionId || null,
      orderId: null,
      title,
      description
    });
    
    res.status(201).json({
      dispute,
      message: 'Dispute filed successfully. You will receive updates via email.'
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's disputes
router.get('/my-disputes', verifyToken, async (req, res) => {
  try {
    const disputes = await Dispute.getUserDisputes(req.userId);
    res.json({ disputes });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dispute by ID
router.get('/:disputeId', verifyToken, async (req, res) => {
  const { disputeId } = req.params;
  
  try {
    const dispute = await Dispute.getById(disputeId);
    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    
    if (dispute.user_id !== req.userId && !req.isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json({ dispute });
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add note to dispute
router.post('/:disputeId/note', verifyToken, async (req, res) => {
  const { disputeId } = req.params;
  const { note } = req.body;
  
  if (!note) {
    return res.status(400).json({ error: 'Note is required' });
  }
  
  try {
    const dispute = await Dispute.getById(disputeId);
    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    
    if (dispute.user_id !== req.userId && !req.isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const updated = await Dispute.addNote(disputeId, note, req.userId, req.isSuperAdmin);
    res.json({ message: 'Note added', dispute: updated });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;