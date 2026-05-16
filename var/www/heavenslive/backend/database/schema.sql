-- ============================================
-- HEAVENSLIVE CREDON CURRENCY DATABASE SCHEMA
-- TESTING ONLY - NOT FOR PRODUCTION USE
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    whatsapp_number VARCHAR(50),
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_end_date TIMESTAMP,
    suspension_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP
);

-- ============================================
-- WALLETS TABLE (Base balance stored in Credon cents)
-- 1 Credon-USD = 100 Credon cents
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance_cents BIGINT DEFAULT 0, -- Base unit: 1/100 of Credon-USD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- TRANSACTIONS LEDGER
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'purchase', 'bonus', 'transfer_sent', 'transfer_received', 'mint', 'burn', 'refund'
    amount_cents BIGINT NOT NULL, -- Positive for credit, negative for debit
    balance_after_cents BIGINT NOT NULL,
    currency_clone VARCHAR(50) DEFAULT 'Credon-USD', -- For display purposes
    reference_id UUID, -- Reference to another transaction or order
    description TEXT,
    is_mock BOOLEAN DEFAULT TRUE, -- TESTING ONLY flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- BIDS TABLE (Mock bidding system)
-- ============================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'buy' or 'sell'
    from_currency VARCHAR(50) NOT NULL, -- e.g., 'Credon-USD'
    to_currency VARCHAR(50) NOT NULL, -- e.g., 'USD', 'BTC', 'CAD'
    amount_cents BIGINT NOT NULL, -- Amount of from_currency being bid
    exchange_rate DECIMAL(20, 8) NOT NULL, -- Rate offered
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'matched', 'cancelled', 'expired'
    matched_bid_id UUID, -- Reference to the matching bid
    expires_at TIMESTAMP,
    is_mock BOOLEAN DEFAULT TRUE, -- TESTING ONLY flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_status ON bids(status);

-- ============================================
-- ORDERS TABLE (Memorabilia, Premium USB, Donations)
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'donation', 'memorabilia_set', 'premium_usb'
    amount_usd DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'
    paypal_order_id VARCHAR(255),
    shipping_address TEXT,
    shipping_tracking_number VARCHAR(255),
    shipping_carrier VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_time TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 15,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'
    cancellation_token UUID DEFAULT uuid_generate_v4(),
    whatsapp_contact_added BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_appointment_time ON appointments(appointment_time);

-- ============================================
-- DISPUTES TABLE
-- ============================================
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    order_id UUID REFERENCES orders(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disputes_user_id ON disputes(user_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- ============================================
-- AUDIT LOGS TABLE (Admin actions)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50), -- 'user', 'transaction', 'bid', 'order'
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- MINTING/BURNING LOGS (Mock system)
-- ============================================
CREATE TABLE minting_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(20) NOT NULL, -- 'mint' or 'burn'
    amount_cents BIGINT NOT NULL,
    reason TEXT,
    is_automatic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EXCHANGE RATES (Mock - Testing only)
-- ============================================
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(50) NOT NULL,
    to_currency VARCHAR(50) NOT NULL,
    rate DECIMAL(20, 8) NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency)
);

-- Insert default mock exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
    ('Credon-USD', 'Credon-CAD', 1.35),
    ('Credon-USD', 'Credon-EUR', 0.92),
    ('Credon-USD', 'Credon-VND', 25000.00),
    ('Credon-USD', 'Credon-BTC', 0.000015),
    ('Credon-USD', 'Credon-ETH', 0.00025),
    ('Credon-USD', 'USD', 1.00),
    ('Credon-USD', 'CAD', 1.35),
    ('Credon-USD', 'EUR', 0.92),
    ('Credon-USD', 'GBP', 0.79),
    ('Credon-CAD', 'Credon-USD', 0.74),
    ('Credon-EUR', 'Credon-USD', 1.087),
    ('Credon-BTC', 'Credon-USD', 66666.67),
    ('Credon-ETH', 'Credon-USD', 4000.00);

-- ============================================
-- CREATE SUPER ADMIN USER (You - bmirkalami@gmail.com)
-- Password will be set via backend script
-- ============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TESTING ONLY DISCLAIMER VIEW
-- ============================================
CREATE VIEW testing_disclaimer AS
SELECT 'THIS IS A TESTING SYSTEM ONLY. No real currency or financial instruments are being offered. All clone currency transactions are mock/simulated. Regulatory approval is being sought.' AS disclaimer;