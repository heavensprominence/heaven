const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✅ Email configured with SMTP');
} else {
  console.log('⚠️ No email credentials found. Using Ethereal test email service.');
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('Failed to create Ethereal account:', err);
      return;
    }
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
    console.log('📧 Ethereal test email account created:');
    console.log('   User:', account.user);
    console.log('   Preview URLs will be shown in console');
  });
}

const sendVerificationEmail = async (email, token, redirectApp) => {
  const redirect = redirectApp || 'shop';
  const verificationUrl = `https://heavenslive.com/api/auth/verify-email?token=${token}&redirect=${redirect}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: 'Verify Your Email - HeavensLive',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Account Security</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">Verify Your Email</h2><p style="line-height:1.6;font-size:.9rem">Welcome to HeavensLive! Click the button below to verify your email address and activate your account.</p><div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951">Your account will be fully activated once your email is verified.<br><br><span style="font-size:.8rem;color:#A0A0B0">Link expires in 24 hours. If you did not create this account, please ignore this email.</span></div><a href="${verificationUrl}" style="display:inline-block;padding:12px 28px;background:#C8A951;color:#0F0F1A;text-decoration:none;border-radius:8px;font-weight:700;font-size:.9rem;margin-top:8px">Verify Email →</a><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Verification email SENT to', email);
    console.log('   Verification URL:', verificationUrl);
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://heavenslive.com/credon'}/reset-password/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: 'Reset Your Password - HeavensLive',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Account Recovery</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">Reset Your Password</h2><p style="line-height:1.6;font-size:.9rem">We received a request to reset your HeavensLive password. Click the button below to set a new password.</p><div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951"><span style="font-size:.8rem;color:#A0A0B0">This link expires in 1 hour. If you did not request a password reset, please ignore this email — your account is safe.</span></div><a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#C8A951;color:#0F0F1A;text-decoration:none;border-radius:8px;font-weight:700;font-size:.9rem;margin-top:8px">Reset Password →</a><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Password reset email sent to', email); }
  catch (error) { console.error('Failed to send password reset email:', error); }
};

const sendAppointmentConfirmation = async (email, appointment) => {
  const dt = new Date(appointment.appointment_time || appointment.appointmentTime);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const cancelUrl = `${process.env.FRONTEND_URL || 'https://heavenslive.com'}/credon/wallet?cancel=${appointment.cancellation_token}`;
  const adminEmail = 'bmirkalami@gmail.com';
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    cc: adminEmail,
    subject: `📅 Appointment Confirmed — ${dateStr}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#C8A951">📅 Appointment Confirmed</h1>
      <p>Your appointment has been scheduled with <strong>HeavensLive Credon Support</strong>.</p>
      <div style="background:#f5f5f5;padding:20px;border-radius:12px;margin:20px 0">
        <p><strong>📆 Date:</strong> ${dateStr}</p>
        <p><strong>🕐 Time:</strong> ${timeStr}</p>
        <p><strong>⏱️ Duration:</strong> ${appointment.duration_minutes || 15} minutes</p>
        ${appointment.notes ? `<p><strong>📝 Notes:</strong> ${appointment.notes}</p>` : ''}
      </div>
      <p><strong>📱 IMPORTANT:</strong> Please add <a href="https://wa.me/16472281215">+1-647-228-1215</a> on WhatsApp before your appointment. The call will be conducted via WhatsApp.</p>
      <div style="margin:24px 0">
        <a href="${cancelUrl}" style="background:#E74C3C;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:12px">❌ Cancel</a>
        <a href="${process.env.FRONTEND_URL || 'https://heavenslive.com'}/credon/wallet" style="background:#4A90D9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">🔄 Reschedule</a>
      </div>
      <p style="color:#888;font-size:0.85rem">To reschedule: cancel via the link above, then book a new time at your <a href="${process.env.FRONTEND_URL || 'https://heavenslive.com'}/credon/wallet">Credon wallet</a>. Your original slot will be freed immediately.</p>
    </div>`
  };
  try { 
    await transporter.sendMail(mailOptions); 
    console.log('📧 Appointment confirmation sent to', email, '(cc:', adminEmail, ')');
  } catch (error) { console.error('Failed to send appointment confirmation:', error); }
};

const sendAppointmentCancellation = async (email, appointment) => {
  const dt = new Date(appointment.appointment_time || appointment.appointmentTime);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    cc: 'bmirkalami@gmail.com',
    subject: `❌ Appointment Cancelled — ${dateStr}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#E74C3C">❌ Appointment Cancelled</h1>
      <p>Your appointment has been cancelled.</p>
      <div style="background:#f5f5f5;padding:20px;border-radius:12px;margin:20px 0">
        <p><strong>📆 Date:</strong> ${dateStr}</p>
        <p><strong>🕐 Time:</strong> ${timeStr}</p>
      </div>
      <p>To book a new appointment, visit <a href="${process.env.FRONTEND_URL || 'https://heavenslive.com'}/credon/wallet">your Credon wallet</a>.</p>
    </div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Cancellation sent to', email); }
  catch (error) { console.error('Failed to send cancellation:', error); }
};

const sendDisputeUpdate = async (email, dispute) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: `Dispute Update: ${dispute.title}`,
    html: `<h1>Dispute Update</h1><p>Status: ${dispute.status}</p><p>Message: ${dispute.message || ''}</p>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Dispute update sent to', email); }
  catch (error) { console.error('Failed to send dispute update:', error); }
};

const sendLoginVerificationCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: 'Your Verification Code - HeavensLive',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Two-Step Verification</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">Your Verification Code</h2><p style="line-height:1.6;font-size:.9rem">Use the code below to complete your sign-in to HeavensLive.</p><div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951"><div style="text-align:center;font-size:2rem;font-weight:800;letter-spacing:8px;color:#C8A951;padding:16px;background:rgba(200,169,81,.08);border-radius:8px;margin:8px 0">${code}</div><span style="font-size:.8rem;color:#A0A0B0">This code expires in 10 minutes. If you did not attempt to sign in, your password may be compromised — change it immediately.</span></div><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Verification code sent to', email); }
  catch (error) { console.error('Failed to send verification code:', error); }
};

const sendPickupInstructions = async (email, listing, seller) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: 'Pickup Instructions - ' + listing.title,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Local Pickup</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">Pickup Instructions</h2><p style="line-height:1.6;font-size:.9rem">Your item is ready for local pickup. Please review the details below and coordinate with the seller.</p><div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951"><strong style="color:#C8A951">${listing.title}</strong><br>Seller: ${seller.name}<br>Address: ${listing.pickup_address}, ${listing.pickup_city}, ${listing.pickup_state} ${listing.pickup_zip}<br><br><span style='font-size:.85rem'>${listing.pickup_instructions || 'No additional instructions'}</span></div><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Pickup instructions sent to', email); }
  catch (error) { console.error('Failed to send pickup instructions:', error); }
};

const sendBuyerSaleConfirmation = async (email, listing, amount, sellerName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: 'Purchase Confirmed - ' + listing.title,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Marketplace</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">Purchase Confirmed!</h2><p style="line-height:1.6;font-size:.9rem">Your order has been confirmed. The seller will be notified and will prepare your item for shipping.</p><div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951"><strong style="color:#C8A951">${listing.title}</strong><br>Amount: <strong>$${((amount || 0) / 100).toFixed(2)}</strong><br>Seller: ${sellerName}</div><a href="https://shop.heavenslive.com/buyer/dashboard" style="display:inline-block;padding:12px 28px;background:#C8A951;color:#0F0F1A;text-decoration:none;border-radius:8px;font-weight:700;font-size:.9rem;margin-top:8px">Track Your Order →</a><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Buyer sale confirmation sent to', email); }
  catch (error) { console.error('Failed to send buyer sale confirmation:', error); }
};

const sendSellerSaleNotification = async (email, listing, amount, fee, payout, buyerName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: 'You Made a Sale! - ' + listing.title,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Marketplace</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">You Made a Sale! 🎉</h2><p style="line-height:1.6;font-size:.9rem">Congratulations! Your item has been purchased. Please prepare it for shipping.</p><div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951"><strong style="color:#C8A951">${listing.title}</strong><br>Amount: $${((amount || 0) / 100).toFixed(2)}<br>Fee: $${((fee || 0) / 100).toFixed(2)}<br>Your Payout: <strong>$${((payout || amount || 0) / 100).toFixed(2)}</strong><br>Buyer: ${buyerName}</div><a href="https://shop.heavenslive.com/seller/dashboard" style="display:inline-block;padding:12px 28px;background:#C8A951;color:#0F0F1A;text-decoration:none;border-radius:8px;font-weight:700;font-size:.9rem;margin-top:8px">View Order →</a><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Seller sale notification sent to', email); }
  catch (error) { console.error('Failed to send seller sale notification:', error); }
};

const sendAbandonedCartReminder = async (email, name, items) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@heavenslive.com',
    to: email,
    subject: 'You left items in your cart!',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Marketplace</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">Items Waiting in Your Cart</h2><p style="line-height:1.6;font-size:.9rem">You left ${items.length} item(s) in your HeavensMarket cart. They are still available — but might not be for long!</p><div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951"><span style="font-size:.85rem">Hi ${name || "there"}, your cart is saved and ready when you are.</span></div><a href="https://shop.heavenslive.com/cart" style="display:inline-block;padding:12px 28px;background:#C8A951;color:#0F0F1A;text-decoration:none;border-radius:8px;font-weight:700;font-size:.9rem;margin-top:8px">Return to Cart →</a><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Cart reminder sent to', email); }
  catch (error) { console.error('Failed to send cart reminder:', error); }
};

const sendProcurementMatchAlert = async (email, name, match) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'service@heavenslive.com',
    to: email,
    subject: `🎯 Match Found: ${match.procurement_title} ↔ ${match.listing_title}`,
    html: `<h2>🎯 We found a match for you!</h2><p>Hi ${name || 'there'},</p><p>Your procurement request <strong>"${match.procurement_title}"</strong> matches this listing:</p><div style="background:#f5f5f5;padding:20px;border-radius:10px;margin:20px 0;"><h3>${match.listing_title}</h3><p><strong>Match Score:</strong> ${match.match_score}% - ${match.match_reason}</p><p><strong>Price:</strong> $${(match.listing_price / 100).toFixed(2)}</p><a href="https://shop.heavenslive.com/listing/${match.matching_listing_id}" style="background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">View Listing →</a></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Match alert sent to', email); }
  catch (error) { console.error('Failed to send match alert:', error); }
};

const sendSavedSearchAlert = async (email, name, alert) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'service@heavenslive.com',
        to: email,
        subject: `🔔 New Item Matches Your Search: ${alert.title}`,
        html: `<h2>🔔 New Match Found!</h2><p>Hi ${name || 'there'},</p><p>A new listing matches your saved search "${alert.name || 'Untitled'}"</p><div style="background:#f5f5f5;padding:20px;border-radius:10px;margin:20px 0;"><h3>${alert.title}</h3><p><strong>Price:</strong> ${alert.price_cents === 0 ? 'FREE' : '$' + (alert.price_cents / 100).toFixed(2)}</p><a href="https://shop.heavenslive.com/listing/${alert.listing_id}" style="background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">View Item →</a></div>`
    };
    try { await transporter.sendMail(mailOptions); console.log('📧 Search alert sent to', email); }
    catch (error) { console.error('Failed to send search alert:', error); }
};



const sendLotteryWinNotification = async (email, name, plan) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'service@heavenslive.com',
    to: email,
    subject: '🎉 You won the Business Plan Lottery! - HeavensLive',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Lottery Winner</p></div><h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">Congratulations ${name}!</h2><p style="line-height:1.6;font-size:.9rem">You've been selected as this week's lottery winner! Your account has been upgraded to the <strong>${plan}</strong> plan — absolutely free.</p><div style="background:rgba(200,169,81,.06);padding:16px;border-radius:8px;margin:16px 0;border-left:3px solid #C8A951;text-align:center"><p style="font-size:1.2rem;color:#C8A951;margin:0">🎁 ${plan} Plan Activated</p><p style="font-size:.85rem;color:#A0A0B0;margin:4px 0 0">Enjoy all premium features for life!</p></div><hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px"><p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log('📧 Lottery win email sent to', email); }
  catch (error) { console.error('Failed to send lottery email:', error); }
};

async function sendDisputeNotification(email, title, action) {
    const subjects = {
        'new_dispute_filed': 'New Dispute Filed Against You',
        'new_message': 'New Message in Your Dispute',
        'mutual_agreement': 'Dispute Resolved — Mutual Agreement',
        'admin_resolved_in_favor_of_buyer': 'Dispute Resolved in Your Favor',
        'admin_resolved_in_favor_of_seller': 'Dispute Resolved — Admin Decision',
        'admin_resolved_split': 'Dispute Resolved — 50/50 Split',
        'admin_resolved_dismissed': 'Dispute Dismissed'
    };
    const bodies = {
        'new_dispute_filed': 'Someone has filed a dispute against you regarding "' + title + '". You have 14 days to respond and reach an agreement before an administrator reviews the case.',
        'new_message': 'A new message was posted in your dispute "' + title + '". Log in to continue the conversation.',
        'mutual_agreement': 'Both parties have agreed. The dispute "' + title + '" is now resolved.',
        'admin_resolved_in_favor_of_buyer': 'An administrator has reviewed the dispute "' + title + '" and ruled in your favor.',
        'admin_resolved_in_favor_of_seller': 'An administrator has reviewed the dispute "' + title + '". Please log in to see the full resolution details.',
        'admin_resolved_split': 'An administrator has reviewed the dispute "' + title + '" and ordered a 50/50 resolution.',
        'admin_resolved_dismissed': 'An administrator has reviewed the dispute "' + title + '" and dismissed it.'
    };
    const subj = subjects[action] || 'Dispute Update';
    const body = bodies[action] || action;
    const html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F0F1A;color:#E8E6E3;padding:32px;border-radius:12px;border:1px solid rgba(200,169,81,.2)">' +
      '<div style="text-align:center;margin-bottom:28px"><h1 style="color:#C8A951;margin:0;font-size:1.4rem">HeavensLive</h1><p style="color:#A0A0B0;font-size:.8rem;margin-top:4px">Dispute Resolution Center</p></div>' +
      '<h2 style="color:#C8A951;font-size:1.05rem;margin-bottom:14px">' + subj + '</h2>' +
      '<p style="line-height:1.6;font-size:.9rem">' + body + '</p>' +
      '<div style="background:rgba(200,169,81,.06);padding:12px 16px;border-radius:8px;margin:20px 0;border-left:3px solid #C8A951"><strong style="color:#C8A951;font-size:.85rem">Dispute:</strong> <span style="font-size:.85rem">' + title + '</span></div>' +
      '<a href="https://shop.heavenslive.com/disputes" style="display:inline-block;padding:12px 28px;background:#C8A951;color:#0F0F1A;text-decoration:none;border-radius:8px;font-weight:700;font-size:.9rem;margin-top:8px">View Dispute →</a>' +
      '<hr style="border:none;border-top:1px solid rgba(255,255,255,.05);margin:24px 0 16px">' +
      '<p style="color:#A0A0B0;font-size:.7rem;text-align:center">HeavensLive · Divinely Underwritten Commerce<br>This is an automated message. Please do not reply.</p></div>';
    const mailOptions = {
        from: '"HeavensLive Disputes" <' + (process.env.EMAIL_FROM || 'noreply@heavenslive.com') + '>',
        to: email,
        subject: subj + ' — ' + title,
        text: body,
        html: html
    };
    try { await transporter.sendMail(mailOptions); console.log('📧 Dispute email sent to', email); } catch(e) {}
}
module.exports = {
    sendDisputeNotification,
    sendLotteryWinNotification,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendAppointmentConfirmation,
    sendAppointmentCancellation,
    sendDisputeUpdate,
    sendLoginVerificationCode,
    sendPickupInstructions,
    sendBuyerSaleConfirmation,
    sendSellerSaleNotification,
    sendAbandonedCartReminder,
    sendProcurementMatchAlert,
    sendSavedSearchAlert
};
