const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const { getUserPlan, getPlans, canCreateListing } = require('../../services/subscriptionService');

// Get all available plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await getPlans();
        res.json({ plans });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user's plan
router.get('/my-plan', verifyToken, async (req, res) => {
    try {
        const plan = await getUserPlan(req.userId);
    console.log("DEBUG my-plan for user", req.userId, ":", JSON.stringify(plan));
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if user can create listing
router.get('/can-create', verifyToken, async (req, res) => {
    try {
        const result = await canCreateListing(req.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Subscribe to a plan (creates PayPal subscription)
router.post('/subscribe', verifyToken, async (req, res) => {
    try {
        const { planId, billingCycle } = req.body;
        const userId = req.userId;
        
        const plan = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
        if (plan.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
        
        // For free plan, activate immediately
        if (plan.rows[0].price_monthly_cents === 0) {
            const { applyPlanToUser } = require('../../services/subscriptionService');
            await applyPlanToUser(userId, planId);
            
            await db.query(`
                INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, status)
                VALUES ($1, $2, $3, 'active')
            `, [userId, planId, billingCycle]);
            
            return res.json({ success: true, message: 'Free plan activated!' });
        }
        
        // For paid plans
        const { paymentMethod, currency } = req.body;
        const priceCents = billingCycle === 'yearly' 
            ? (plan.rows[0].price_yearly_cents || plan.rows[0].price_monthly_cents * 12)
            : plan.rows[0].price_monthly_cents;
        
        if (paymentMethod === 'credon_wallet') {
            // Pay with Credon wallet balance
            let requiredUSD = priceCents;
            let payCurrency = currency || 'USD';
            
            // Convert clone/fiat to USD if needed
            if (payCurrency !== 'USD' && payCurrency !== 'Credon-USD') {
                try {
                    const { convertToUSD } = require('../../services/paypalService');
                    // Use a quick conversion via exchange rates
                    const axios = require('axios');
                    const rr = await axios.get('http://localhost:5000/api/wallet/exchange-rates', { timeout: 5000 });
                    const rates = rr.data.rates || {};
                    const base = payCurrency.startsWith('Credon-') ? payCurrency.slice(7) : payCurrency;
                    const rate = rates[base] || rates[payCurrency];
                    if (rate && rate.rate) {
                        requiredUSD = Math.round(priceCents / rate.rate);
                    }
                } catch (e) { console.log('Rate conversion failed:', e.message); }
            }
            
            const wallet = await db.query('SELECT balance_cents FROM wallets WHERE user_id = $1', [userId]);
            const balance = wallet.rows[0]?.balance_cents || 0;
            
            if (balance < requiredUSD) {
                return res.status(402).json({ 
                    error: 'Insufficient Credon wallet balance',
                    needed: requiredUSD,
                    balance,
                    currency: payCurrency
                });
            }
            
            // Deduct and activate
            await db.query('UPDATE wallets SET balance_cents = balance_cents - $1 WHERE user_id = $2', [requiredUSD, userId]);
            await db.query(
                "INSERT INTO transactions (user_id, amount_cents, type, description) VALUES ($1, $2, 'debit', $3)",
                [userId, -requiredUSD, `Subscription: ${plan.rows[0].name} (${billingCycle})`]
            );
            
            const { applyPlanToUser } = require('../../services/subscriptionService');
            await applyPlanToUser(userId, planId);
            
            await db.query(
                'INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, status, payment_method) VALUES ($1, $2, $3, $4, $5)',
                [userId, planId, billingCycle, 'active', 'credon_wallet']
            );
            
            return res.json({ 
                success: true, 
                message: `Plan activated! Paid ${(requiredUSD/100).toFixed(2)} USD via Credon wallet.`,
                plan: plan.rows[0].name,
                deducted: requiredUSD
            });
        }
        
        // Default: PayPal redirect
        const { createPayPalOrder } = require('../../services/paypalService');
        const order = await createPayPalOrder(
            priceCents / 100, 'USD',
            `Subscription: ${plan.rows[0].name} (${billingCycle})`,
            `sub-${userId}-${Date.now()}`,
            'subscription'
        );
        
        res.json({ 
            success: true, 
            approvalUrl: order.approvalUrl,
            message: 'Redirecting to PayPal...',
            plan: plan.rows[0].name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all subscriptions
router.get('/admin/all', verifyToken, async (req, res) => {
    try {
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [req.userId]
        );
        if (isAdmin.rows.length === 0) return res.status(403).json({ error: 'Admin required' });
        
        const result = await db.query(`
            SELECT us.*, u.email, p.name as plan_name
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN subscription_plans p ON us.plan_id = p.id
            ORDER BY us.created_at DESC
        `);
        res.json({ subscriptions: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// Cancel subscription (reverts to free at period end)
router.post('/cancel', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const freePlan = await db.query("SELECT id FROM subscription_plans WHERE slug = 'free'");
        
        await db.query(
            "UPDATE user_subscriptions SET auto_renew = false, status = 'cancelling' WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        
        res.json({ success: true, message: 'Subscription will be cancelled at period end' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reactivate cancelled subscription
router.post('/reactivate', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        await db.query(
            "UPDATE user_subscriptions SET auto_renew = true, status = 'active' WHERE user_id = $1 AND status = 'cancelling'",
            [userId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
