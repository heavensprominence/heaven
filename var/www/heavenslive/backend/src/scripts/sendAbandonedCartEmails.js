const db = require('../db');
const { sendAbandonedCartReminder } = require('../services/emailService');

async function sendAbandonedCartEmails() {
    try {
        const result = await db.query(`
            SELECT 
                c.user_id, 
                u.email, 
                u.full_name,
                json_agg(json_build_object(
                    'title', l.title,
                    'price_cents', l.price_cents,
                    'quantity', c.quantity,
                    'image', l.images[1],
                    'listing_id', l.id
                )) as items
            FROM carts c
            JOIN users u ON c.user_id = u.id
            JOIN listings l ON c.listing_id = l.id
            WHERE c.last_activity < NOW() - INTERVAL '24 hours'
              AND c.reminder_sent = FALSE
            GROUP BY c.user_id, u.email, u.full_name
            LIMIT 50
        `);
        
        for (const row of result.rows) {
            const total = row.items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
            
            await sendAbandonedCartReminder(row.email, row.full_name, row.items, total);
            
            await db.query(
                'UPDATE carts SET reminder_sent = TRUE, reminder_sent_at = NOW(), reminder_count = reminder_count + 1 WHERE user_id = $1',
                [row.user_id]
            );
            
            console.log(`✅ Reminder sent to ${row.email}`);
        }
        
        console.log(`Done! Sent ${result.rows.length} reminders.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

sendAbandonedCartEmails();
