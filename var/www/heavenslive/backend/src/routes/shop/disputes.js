const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const { sendDisputeNotification } = require('../../services/emailService');


// Notify parties about dispute actions
async function notifyDisputeParties(disputeId, action, byUser) {
    try {
        const d = await db.query(
            'SELECT d.*, u1.email as filer_email, u2.email as respondent_email FROM disputes d JOIN users u1 ON d.filed_by = u1.id JOIN users u2 ON d.filed_against = u2.id WHERE d.id = $1',
            [disputeId]
        );
        if (d.rows.length === 0) return;
        const dis = d.rows[0];
        const emails = [];
        if (byUser !== dis.filed_by) emails.push(dis.filer_email);
        if (byUser !== dis.filed_against) emails.push(dis.respondent_email);
        emails.forEach(email => {
            sendDisputeNotification(email, dis.title, action).catch(e => console.error('Dispute email failed:', e.message));
        });
    } catch(e) { console.error('Notify dispute error:', e.message); }
}

// File a new dispute
router.post('/', verifyToken, async (req, res) => {
    try {
        const filedBy = req.userId;
        const { purchaseId, listingId, filedAgainst, disputeType, title, description, desiredResolution } = req.body;
        
        // Verify the purchase belongs to this user
        const purchaseCheck = await db.query(
            'SELECT * FROM purchases WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
            [purchaseId, filedBy]
        );
        
        if (purchaseCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to dispute this transaction' });
        }
        
        const result = await db.query(`
            INSERT INTO disputes (purchase_id, listing_id, filed_by, filed_against, dispute_type, title, description, desired_resolution, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')
            RETURNING *
        `, [purchaseId, listingId, filedBy, filedAgainst, disputeType, title, description, desiredResolution]);
        
        res.status(201).json({ success: true, dispute: result.rows[0] });
        notifyDisputeParties(result.rows[0].id, 'new_dispute_filed', filedBy).catch(()=>{});
    } catch (error) {
        console.error('File dispute error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get disputes for current user
router.get('/my-disputes', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const disputes = await db.query(`
            SELECT d.*, 
                   l.title as listing_title, l.images[1] as listing_image,
                   u_filer.full_name as filer_name,
                   u_against.full_name as against_name,
                   p.amount_cents
            FROM disputes d
            JOIN listings l ON d.listing_id = l.id
            JOIN purchases p ON d.purchase_id = p.id
            JOIN users u_filer ON d.filed_by = u_filer.id
            JOIN users u_against ON d.filed_against = u_against.id
            WHERE d.filed_by = $1 OR d.filed_against = $1
            ORDER BY d.created_at DESC
        `, [userId]);
        
        res.json({ disputes: disputes.rows });
    } catch (error) {
        console.error('Get disputes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single dispute details
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
        // Check if user is involved or is admin
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [userId]
        );
        
        const dispute = await db.query(`
            SELECT d.*, 
                   l.title as listing_title, l.images,
                   u_filer.full_name as filer_name, u_filer.email as filer_email,
                   u_against.full_name as against_name, u_against.email as against_email,
                   p.amount_cents, p.status as purchase_status
            FROM disputes d
            JOIN listings l ON d.listing_id = l.id
            JOIN purchases p ON d.purchase_id = p.id
            JOIN users u_filer ON d.filed_by = u_filer.id
            JOIN users u_against ON d.filed_against = u_against.id
            WHERE d.id = $1
        `, [id]);
        
        if (dispute.rows.length === 0) {
            return res.status(404).json({ error: 'Dispute not found' });
        }
        
        const d = dispute.rows[0];
        if (d.filed_by !== userId && d.filed_against !== userId && isAdmin.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Get messages
        const messages = await db.query(`
            SELECT m.*, u.full_name as sender_name
            FROM dispute_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.dispute_id = $1
            ORDER BY m.created_at ASC
        `, [id]);
        
        // Get evidence
        const evidence = await db.query(
            'SELECT * FROM dispute_evidence WHERE dispute_id = $1 ORDER BY created_at ASC',
            [id]
        );
        
        res.json({
            dispute: d,
            messages: messages.rows,
            evidence: evidence.rows,
            isAdmin: isAdmin.rows.length > 0
        });
    } catch (error) {
        console.error('Get dispute error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add message to dispute
router.get('/:id/messages', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM dispute_messages WHERE dispute_id = \ ORDER BY created_at', [req.params.id]);
        res.json({ messages: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/:id/messages', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const senderId = req.userId;
        const { message } = req.body;
        
        // Check if user is involved or admin
        const dispute = await db.query('SELECT filed_by, filed_against FROM disputes WHERE id = $1', [id]);
        if (dispute.rows.length === 0) return res.status(404).json({ error: 'Dispute not found' });
        
        const d = dispute.rows[0];
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [senderId]
        );
        
        if (d.filed_by !== senderId && d.filed_against !== senderId && isAdmin.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const result = await db.query(`
            INSERT INTO dispute_messages (dispute_id, sender_id, message, is_admin_message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id, senderId, message, isAdmin.rows.length > 0]);
        
        res.status(201).json({ success: true, message: result.rows[0] });
    } catch (error) {
        console.error('Add message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all disputes
router.get('/admin/all', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [userId]
        );
        
        if (isAdmin.rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { status } = req.query;
        let query = `
            SELECT d.*, 
                   l.title as listing_title,
                   u_filer.full_name as filer_name,
                   u_against.full_name as against_name,
                   (SELECT COUNT(*) FROM dispute_messages WHERE dispute_id = d.id) as message_count
            FROM disputes d
            JOIN listings l ON d.listing_id = l.id
            JOIN users u_filer ON d.filed_by = u_filer.id
            JOIN users u_against ON d.filed_against = u_against.id
        `;
        const params = [];
        
        if (status && status !== 'all') {
            query += ' WHERE d.status = $1';
            params.push(status);
        }
        
        query += ' ORDER BY d.created_at DESC';
        
        const result = await db.query(query, params);
        res.json({ disputes: result.rows });
    } catch (error) {
        console.error('Admin disputes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update dispute status / resolve
router.put('/admin/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { status, resolution } = req.body;
        
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [userId]
        );
        
        if (isAdmin.rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        await db.query(`
            UPDATE disputes 
            SET status = $1, resolution = $2, resolved_by = $3, resolved_at = NOW(), updated_at = NOW()
            WHERE id = $4
        `, [status, resolution, userId, id]);
        
        // If resolved, release/refund escrow based on resolution
        if (status === 'resolved') {
            const dispute = await db.query('SELECT purchase_id FROM disputes WHERE id = $1', [id]);
            if (resolution === 'refund') {
                // Process refund
                await db.query('UPDATE purchases SET status = $1 WHERE id = $2', ['refunded', dispute.rows[0].purchase_id]);
            } else if (resolution === 'release') {
                // Release funds to seller
                await db.query('UPDATE purchases SET status = $1 WHERE id = $2', ['completed', dispute.rows[0].purchase_id]);
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Resolve dispute error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin resolves a dispute
router.post('/admin/resolve/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { ruling, resolution_notes, refund_amount_cents, reverse_transfer } = req.body;
        
        // Verify admin
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [userId]
        );
        if (isAdmin.rows.length === 0) return res.status(403).json({ error: 'Admin access required' });
        
        const dispute = await db.query('SELECT * FROM disputes WHERE id = $1', [id]);
        if (dispute.rows.length === 0) return res.status(404).json({ error: 'Dispute not found' });
        if (dispute.rows[0].status !== 'open') return res.status(400).json({ error: 'Dispute already resolved' });
        
        const d = dispute.rows[0];
        
        // Update dispute
        await db.query(
            'UPDATE disputes SET status = $1, resolution_notes = $2, resolved_by = $3, resolved_at = NOW() WHERE id = $4',
            [ruling, resolution_notes, userId, id]
        );
        
        // Handle refund if applicable
        // Auto-calculate 50/50 split if ruling is "split"
        let actualRefund = refund_amount_cents;
        if (ruling === "split" && d.purchase_id && !actualRefund) {
          const purchase = await db.query("SELECT amount_cents FROM purchases WHERE id = ", [d.purchase_id]);
          if (purchase.rows.length > 0) actualRefund = Math.round(purchase.rows[0].amount_cents / 2);
        }
        if (actualRefund && actualRefund > 0 && d.purchase_id) {
            // Refund logic — reverse the purchase
            const purchase = await db.query('SELECT * FROM purchases WHERE id = $1', [d.purchase_id]);
            if (purchase.rows.length > 0) {
                await db.query('UPDATE purchases SET status = $1 WHERE id = $2', ['refunded', d.purchase_id]);
                // Refund Credon if applicable
                if (purchase.rows[0].currency === 'Credon-USD') {
                    const Wallet = require('../../models/Wallet');
                    await Wallet.updateBalance(d.filed_by, refund_amount_cents);
                }
            }
        }
        
        // Handle transfer reversal if applicable
        if (reverse_transfer && d.transaction_id) {
            const tx = await db.query('SELECT * FROM wallet_transactions WHERE id = $1', [d.transaction_id]);
            if (tx.rows.length > 0) {
                const Wallet = require('../../models/Wallet');
                await Wallet.updateBalance(tx.rows[0].from_user_id, tx.rows[0].amount_cents);
                await Wallet.updateBalance(tx.rows[0].to_user_id, -tx.rows[0].amount_cents);
            }
        }
        
        // Add resolution message
        await db.query(
            'INSERT INTO dispute_messages (dispute_id, sender_id, message, is_admin_message) VALUES ($1, $2, $3, true)',
            [id, userId, 'Dispute resolved: ' + ruling + '. ' + (resolution_notes || '')]
        );
        
        res.json({ success: true, ruling, message: 'Dispute resolved' });
        notifyDisputeParties(id, 'admin_resolved_'+ruling, userId).catch(()=>{});
    } catch (error) {
        console.error('Resolve dispute error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Party agrees with the other party — resolves the dispute
router.post('/:id/agree', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
        const dispute = await db.query('SELECT * FROM disputes WHERE id = $1 AND status = $2', [id, 'open']);
        if (dispute.rows.length === 0) return res.status(404).json({ error: 'Dispute not found or already resolved' });
        
        const d = dispute.rows[0];
        if (userId !== d.filed_by && userId !== d.filed_against) {
            return res.status(403).json({ error: 'Not a party to this dispute' });
        }
        
        // Determine which party is conceding and which is winning
        const concedingParty = userId === d.filed_by ? 'filer' : 'respondent';
        const winningParty = concedingParty === 'filer' ? 'respondent' : 'filer';
        
        await db.query(
            'UPDATE disputes SET status = $1, resolution_notes = $2, resolved_by = $3, resolved_at = NOW() WHERE id = $4',
            ['mutual_agreement', concedingParty + ' agreed with ' + winningParty, userId, id]
        );
        
        await db.query(
            'INSERT INTO dispute_messages (dispute_id, sender_id, message, is_admin_message) VALUES ($1, $2, $3, false)',
            [id, userId, 'I agree with the other party. This dispute is resolved.']
        );
        
        res.json({ success: true, message: 'Dispute resolved by mutual agreement' });
        notifyDisputeParties(id, 'mutual_agreement', userId).catch(()=>{});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check for disputes past 14-day deadline — admin should review
router.get('/admin/overdue', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [userId]
        );
        if (isAdmin.rows.length === 0) return res.status(403).json({ error: 'Admin access required' });
        
        const result = await db.query(
            "SELECT * FROM disputes WHERE status = 'open' AND created_at < NOW() - INTERVAL '14 days' ORDER BY created_at"
        );
        res.json({ overdue: result.rows, count: result.rows.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
