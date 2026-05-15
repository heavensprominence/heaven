const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const { getPredictiveInsights, getMarketTrends, getSellerPerformanceScore } = require('../../services/advancedAnalytics');

// Get predictive insights for seller
router.get('/predictive', verifyToken, async (req, res) => {
    try {
        const { category } = req.query;
        const insights = await getPredictiveInsights(req.userId, category);
        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get market trends
router.get('/market-trends', async (req, res) => {
    try {
        const { category, days } = req.query;
        const trends = await getMarketTrends(category, parseInt(days) || 30);
        res.json(trends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get seller performance score
router.get('/performance', verifyToken, async (req, res) => {
    try {
        const score = await getSellerPerformanceScore(req.userId);
        res.json(score);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
