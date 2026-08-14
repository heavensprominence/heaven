/**
 * Auction settlement — closes ended auctions and determines winners.
 *
 * Regular auction (single unit): highest bid wins (first-price).
 * Dutch / multi-unit auction (quantity_available > 1 or is_dutch_auction):
 *   top bidders win up to quantity_available units; all winners pay the clearing
 *   price (the lowest winning bid). Uniform-price.
 */
const db = require('../db');
const { sendBuyerSaleConfirmation, sendSellerSaleNotification } = require('./emailService');

async function sellerInfo(sellerId) {
  const r = await db.query('SELECT email, full_name FROM users WHERE id = $1', [sellerId]);
  return r.rows[0] || { email: null, full_name: 'Seller' };
}

async function settleAuction(listing) {
  const seller = await sellerInfo(listing.seller_id);
  const isDutch = listing.is_dutch_auction === true || (parseInt(listing.quantity_available, 10) || 1) > 1;

  const bids = await db.query(
    `SELECT b.*, u.email, u.full_name FROM auction_bids b
      JOIN users u ON b.bidder_id = u.id
     WHERE b.listing_id = $1
     ORDER BY b.amount_cents DESC, b.created_at ASC`,
    [listing.id]
  );

  if (!bids.rows.length) {
    await db.query(`UPDATE listings SET status = 'ended' WHERE id = $1`, [listing.id]);
    return { winners: 0, listingId: listing.id };
  }

  if (isDutch) {
    const qty = parseInt(listing.quantity_available, 10) || 1;
    let remaining = qty;
    const winners = [];
    for (const b of bids.rows) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, parseInt(b.quantity, 10) || 1);
      winners.push({ ...b, winning_quantity: take });
      remaining -= take;
    }
    const clearing = winners.length ? winners[winners.length - 1].amount_cents : null;

    for (const w of winners) {
      await db.query(
        `UPDATE auction_bids SET is_winning = true, winning_quantity = $2, clearing_price_cents = $3 WHERE id = $1`,
        [w.id, w.winning_quantity, clearing]
      );
      try { await sendBuyerSaleConfirmation(w.email, listing, (parseInt(clearing, 10) || 0) / 100, seller.full_name); } catch (e) {}
    }
    await db.query(
      `UPDATE listings SET status = 'sold', dutch_clearing_price_cents = $2, current_bid_cents = $2 WHERE id = $1`,
      [listing.id, clearing]
    );
    if (seller.email) {
      try { await sendSellerSaleNotification(seller.email, listing, (parseInt(clearing, 10) || 0) / 100, 0, (parseInt(clearing, 10) || 0) / 100, 'Auction winners'); } catch (e) {}
    }
    return { winners: winners.length, listingId: listing.id, clearingPrice: clearing };
  }

  // Single-unit, first-price
  const winner = bids.rows[0];
  await db.query(
    `UPDATE auction_bids SET is_winning = true, winning_quantity = 1, clearing_price_cents = $2 WHERE id = $1`,
    [winner.id, winner.amount_cents]
  );
  await db.query(
    `UPDATE listings SET status = 'sold', current_bidder_id = $2, current_bid_cents = $3 WHERE id = $1`,
    [listing.id, winner.bidder_id, winner.amount_cents]
  );
  try { await sendBuyerSaleConfirmation(winner.email, listing, winner.amount_cents / 100, seller.full_name); } catch (e) {}
  if (seller.email) {
    try { await sendSellerSaleNotification(seller.email, listing, winner.amount_cents / 100, 0, winner.amount_cents / 100, winner.full_name || 'Buyer'); } catch (e) {}
  }
  return { winners: 1, listingId: listing.id };
}

async function settleEndedAuctions() {
  const ended = await db.query(`
    SELECT * FROM listings
    WHERE status = 'active' AND type = 'auction'
      AND auction_end_time IS NOT NULL AND auction_end_time < NOW()
  `);
  let settled = 0;
  for (const l of ended.rows) {
    try { await settleAuction(l); settled++; } catch (e) { console.error('Settle auction error:', e.message); }
  }
  return settled;
}

module.exports = { settleEndedAuctions, settleAuction };
