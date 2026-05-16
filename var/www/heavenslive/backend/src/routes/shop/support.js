const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const nodemailer = require('nodemailer');

// Email configuration
const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ionos.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'no_reply@heavenslive.com',
            pass: process.env.EMAIL_PASS
        }
    });
};

// Get help articles
router.get('/help/articles', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT id, title, slug, category, views FROM help_articles WHERE is_published = true';
        const params = [];
        
        if (category && category !== 'all') {
            query += ' AND category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY title';
        
        const result = await db.query(query, params);
        res.json({ articles: result.rows });
    } catch (error) {
        console.error('Help articles error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single help article
router.get('/help/articles/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        await db.query('UPDATE help_articles SET views = views + 1 WHERE slug = $1', [slug]);
        
        const result = await db.query(
            'SELECT * FROM help_articles WHERE slug = $1 AND is_published = true',
            [slug]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json({ article: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit support ticket (contact form)
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message, category } = req.body;
        const userId = req.userId || null;
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Save ticket to database
        const result = await db.query(`
            INSERT INTO support_tickets (user_id, name, email, subject, message, category)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [userId, name, email, subject, message, category || 'general']);
        
        // Send email notification to admin
        try {
            const transporter = getTransporter();
            await transporter.sendMail({
                from: 'no_reply@heavenslive.com',
                to: 'bmirkalami@gmail.com',
                subject: `[HeavensLive Shop Support] ${subject}`,
                text: `
New Support Request

From: ${name} (${email})
Category: ${category || 'general'}
Subject: ${subject}

Message:
${message}

---
View all tickets: https://heavenslive.com/shop/admin
                `,
                html: `
                    <h2>New Support Request</h2>
                    <p><strong>From:</strong> ${name} (${email})</p>
                    <p><strong>Category:</strong> ${category || 'general'}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p><a href="https://heavenslive.com/shop/admin">View in Admin Panel</a></p>
                `
            });
            console.log('Support email sent to bmirkalami@gmail.com');
        } catch (emailErr) {
            console.error('Failed to send email:', emailErr);
            // Still return success since ticket was saved
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Your message has been sent. We will respond shortly.',
            ticket: result.rows[0]
        });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get support tickets
router.get('/admin/tickets', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const isAdmin = await db.query(`
            SELECT 1 FROM shop_admins WHERE user_id = $1
            UNION
            SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true
        `, [userId]);
        
        if (isAdmin.rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { status } = req.query;
        let query = `
            SELECT t.*, u.email as user_email
            FROM support_tickets t
            LEFT JOIN users u ON t.user_id = u.id
        `;
        const params = [];
        
        if (status) {
            query += ' WHERE t.status = $1';
            params.push(status);
        }
        
        query += ' ORDER BY t.created_at DESC';
        
        const result = await db.query(query, params);
        res.json({ tickets: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Respond to ticket
router.post('/admin/tickets/:id/respond', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { response } = req.body;
        
        const isAdmin = await db.query(`
            SELECT 1 FROM shop_admins WHERE user_id = $1
            UNION
            SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true
        `, [userId]);
        
        if (isAdmin.rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const ticket = await db.query('SELECT * FROM support_tickets WHERE id = $1', [id]);
        if (ticket.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        await db.query(`
            UPDATE support_tickets 
            SET status = 'closed', admin_response = $1, responded_by = $2, responded_at = NOW()
            WHERE id = $3
        `, [response, userId, id]);
        
        // Send email to user
        try {
            const transporter = getTransporter();
            await transporter.sendMail({
                from: 'no_reply@heavenslive.com',
                to: ticket.rows[0].email,
                subject: `Re: ${ticket.rows[0].subject}`,
                text: `
Dear ${ticket.rows[0].name},

${response}

---
Original message: ${ticket.rows[0].message}

Thank you for contacting HeavensLive Shop.
                `,
                html: `
                    <h2>Response to Your Support Request</h2>
                    <p>Dear ${ticket.rows[0].name},</p>
                    <p>${response.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p><strong>Original message:</strong> ${ticket.rows[0].message}</p>
                    <p>Thank you for contacting HeavensLive Shop.</p>
                `
            });
        } catch (emailErr) {
            console.error('Failed to send response email:', emailErr);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Respond error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
