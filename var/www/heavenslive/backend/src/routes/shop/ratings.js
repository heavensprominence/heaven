const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// Get pending ratings for a user (transactions that need rating)
router.get('/pending', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Purchases where user was buyer and hasn't rated seller yet
        const buyerPending = await db.query(`
            SELECT 
                p.id as purchase_id, p.listing_id, p.amount_cents, p.created_at,
                l.title, l.images,
                u.id as seller_id, u.full_name as seller_name, u.email as seller_email,
                'seller' as rate_type
            FROM purchases p
            JOIN listings l ON p.listing_id = l.id
            JOIN users u ON p.seller_id = u.id
            WHERE p.buyer_id = $1 
              AND p.status IN ('paid', 'completed', 'shipped', 'delivered')
              AND NOT EXISTS (
                  SELECT 1 FROM transaction_ratings 
                  WHERE purchase_id = p.id AND rater_id = $1 AND rating_type = 'seller_rating'
              )
        `, [userId]);
        
        // Purchases where user was seller and hasn't rated buyer yet
        const sellerPending = await db.query(`
            SELECT 
                p.id as purchase_id, p.listing_id, p.amount_cents, p.created_at,
                l.title, l.images,
                u.id as buyer_id, u.full_name as buyer_name, u.email as buyer_email,
                'buyer' as rate_type
            FROM purchases p
            JOIN listings l ON p.listing_id = l.id
            JOIN users u ON p.buyer_id = u.id
            WHERE p.seller_id = $1 
              AND p.status IN ('paid', 'completed', 'shipped', 'delivered')
              AND NOT EXISTS (
                  SELECT 1 FROM transaction_ratings 
                  WHERE purchase_id = p.id AND rater_id = $1 AND rating_type = 'buyer_rating'
              )
        `, [userId]);
        
        res.json({
            pending: {
                asBuyer: buyerPending.rows,
                asSeller: sellerPending.rows
            }
        });
    } catch (error) {
        console.error('Pending ratings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit a rating
router.post('/', verifyToken, async (req, res) => {
    try {
        const raterId = req.userId;
        const { 
            purchaseId, listingId, rateeId, ratingType,
            overallRating, communicationRating, 
            paymentSpeedRating, shippingSpeedRating, itemAccuracyRating,
            feedback 
        } = req.body;
        
        // Validate the purchase belongs to this user
        const purchaseCheck = await db.query(
            'SELECT * FROM purchases WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
            [purchaseId, raterId]
        );
        
        if (purchaseCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to rate this transaction' });
        }
        
        await db.query('BEGIN');
        
        // Insert the rating
        await db.query(`
            INSERT INTO transaction_ratings 
            (purchase_id, listing_id, rater_id, ratee_id, rating_type,
             overall_rating, communication_rating, payment_speed_rating,
             shipping_speed_rating, item_accuracy_rating, feedback)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [purchaseId, listingId, raterId, rateeId, ratingType,
            overallRating, communicationRating, paymentSpeedRating,
            shippingSpeedRating, itemAccuracyRating, feedback]);
        
        // Update the user's rating summary
        await updateUserRatingSummary(rateeId, ratingType);
        
        await db.query('COMMIT');
        
        res.json({ success: true, message: 'Rating submitted! Thank you for your feedback.' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Submit rating error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to update rating summaries
async function updateUserRatingSummary(userId, ratingType) {
    // Ensure summary record exists
    await db.query(`
        INSERT INTO user_rating_summaries (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
    `, [userId]);
    
    if (ratingType === 'seller_rating') {
        const stats = await db.query(`
            SELECT 
                COALESCE(AVG(overall_rating), 0) as avg_rating,
                COUNT(*) as total_ratings,
                COALESCE(AVG(communication_rating), 0) as comm_avg,
                COALESCE(AVG(shipping_speed_rating), 0) as shipping_avg,
                COALESCE(AVG(item_accuracy_rating), 0) as accuracy_avg
            FROM transaction_ratings
            WHERE ratee_id = $1 AND rating_type = 'seller_rating'
        `, [userId]);
        
        const s = stats.rows[0];
        await db.query(`
            UPDATE user_rating_summaries
            SET seller_avg_rating = $1, seller_total_ratings = $2,
                seller_communication_avg = $3, seller_shipping_avg = $4,
                seller_item_accuracy_avg = $5, updated_at = NOW()
            WHERE user_id = $6
        `, [s.avg_rating, s.total_ratings, s.comm_avg, s.shipping_avg, s.accuracy_avg, userId]);
    } else {
        const stats = await db.query(`
            SELECT 
                COALESCE(AVG(overall_rating), 0) as avg_rating,
                COUNT(*) as total_ratings,
                COALESCE(AVG(communication_rating), 0) as comm_avg,
                COALESCE(AVG(payment_speed_rating), 0) as payment_avg
            FROM transaction_ratings
            WHERE ratee_id = $1 AND rating_type = 'buyer_rating'
        `, [userId]);
        
        const s = stats.rows[0];
        await db.query(`
            UPDATE user_rating_summaries
            SET buyer_avg_rating = $1, buyer_total_ratings = $2,
                buyer_communication_avg = $3, buyer_payment_speed_avg = $4,
                updated_at = NOW()
            WHERE user_id = $5
        `, [s.avg_rating, s.total_ratings, s.comm_avg, s.payment_avg, userId]);
    }
}

// Get a user's rating summary
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const summary = await db.query(`
            SELECT * FROM user_rating_summaries WHERE user_id = $1
        `, [userId]);
        
        const recent = await db.query(`
            SELECT 
                r.*, 
                u.full_name as rater_name,
                l.title as listing_title
            FROM transaction_ratings r
            JOIN users u ON r.rater_id = u.id
            JOIN listings l ON r.listing_id = l.id
            WHERE r.ratee_id = $1 AND r.is_public = true
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [userId]);
        
        res.json({
            summary: summary.rows[0] || { seller_avg_rating: 0, buyer_avg_rating: 0 },
            recent: recent.rows
        });
    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get ratings received by current user
router.get('/received', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const ratings = await db.query(`
            SELECT 
                r.*,
                u.full_name as rater_name,
                l.title as listing_title,
                p.amount_cents
            FROM transaction_ratings r
            JOIN users u ON r.rater_id = u.id
            JOIN listings l ON r.listing_id = l.id
            JOIN purchases p ON r.purchase_id = p.id
            WHERE r.ratee_id = $1
            ORDER BY r.created_at DESC
        `, [userId]);
        
        res.json({ ratings: ratings.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ratings given by current user
router.get('/given', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const ratings = await db.query(`
            SELECT 
                r.*,
                u.full_name as ratee_name,
                l.title as listing_title
            FROM transaction_ratings r
            JOIN users u ON r.ratee_id = u.id
            JOIN listings l ON r.listing_id = l.id
            WHERE r.rater_id = $1
            ORDER BY r.created_at DESC
        `, [userId]);
        
        res.json({ ratings: ratings.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
