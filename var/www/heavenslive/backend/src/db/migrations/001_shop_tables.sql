-- ============================================
-- SHOP MODULE TABLES
-- ============================================

-- 1. STORES (for /shop/mall)
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    custom_domain VARCHAR(255) UNIQUE,
    is_custom_domain_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    store_settings JSONB DEFAULT '{"allow_offers": true, "shipping_zones": [], "return_policy": "", "processing_time_days": 2}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. LISTINGS (unified for all shop types)
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price_cents BIGINT,
    starting_price_cents BIGINT,
    reserve_price_cents BIGINT,
    buy_it_now_price_cents BIGINT,
    current_bid_cents BIGINT,
    bid_increment_cents BIGINT DEFAULT 100,
    reverse_target_specs JSONB,
    quantity_available INT DEFAULT 1,
    quantity_sold INT DEFAULT 0,
    images TEXT[],
    video_url TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_local_pickup BOOLEAN DEFAULT FALSE,
    shipping_options JSONB DEFAULT '[]',
    inventory_tracking JSONB,
    status VARCHAR(50) DEFAULT 'pending_approval',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    auction_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SHOP ADMINS (separate from super admin)
CREATE TABLE IF NOT EXISTS shop_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'moderator',
    permissions JSONB DEFAULT '{"approve_listings": true, "manage_disputes": true, "suspend_users": false, "adjust_fees": false, "view_analytics": true}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 4. PLATFORM_SETTINGS
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
    ('platform_fee_percent', '{"value": 0}'),
    ('credon_enabled', '{"value": false}'),
    ('listing_approval_required', '{"value": true}'),
    ('max_listings_per_user', '{"value": 100}')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. SUSPENSION_LOGS
CREATE TABLE IF NOT EXISTS suspension_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL,
    duration_days INT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. FEE_TRANSACTIONS
CREATE TABLE IF NOT EXISTS fee_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID,
    amount_cents BIGINT NOT NULL,
    fee_percent DECIMAL(5, 2) NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to orders table if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS listing_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS listing_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_release_date TIMESTAMP;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_suspension_logs_user_id ON suspension_logs(user_id);
