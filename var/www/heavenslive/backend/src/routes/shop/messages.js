const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// Get all conversations for current user
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const result = await db.query(`
            SELECT 
                c.*,
                l.title as listing_title,
                l.images[1] as listing_image,
                u_buyer.full_name as buyer_name,
                u_buyer.email as buyer_email,
                u_seller.full_name as seller_name,
                u_seller.email as seller_email,
                (SELECT COUNT(*) FROM shop_messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count,
                (SELECT message FROM shop_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM shop_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
            FROM conversations c
            LEFT JOIN listings l ON c.listing_id = l.id
            LEFT JOIN users u_buyer ON c.buyer_id = u_buyer.id
            LEFT JOIN users u_seller ON c.seller_id = u_seller.id
            WHERE c.buyer_id = $1 OR c.seller_id = $1
            ORDER BY c.last_message_at DESC
        `, [userId]);
        
        res.json({ conversations: result.rows });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread message count
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const result = await db.query(`
            SELECT COUNT(*) as unread_count
            FROM shop_messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE (c.buyer_id = $1 OR c.seller_id = $1)
              AND m.sender_id != $1
              AND m.is_read = false
        `, [userId]);
        
        res.json({ unreadCount: parseInt(result.rows[0]?.unread_count) || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.userId;
        
        // Verify user is part of this conversation
        const convCheck = await db.query(
            'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
            [conversationId, userId]
        );
        
        if (convCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Mark messages as read
        await db.query(
            'UPDATE shop_messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false',
            [conversationId, userId]
        );
        
        // Get messages
        const messages = await db.query(`
            SELECT m.*, u.full_name as sender_name, u.email as sender_email
            FROM shop_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = $1
            ORDER BY m.created_at ASC
        `, [conversationId]);
        
        res.json({ messages: messages.rows });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start a new conversation or get existing one
router.post('/conversations', verifyToken, async (req, res) => {
    try {
        const { listingId, sellerId, initialMessage } = req.body;
        const buyerId = req.userId;
        
        if (buyerId === sellerId) {
            return res.status(400).json({ error: 'Cannot message yourself' });
        }
        
        await db.query('BEGIN');
        
        // Check if conversation already exists
        let convResult = await db.query(
            'SELECT * FROM conversations WHERE listing_id = $1 AND buyer_id = $2 AND seller_id = $3',
            [listingId, buyerId, sellerId]
        );
        
        let conversationId;
        
        if (convResult.rows.length === 0) {
            // Get listing title for subject
            const listing = await db.query('SELECT title FROM listings WHERE id = $1', [listingId]);
            const subject = listing.rows[0]?.title || 'General Inquiry';
            
            // Create new conversation
            const newConv = await db.query(`
                INSERT INTO conversations (listing_id, buyer_id, seller_id, subject, last_message_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING id
            `, [listingId, buyerId, sellerId, subject]);
            
            conversationId = newConv.rows[0].id;
        } else {
            conversationId = convResult.rows[0].id;
        }
        
        // Add the initial message if provided
        if (initialMessage) {
            await db.query(`
                INSERT INTO shop_messages (conversation_id, sender_id, message, is_read)
                VALUES ($1, $2, $3, false)
            `, [conversationId, buyerId, initialMessage]);
            
            // Update last_message_at
            await db.query('UPDATE conversations SET last_message_at = NOW() WHERE id = $1', [conversationId]);
        }
        
        await db.query('COMMIT');
        
        res.status(201).json({ 
            success: true, 
            conversationId,
            message: initialMessage ? 'Message sent!' : 'Conversation started!'
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Create conversation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send a message in an existing conversation
router.post('/conversations/:conversationId/messages', verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;
        const senderId = req.userId;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        
        // Verify user is part of this conversation
        const convCheck = await db.query(
            'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
            [conversationId, senderId]
        );
        
        if (convCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await db.query('BEGIN');
        
        // Insert message
        await db.query(`
            INSERT INTO shop_messages (conversation_id, sender_id, message, is_read)
            VALUES ($1, $2, $3, false)
        `, [conversationId, senderId, message.trim()]);
        
        // Update last_message_at
        await db.query('UPDATE conversations SET last_message_at = NOW() WHERE id = $1', [conversationId]);
        
        await db.query('COMMIT');
        
        res.status(201).json({ success: true, message: 'Message sent!' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// Translate a message (opt-in)
router.post('/messages/:id/translate', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { targetLang } = req.body;
        
        const message = await db.query(
            'SELECT * FROM messages WHERE id = $1', [id]
        );
        
        if (message.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        const translated = await translateMessage(
            message.rows[0].message, 
            targetLang || 'en'
        );
        
        res.json({ translated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
