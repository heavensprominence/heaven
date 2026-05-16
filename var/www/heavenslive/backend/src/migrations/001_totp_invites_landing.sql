-- Migration: TOTP 2FA + Invite System + Landing Page + Refresh Tokens
-- Run against the heavenslive database
-- 
-- Exact command:
--   psql -U heavenslive -d heavenslive_db -f /path/to/this/file.sql
-- Or on live server:
--   sudo -u postgres psql -d heavenslive_db -f /var/www/heavenslive/backend/src/migrations/001_totp_invites_landing.sql

BEGIN;

-- TOTP 2FA table
CREATE TABLE IF NOT EXISTS user_totp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(64) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Affiliate invite codes
CREATE TABLE IF NOT EXISTS affiliate_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(16) NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_invites_code ON affiliate_invites(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_invites_affiliate ON affiliate_invites(affiliate_id);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    message TEXT,
    anonymous BOOLEAN DEFAULT false,
    guest_token VARCHAR(64),
    status VARCHAR(30) DEFAULT 'pending_payment',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USB Prayer Purchases table
CREATE TABLE IF NOT EXISTS usb_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    amount_cents BIGINT NOT NULL,
    quantity INTEGER DEFAULT 1,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(255) NOT NULL,
    shipping_state VARCHAR(100),
    shipping_zip VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) DEFAULT 'US',
    buyer_name VARCHAR(255),
    buyer_email VARCHAR(255),
    guest_token VARCHAR(64),
    status VARCHAR(30) DEFAULT 'pending_payment',
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add purchase_count to users for bonus tracking (counts ALL purchases including repeats)
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchase_count BIGINT DEFAULT 0;

-- Update purchases to track donation/usb linkage
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS donation_id UUID;

-- Refresh token tables (JWT rotation system)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(128) NOT NULL,
    token_family VARCHAR(64) NOT NULL,
    device_fingerprint VARCHAR(128),
    ip_address VARCHAR(45),
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_token_revocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_family VARCHAR(64) NOT NULL UNIQUE,
    revoked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(token_family);

-- Guest cart support
ALTER TABLE carts ADD COLUMN IF NOT EXISTS guest_token VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_carts_guest ON carts(guest_token);

COMMIT;

-- Migration 001b: Treasury System + Paper Currency

BEGIN;

-- Central treasury ledger (all minting goes here first)
CREATE TABLE IF NOT EXISTS treasury_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount_cents BIGINT NOT NULL,
    reason VARCHAR(255),
    action VARCHAR(30) NOT NULL, -- 'mint', 'distribute', 'burn_return'
    admin_id UUID REFERENCES users(id),
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treasury_ledger_action ON treasury_ledger(action);
CREATE INDEX IF NOT EXISTS idx_treasury_ledger_created ON treasury_ledger(created_at);

-- Paper currency purchases
CREATE TABLE IF NOT EXISTS paper_currency_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    currency VARCHAR(20) NOT NULL,
    denominations JSONB NOT NULL, -- [{value, count, type:'bill'|'coin'}]
    total_cents BIGINT NOT NULL,
    shipping_address TEXT,
    shipping_city VARCHAR(255),
    shipping_state VARCHAR(100),
    shipping_zip VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'US',
    buyer_name VARCHAR(255),
    buyer_email VARCHAR(255),
    guest_token VARCHAR(64),
    status VARCHAR(30) DEFAULT 'pending_payment',
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
