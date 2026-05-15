--
-- PostgreSQL database dump
--

\restrict bGgkqBcJQvXJNcBHDX168liiaSIsaLtI17tVErEuPnJ46NZrvOQDPX0cHxQHIEa

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: add_other_subcategory(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_other_subcategory() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Only add "Other" for root-level categories, not for subcategories or Other itself
  IF NEW.parent_category IS NULL AND NEW.category NOT LIKE '%_other' THEN
    INSERT INTO shop_categories (category, display_name, parent_category, icon, sort_order, level)
    VALUES (NEW.category || '_other', 'Other', NEW.category, '📦', 999, 1)
    ON CONFLICT (category) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: cleanup_expired_listings(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_listings() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Permanently delete listings that are deleted or expired for more than 30 days
    DELETE FROM listings 
    WHERE (status = 'deleted' AND deleted_at < NOW() - INTERVAL '30 days')
       OR (status = 'expired' AND expires_at < NOW() - INTERVAL '30 days');
    
    -- Clean up old sales history (older than 3 years)
    DELETE FROM sales_history WHERE retained_until < NOW();
END;
$$;


--
-- Name: rebuild_category_paths(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rebuild_category_paths() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    cat RECORD;
BEGIN
    -- Update level 1 categories
    UPDATE shop_categories SET level = 1, full_path = category WHERE parent_category IS NULL;
    
    -- Recursively update children
    FOR cat IN SELECT * FROM shop_categories WHERE parent_category IS NOT NULL ORDER BY parent_category LOOP
        UPDATE shop_categories sc
        SET level = p.level + 1,
            full_path = p.full_path || '/' || sc.category
        FROM shop_categories p
        WHERE p.category = sc.parent_category AND sc.id = cat.id;
    END LOOP;
END;
$$;


--
-- Name: update_translation_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_translation_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_loans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_loans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    loan_request_id uuid,
    principal_cents bigint NOT NULL,
    remaining_cents bigint NOT NULL,
    interest_rate numeric(5,2) DEFAULT 0 NOT NULL,
    currency character varying(20) DEFAULT 'Credon-USD'::character varying,
    start_date timestamp with time zone DEFAULT now(),
    last_interest_calc timestamp with time zone DEFAULT now(),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: affiliate_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_commissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_user_id uuid NOT NULL,
    purchase_id uuid,
    amount_cents integer DEFAULT 0,
    commission_rate numeric(5,2) DEFAULT 0,
    commission_cents integer DEFAULT 0,
    commission_type character varying(30) DEFAULT 'signup'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: affiliate_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    code character varying(16) NOT NULL,
    is_used boolean DEFAULT false,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: affiliate_payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_payouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    affiliate_id uuid NOT NULL,
    amount_cents integer NOT NULL,
    paypal_email character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: affiliate_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    setting_key character varying(50) NOT NULL,
    setting_value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: analytics_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_daily (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    total_sales integer DEFAULT 0,
    total_revenue_cents bigint DEFAULT 0,
    platform_fee_cents bigint DEFAULT 0,
    new_listings integer DEFAULT 0,
    new_users integer DEFAULT 0,
    active_users integer DEFAULT 0,
    page_views integer DEFAULT 0,
    unique_visitors integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    key_hash character varying(64) NOT NULL,
    prefix character varying(8) NOT NULL,
    rate_limit integer DEFAULT 1000,
    is_active boolean DEFAULT true,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    appointment_time timestamp without time zone NOT NULL,
    duration_minutes integer DEFAULT 15,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    cancellation_token uuid DEFAULT public.uuid_generate_v4(),
    whatsapp_contact_added boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: auction_bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auction_bids (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid NOT NULL,
    bidder_id uuid NOT NULL,
    amount_cents bigint NOT NULL,
    is_winning boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantity integer DEFAULT 1,
    winning_quantity integer DEFAULT 0,
    clearing_price_cents bigint
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    target_type character varying(50),
    target_id uuid,
    details jsonb,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bids (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    from_currency character varying(50) NOT NULL,
    to_currency character varying(50) NOT NULL,
    amount_cents bigint NOT NULL,
    exchange_rate numeric(20,8) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying,
    matched_bid_id uuid,
    expires_at timestamp without time zone,
    is_mock boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reminder_sent boolean DEFAULT false,
    reminder_sent_at timestamp without time zone,
    reminder_count integer DEFAULT 0,
    guest_token character varying(64)
);


--
-- Name: category_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    category character varying(100) NOT NULL,
    listings_count integer DEFAULT 0,
    sales_count integer DEFAULT 0,
    revenue_cents bigint DEFAULT 0,
    avg_price_cents bigint DEFAULT 0,
    views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: category_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_suggestions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    parent_category character varying(100),
    suggested_name character varying(255) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: category_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_translations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying(100) NOT NULL,
    language_code character varying(5) NOT NULL,
    name text NOT NULL,
    translated_by character varying(20) DEFAULT 'auto'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: competitor_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitor_insights (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    seller_id uuid NOT NULL,
    category character varying(100) NOT NULL,
    avg_competitor_price_cents bigint,
    price_position character varying(20),
    market_share_percent numeric(5,2),
    competitive_advantage text,
    recommended_action text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    subject character varying(255) DEFAULT 'General Inquiry'::character varying,
    last_message_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: currency_serials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currency_serials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    serial_number character varying(30) NOT NULL,
    currency character varying(10) NOT NULL,
    denomination_cents bigint NOT NULL,
    denomination_value character varying(50) NOT NULL,
    front_design_hash character varying(64),
    back_design_hash character varying(64),
    print_batch character varying(30),
    printed_at timestamp with time zone,
    printer_id character varying(50),
    status character varying(20) DEFAULT 'pending_print'::character varying,
    order_id uuid,
    owner_id uuid,
    verified_count integer DEFAULT 0,
    last_verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: currency_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currency_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    serial_number character varying(30) NOT NULL,
    verified_by_ip character varying(45),
    verified_via character varying(30) DEFAULT 'api'::character varying,
    result character varying(20) NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: dispute_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispute_evidence (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dispute_id uuid NOT NULL,
    uploaded_by uuid NOT NULL,
    file_url text NOT NULL,
    file_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: dispute_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispute_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dispute_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    is_admin_message boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    transaction_id uuid,
    order_id uuid,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying,
    resolution_notes text,
    resolved_by uuid,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: donations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount_cents bigint NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying,
    donor_name character varying(255),
    donor_email character varying(255),
    message text,
    anonymous boolean DEFAULT false,
    guest_token character varying(64),
    status character varying(30) DEFAULT 'pending_payment'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: escrow_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escrow_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    amount_cents bigint NOT NULL,
    platform_fee_cents bigint DEFAULT 0,
    seller_payout_cents bigint NOT NULL,
    paypal_order_id character varying(255),
    paypal_capture_id character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    held_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    released_at timestamp without time zone,
    released_by uuid,
    tracking_number character varying(100),
    tracking_carrier character varying(50),
    delivery_confirmed_at timestamp without time zone,
    buyer_acceptance boolean DEFAULT false,
    auto_release_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    from_currency character varying(50) NOT NULL,
    to_currency character varying(50) NOT NULL,
    rate numeric(20,8) NOT NULL,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fee_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid,
    amount_cents bigint NOT NULL,
    fee_percent numeric(5,2) NOT NULL,
    collected_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: gift_card_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_card_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    gift_card_id uuid NOT NULL,
    purchase_id uuid,
    amount_cents bigint NOT NULL,
    transaction_type character varying(20) NOT NULL,
    balance_after_cents bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: gift_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_cards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    initial_amount_cents bigint NOT NULL,
    current_balance_cents bigint NOT NULL,
    purchaser_id uuid,
    purchaser_email character varying(255),
    recipient_name character varying(255),
    recipient_email character varying(255),
    message text,
    is_redeemed boolean DEFAULT false,
    redeemed_by uuid,
    redeemed_at timestamp without time zone,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '1 year'::interval),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gift_cards_initial_amount_cents_check CHECK (((initial_amount_cents >= 100) AND (initial_amount_cents <= 100000)))
);


--
-- Name: help_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.help_articles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    category character varying(50),
    views integer DEFAULT 0,
    is_published boolean DEFAULT true,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: listing_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_translations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    language_code character varying(5) NOT NULL,
    title text,
    description text,
    translated_by character varying(20) DEFAULT 'auto'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    search_vector tsvector
);


--
-- Name: listing_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid NOT NULL,
    viewer_id uuid,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    seller_id uuid NOT NULL,
    store_id uuid,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    price_cents bigint,
    starting_price_cents bigint,
    reserve_price_cents bigint,
    buy_it_now_price_cents bigint,
    current_bid_cents bigint,
    bid_increment_cents bigint DEFAULT 100,
    reverse_target_specs jsonb,
    quantity_available integer DEFAULT 1,
    quantity_sold integer DEFAULT 0,
    images text[],
    video_url text,
    location_city character varying(100),
    location_state character varying(100),
    location_country character varying(100),
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_local_pickup boolean DEFAULT false,
    shipping_options jsonb DEFAULT '[]'::jsonb,
    inventory_tracking jsonb,
    status character varying(50) DEFAULT 'pending_approval'::character varying,
    approved_by uuid,
    approved_at timestamp without time zone,
    auction_end_time timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    duration character varying(20) DEFAULT '2weeks'::character varying,
    expires_at timestamp without time zone,
    min_bid_cents bigint,
    max_bid_cents bigint,
    bid_increment_percent integer DEFAULT 10,
    current_bidder_id uuid,
    bid_count integer DEFAULT 0,
    shipping_provider character varying(50),
    shipping_tracking character varying(100),
    weight_oz integer,
    dimensions jsonb,
    deleted_at timestamp without time zone,
    deletion_reason character varying(50),
    is_dutch_auction boolean DEFAULT false,
    dutch_clearing_price_cents bigint,
    allow_local_pickup boolean DEFAULT false,
    pickup_address text,
    pickup_city character varying(100),
    pickup_state character varying(100),
    pickup_zip character varying(20),
    pickup_instructions text,
    pickup_country character varying(2) DEFAULT 'CA'::character varying,
    poster_role character varying(20) DEFAULT 'seller'::character varying,
    item_condition character varying(20) DEFAULT 'new'::character varying,
    is_featured boolean DEFAULT false,
    source_language character varying(5) DEFAULT 'en'::character varying,
    currency character varying(10) DEFAULT 'USD'::character varying,
    accepted_currencies text[] DEFAULT '{USD}'::text[]
);


--
-- Name: loan_repayments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    active_loan_id uuid,
    user_id uuid NOT NULL,
    amount_cents bigint NOT NULL,
    principal_paid_cents bigint DEFAULT 0,
    interest_paid_cents bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: loan_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(20) DEFAULT 'loan'::character varying NOT NULL,
    amount_requested bigint,
    currency character varying(20) DEFAULT 'Credon-USD'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    interest_rate numeric(5,2),
    admin_notes text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: login_verification_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_verification_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code character varying(6) NOT NULL,
    session_id uuid NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: lottery_draws; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_draws (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    week_number integer NOT NULL,
    drawn_at timestamp with time zone DEFAULT now()
);


--
-- Name: lottery_winners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_winners (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    draw_id uuid NOT NULL,
    entry_id uuid NOT NULL,
    "position" integer NOT NULL
);


--
-- Name: market_trends; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_trends (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category character varying(100) NOT NULL,
    date date NOT NULL,
    avg_price_cents bigint,
    median_price_cents bigint,
    sales_volume integer,
    demand_score integer DEFAULT 50,
    supply_score integer DEFAULT 50,
    trending_keywords text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    listing_id uuid,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: minting_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.minting_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid,
    action character varying(20) NOT NULL,
    amount_cents bigint NOT NULL,
    reason text,
    is_automatic boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    offer_cents bigint NOT NULL,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying,
    seller_response text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    amount_usd numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    paypal_order_id character varying(255),
    shipping_address text,
    shipping_tracking_number character varying(255),
    shipping_carrier character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: paper_currency_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paper_currency_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    currency character varying(20) NOT NULL,
    denominations jsonb NOT NULL,
    total_cents bigint NOT NULL,
    shipping_address text,
    shipping_city character varying(255),
    shipping_state character varying(100),
    shipping_zip character varying(20),
    shipping_country character varying(100) DEFAULT 'US'::character varying,
    buyer_name character varying(255),
    buyer_email character varying(255),
    guest_token character varying(64),
    status character varying(30) DEFAULT 'pending_payment'::character varying,
    tracking_number character varying(100),
    shipped_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    token character varying(128) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value jsonb NOT NULL,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: price_predictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_predictions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category character varying(100) NOT NULL,
    predicted_price_cents bigint,
    confidence_score integer,
    best_time_to_sell character varying(20),
    expected_demand character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: procurement_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procurement_matches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    procurement_id uuid NOT NULL,
    matching_listing_id uuid NOT NULL,
    match_score integer DEFAULT 100,
    match_reason text,
    notified_buyer boolean DEFAULT false,
    notified_seller boolean DEFAULT false,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: promo_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_campaigns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    plan character varying(20) NOT NULL,
    duration_months integer DEFAULT 12,
    max_claims integer,
    current_claims integer DEFAULT 0,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT promo_campaigns_plan_check CHECK (((plan)::text = ANY ((ARRAY['free'::character varying, 'pro'::character varying, 'business'::character varying])::text[]))),
    CONSTRAINT promo_campaigns_type_check CHECK (((type)::text = ANY (ARRAY['gift'::text, 'lottery'::text, 'auto_pro'::text])))
);


--
-- Name: promo_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    claimed_at timestamp with time zone,
    won_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT promo_entries_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'won'::character varying, 'claimed'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: promotion_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotion_usage (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    promotion_id uuid NOT NULL,
    user_id uuid NOT NULL,
    purchase_id uuid,
    discount_cents bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    seller_id uuid NOT NULL,
    listing_id uuid,
    store_id uuid,
    promotion_type character varying(20) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    value_percent integer NOT NULL,
    applies_to character varying(20) DEFAULT 'listing'::character varying,
    category character varying(100),
    min_purchase_cents bigint DEFAULT 0,
    max_discount_cents bigint,
    usage_limit integer,
    used_count integer DEFAULT 0,
    starts_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT promotions_value_percent_check CHECK (((value_percent >= 1) AND (value_percent <= 99)))
);


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    buyer_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    amount_cents bigint NOT NULL,
    shipping_address jsonb,
    paypal_transaction_id character varying(100),
    status character varying(50) DEFAULT 'pending'::character varying,
    tracking_number character varying(100),
    tracking_carrier character varying(50),
    estimated_delivery date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shipping_carrier character varying(50),
    shipping_service character varying(100),
    shipping_cost_cents bigint DEFAULT 0,
    estimated_delivery_days integer,
    delivery_method character varying(50) DEFAULT 'shipping'::character varying,
    pickup_deadline timestamp without time zone,
    platform_fee_cents bigint DEFAULT 0,
    seller_payout_cents bigint DEFAULT 0,
    paypal_order_id character varying(255),
    paypal_capture_id character varying(255),
    escrow_status character varying(50) DEFAULT 'pending'::character varying,
    buyer_role character varying(20) DEFAULT 'buyer'::character varying,
    seller_role character varying(20) DEFAULT 'seller'::character varying,
    donation_id uuid,
    description character varying(255),
    currency_code character varying(10) DEFAULT 'USD'::character varying,
    payment_method character varying(20) DEFAULT 'paypal'::character varying
);


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    transaction_type character varying(50) DEFAULT 'purchase'::character varying,
    reviewer_id uuid NOT NULL,
    reviewee_id uuid NOT NULL,
    listing_id uuid,
    rating integer,
    feedback text,
    response_text text,
    would_recommend boolean DEFAULT true,
    item_as_described integer,
    communication integer,
    shipping_speed integer,
    release_escrow boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ratings_communication_check CHECK (((communication >= 1) AND (communication <= 5))),
    CONSTRAINT ratings_item_as_described_check CHECK (((item_as_described >= 1) AND (item_as_described <= 5))),
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT ratings_shipping_speed_check CHECK (((shipping_speed >= 1) AND (shipping_speed <= 5)))
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_user_id uuid NOT NULL,
    referral_code_used character varying(32),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: refresh_token_revocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_token_revocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_family character varying(64) NOT NULL,
    revoked_at timestamp with time zone DEFAULT now()
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(128) NOT NULL,
    token_family character varying(64) NOT NULL,
    device_fingerprint character varying(128),
    ip_address character varying(45),
    is_used boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sales_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid,
    listing_title character varying(255),
    listing_type character varying(50),
    buyer_id uuid,
    seller_id uuid,
    amount_cents bigint,
    platform_fee_cents bigint,
    seller_payout_cents bigint,
    paypal_transaction_id character varying(100),
    shipping_address jsonb,
    tracking_number character varying(100),
    completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    retained_until timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '3 years'::interval),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_searches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255),
    search_type character varying(20) NOT NULL,
    filters jsonb NOT NULL,
    notification_frequency character varying(20) DEFAULT 'instant'::character varying,
    last_notified_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: search_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_matches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    saved_search_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    match_score integer DEFAULT 100,
    match_reason text,
    notified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: seasonal_trends; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seasonal_trends (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category character varying(100) NOT NULL,
    month integer NOT NULL,
    demand_multiplier numeric(3,2) DEFAULT 1.0,
    price_multiplier numeric(3,2) DEFAULT 1.0,
    keywords text[]
);


--
-- Name: seller_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    seller_id uuid NOT NULL,
    date date NOT NULL,
    listings_active integer DEFAULT 0,
    sales_count integer DEFAULT 0,
    revenue_cents bigint DEFAULT 0,
    views integer DEFAULT 0,
    inquiries integer DEFAULT 0,
    conversion_rate numeric(5,2) DEFAULT 0,
    avg_response_time_minutes integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: seller_ratings_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_ratings_summary (
    seller_id uuid NOT NULL,
    average_rating numeric(3,2) DEFAULT 0,
    total_ratings integer DEFAULT 0,
    five_star integer DEFAULT 0,
    four_star integer DEFAULT 0,
    three_star integer DEFAULT 0,
    two_star integer DEFAULT 0,
    one_star integer DEFAULT 0,
    item_as_described_avg numeric(3,2) DEFAULT 0,
    communication_avg numeric(3,2) DEFAULT 0,
    shipping_speed_avg numeric(3,2) DEFAULT 0,
    would_recommend_percent integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: seller_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    id_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    address_verified boolean DEFAULT false,
    verification_level character varying(20) DEFAULT 'unverified'::character varying,
    id_document_url text,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: serial_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.serial_counters (
    currency character varying(10) NOT NULL,
    last_sequence bigint DEFAULT 0,
    prefix character varying(10) NOT NULL
);


--
-- Name: shop_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_admins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role character varying(50) DEFAULT 'moderator'::character varying,
    permissions jsonb DEFAULT '{"adjust_fees": false, "suspend_users": false, "view_analytics": true, "manage_disputes": true, "approve_listings": true}'::jsonb,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: shop_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category character varying(100) NOT NULL,
    display_name character varying(255) NOT NULL,
    parent_category character varying(100),
    icon character varying(10) DEFAULT '📦'::character varying,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    full_path character varying(500),
    level integer DEFAULT 1,
    sort_order integer DEFAULT 0
);


--
-- Name: shop_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_stats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid NOT NULL,
    views integer DEFAULT 0,
    orders integer DEFAULT 0,
    revenue_cents bigint DEFAULT 0,
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    seller_id uuid NOT NULL,
    store_name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    logo_url text,
    banner_url text,
    custom_domain character varying(255),
    is_custom_domain_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    store_settings jsonb DEFAULT '{"allow_offers": true, "return_policy": "", "shipping_zones": [], "processing_time_days": 2}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paypal_email character varying(255),
    return_policy text,
    shipping_policy text,
    processing_time_days integer DEFAULT 2,
    settings jsonb DEFAULT '{"accept_offers": true, "vacation_mode": false, "shipping_zones": [], "vacation_message": "", "auto_approve_offers": false, "minimum_offer_percent": 50}'::jsonb,
    theme_color character varying(7) DEFAULT '#0b1f3f'::character varying,
    secondary_color character varying(7) DEFAULT '#ffd700'::character varying,
    text_color character varying(7) DEFAULT '#f5f5f5'::character varying,
    font_family character varying(50) DEFAULT 'Arial, sans-serif'::character varying,
    layout_style character varying(20) DEFAULT 'grid'::character varying,
    show_seller_info boolean DEFAULT true
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    description text,
    price_monthly_cents bigint,
    price_yearly_cents bigint,
    platform_fee_percent numeric(5,2) DEFAULT 5.0,
    features jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan character varying(20) DEFAULT 'free'::character varying NOT NULL,
    source character varying(30) DEFAULT 'purchase'::character varying,
    starts_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    promo_campaign_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    duration_months integer DEFAULT 12
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying,
    status character varying(20) DEFAULT 'open'::character varying,
    admin_response text,
    responded_by uuid,
    responded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: suspension_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suspension_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    duration_days integer,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: testing_disclaimer; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.testing_disclaimer AS
 SELECT 'THIS IS A TESTING SYSTEM ONLY. No real currency or financial instruments are being offered. All clone currency transactions are mock/simulated. Regulatory approval is being sought.'::text AS disclaimer;


--
-- Name: transaction_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_ratings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    purchase_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    rater_id uuid NOT NULL,
    ratee_id uuid NOT NULL,
    rating_type character varying(20) NOT NULL,
    overall_rating integer,
    communication_rating integer,
    payment_speed_rating integer,
    shipping_speed_rating integer,
    item_accuracy_rating integer,
    feedback text,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transaction_ratings_communication_rating_check CHECK (((communication_rating >= 1) AND (communication_rating <= 5))),
    CONSTRAINT transaction_ratings_item_accuracy_rating_check CHECK (((item_accuracy_rating >= 1) AND (item_accuracy_rating <= 5))),
    CONSTRAINT transaction_ratings_overall_rating_check CHECK (((overall_rating >= 1) AND (overall_rating <= 5))),
    CONSTRAINT transaction_ratings_payment_speed_rating_check CHECK (((payment_speed_rating >= 1) AND (payment_speed_rating <= 5))),
    CONSTRAINT transaction_ratings_shipping_speed_rating_check CHECK (((shipping_speed_rating >= 1) AND (shipping_speed_rating <= 5)))
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transaction_hash uuid DEFAULT public.uuid_generate_v4(),
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    amount_cents bigint NOT NULL,
    balance_after_cents bigint NOT NULL,
    currency_clone character varying(50) DEFAULT 'Credon-USD'::character varying,
    reference_id uuid,
    description text,
    is_mock boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: treasury_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treasury_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    amount_cents bigint NOT NULL,
    reason character varying(255),
    action character varying(30) NOT NULL,
    admin_id uuid,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    title character varying(255)
);


--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_fingerprint text NOT NULL,
    user_agent text,
    ip_address inet,
    last_verified_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: usb_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usb_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount_cents bigint NOT NULL,
    quantity integer DEFAULT 1,
    shipping_address text NOT NULL,
    shipping_city character varying(255) NOT NULL,
    shipping_state character varying(100),
    shipping_zip character varying(20) NOT NULL,
    shipping_country character varying(100) DEFAULT 'US'::character varying,
    buyer_name character varying(255),
    buyer_email character varying(255),
    guest_token character varying(64),
    status character varying(30) DEFAULT 'pending_payment'::character varying,
    tracking_number character varying(100),
    shipped_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_2fa_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_2fa_settings (
    user_id uuid NOT NULL,
    telegram_enabled boolean DEFAULT false,
    telegram_chat_id character varying(100),
    whatsapp_enabled boolean DEFAULT false,
    whatsapp_number character varying(20),
    preferred_method character varying(20) DEFAULT 'email'::character varying,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_rating_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_rating_summaries (
    user_id uuid NOT NULL,
    seller_avg_rating numeric(3,2) DEFAULT 0,
    seller_total_ratings integer DEFAULT 0,
    seller_communication_avg numeric(3,2) DEFAULT 0,
    seller_shipping_avg numeric(3,2) DEFAULT 0,
    seller_item_accuracy_avg numeric(3,2) DEFAULT 0,
    buyer_avg_rating numeric(3,2) DEFAULT 0,
    buyer_total_ratings integer DEFAULT 0,
    buyer_communication_avg numeric(3,2) DEFAULT 0,
    buyer_payment_speed_avg numeric(3,2) DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    billing_cycle character varying(10) DEFAULT 'monthly'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    auto_renew boolean DEFAULT true,
    paypal_subscription_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_method character varying(20) DEFAULT 'paypal'::character varying
);


--
-- Name: user_totp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_totp (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    secret character varying(64) NOT NULL,
    is_enabled boolean DEFAULT false,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255),
    whatsapp_number character varying(50),
    is_super_admin boolean DEFAULT false,
    is_suspended boolean DEFAULT false,
    suspension_end_date timestamp without time zone,
    suspension_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    purchase_count bigint DEFAULT 0,
    is_active boolean DEFAULT true,
    last_mandatory_2fa timestamp with time zone,
    referral_code character varying(32),
    referred_by uuid,
    join_reason text,
    credon_approved boolean DEFAULT false,
    credon_pending boolean DEFAULT false,
    total_referrals integer DEFAULT 0,
    affiliate_balance_cents integer DEFAULT 0,
    total_affiliate_earned_cents integer DEFAULT 0,
    subscription_plan character varying(20) DEFAULT 'free'::character varying
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    balance_cents bigint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: active_loans active_loans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_loans
    ADD CONSTRAINT active_loans_pkey PRIMARY KEY (id);


--
-- Name: admin_availability admin_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_availability
    ADD CONSTRAINT admin_availability_pkey PRIMARY KEY (id);


--
-- Name: affiliate_commissions affiliate_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_pkey PRIMARY KEY (id);


--
-- Name: affiliate_invites affiliate_invites_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_invites
    ADD CONSTRAINT affiliate_invites_code_key UNIQUE (code);


--
-- Name: affiliate_invites affiliate_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_invites
    ADD CONSTRAINT affiliate_invites_pkey PRIMARY KEY (id);


--
-- Name: affiliate_payouts affiliate_payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_payouts
    ADD CONSTRAINT affiliate_payouts_pkey PRIMARY KEY (id);


--
-- Name: affiliate_settings affiliate_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_settings
    ADD CONSTRAINT affiliate_settings_pkey PRIMARY KEY (id);


--
-- Name: affiliate_settings affiliate_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_settings
    ADD CONSTRAINT affiliate_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: analytics_daily analytics_daily_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_daily
    ADD CONSTRAINT analytics_daily_date_key UNIQUE (date);


--
-- Name: analytics_daily analytics_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_daily
    ADD CONSTRAINT analytics_daily_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: auction_bids auction_bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auction_bids
    ADD CONSTRAINT auction_bids_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: category_analytics category_analytics_date_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_analytics
    ADD CONSTRAINT category_analytics_date_category_key UNIQUE (date, category);


--
-- Name: category_analytics category_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_analytics
    ADD CONSTRAINT category_analytics_pkey PRIMARY KEY (id);


--
-- Name: category_suggestions category_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_suggestions
    ADD CONSTRAINT category_suggestions_pkey PRIMARY KEY (id);


--
-- Name: category_translations category_translations_category_language_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_translations
    ADD CONSTRAINT category_translations_category_language_code_key UNIQUE (category, language_code);


--
-- Name: category_translations category_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_translations
    ADD CONSTRAINT category_translations_pkey PRIMARY KEY (id);


--
-- Name: competitor_insights competitor_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitor_insights
    ADD CONSTRAINT competitor_insights_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_listing_id_buyer_id_seller_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_listing_id_buyer_id_seller_id_key UNIQUE (listing_id, buyer_id, seller_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: currency_serials currency_serials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_serials
    ADD CONSTRAINT currency_serials_pkey PRIMARY KEY (id);


--
-- Name: currency_serials currency_serials_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_serials
    ADD CONSTRAINT currency_serials_serial_number_key UNIQUE (serial_number);


--
-- Name: currency_verifications currency_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_verifications
    ADD CONSTRAINT currency_verifications_pkey PRIMARY KEY (id);


--
-- Name: dispute_evidence dispute_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_pkey PRIMARY KEY (id);


--
-- Name: dispute_messages dispute_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: escrow_transactions escrow_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_from_currency_to_currency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_from_currency_to_currency_key UNIQUE (from_currency, to_currency);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: fee_transactions fee_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_transactions
    ADD CONSTRAINT fee_transactions_pkey PRIMARY KEY (id);


--
-- Name: gift_card_transactions gift_card_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT gift_card_transactions_pkey PRIMARY KEY (id);


--
-- Name: gift_cards gift_cards_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_code_key UNIQUE (code);


--
-- Name: gift_cards gift_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_pkey PRIMARY KEY (id);


--
-- Name: help_articles help_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_articles
    ADD CONSTRAINT help_articles_pkey PRIMARY KEY (id);


--
-- Name: help_articles help_articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_articles
    ADD CONSTRAINT help_articles_slug_key UNIQUE (slug);


--
-- Name: listing_translations listing_translations_listing_id_language_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_translations
    ADD CONSTRAINT listing_translations_listing_id_language_code_key UNIQUE (listing_id, language_code);


--
-- Name: listing_translations listing_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_translations
    ADD CONSTRAINT listing_translations_pkey PRIMARY KEY (id);


--
-- Name: listing_views listing_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_views
    ADD CONSTRAINT listing_views_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: loan_repayments loan_repayments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT loan_repayments_pkey PRIMARY KEY (id);


--
-- Name: loan_requests loan_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_requests
    ADD CONSTRAINT loan_requests_pkey PRIMARY KEY (id);


--
-- Name: login_verification_codes login_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_verification_codes
    ADD CONSTRAINT login_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: lottery_draws lottery_draws_campaign_id_week_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_draws
    ADD CONSTRAINT lottery_draws_campaign_id_week_number_key UNIQUE (campaign_id, week_number);


--
-- Name: lottery_draws lottery_draws_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_draws
    ADD CONSTRAINT lottery_draws_pkey PRIMARY KEY (id);


--
-- Name: lottery_winners lottery_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_winners
    ADD CONSTRAINT lottery_winners_pkey PRIMARY KEY (id);


--
-- Name: market_trends market_trends_category_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_trends
    ADD CONSTRAINT market_trends_category_date_key UNIQUE (category, date);


--
-- Name: market_trends market_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_trends
    ADD CONSTRAINT market_trends_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: minting_logs minting_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.minting_logs
    ADD CONSTRAINT minting_logs_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: paper_currency_orders paper_currency_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paper_currency_orders
    ADD CONSTRAINT paper_currency_orders_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_key UNIQUE (token);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: price_predictions price_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_predictions
    ADD CONSTRAINT price_predictions_pkey PRIMARY KEY (id);


--
-- Name: procurement_matches procurement_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_pkey PRIMARY KEY (id);


--
-- Name: procurement_matches procurement_matches_procurement_id_matching_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_procurement_id_matching_listing_id_key UNIQUE (procurement_id, matching_listing_id);


--
-- Name: promo_campaigns promo_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_campaigns
    ADD CONSTRAINT promo_campaigns_pkey PRIMARY KEY (id);


--
-- Name: promo_entries promo_entries_campaign_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_entries
    ADD CONSTRAINT promo_entries_campaign_id_user_id_key UNIQUE (campaign_id, user_id);


--
-- Name: promo_entries promo_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_entries
    ADD CONSTRAINT promo_entries_pkey PRIMARY KEY (id);


--
-- Name: promotion_usage promotion_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_code_key UNIQUE (code);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_order_id_reviewer_id_reviewee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_order_id_reviewer_id_reviewee_id_key UNIQUE (order_id, reviewer_id, reviewee_id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: refresh_token_revocations refresh_token_revocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token_revocations
    ADD CONSTRAINT refresh_token_revocations_pkey PRIMARY KEY (id);


--
-- Name: refresh_token_revocations refresh_token_revocations_token_family_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token_revocations
    ADD CONSTRAINT refresh_token_revocations_token_family_key UNIQUE (token_family);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_family_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_family_unique UNIQUE (token_family);


--
-- Name: sales_history sales_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_pkey PRIMARY KEY (id);


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);


--
-- Name: search_matches search_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_pkey PRIMARY KEY (id);


--
-- Name: search_matches search_matches_saved_search_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_saved_search_id_listing_id_key UNIQUE (saved_search_id, listing_id);


--
-- Name: seasonal_trends seasonal_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seasonal_trends
    ADD CONSTRAINT seasonal_trends_pkey PRIMARY KEY (id);


--
-- Name: seller_analytics seller_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_analytics
    ADD CONSTRAINT seller_analytics_pkey PRIMARY KEY (id);


--
-- Name: seller_analytics seller_analytics_seller_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_analytics
    ADD CONSTRAINT seller_analytics_seller_id_date_key UNIQUE (seller_id, date);


--
-- Name: seller_ratings_summary seller_ratings_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_ratings_summary
    ADD CONSTRAINT seller_ratings_summary_pkey PRIMARY KEY (seller_id);


--
-- Name: seller_verifications seller_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_verifications
    ADD CONSTRAINT seller_verifications_pkey PRIMARY KEY (id);


--
-- Name: seller_verifications seller_verifications_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_verifications
    ADD CONSTRAINT seller_verifications_user_id_key UNIQUE (user_id);


--
-- Name: serial_counters serial_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_counters
    ADD CONSTRAINT serial_counters_pkey PRIMARY KEY (currency);


--
-- Name: shop_admins shop_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_pkey PRIMARY KEY (id);


--
-- Name: shop_admins shop_admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_user_id_key UNIQUE (user_id);


--
-- Name: shop_categories shop_categories_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_category_key UNIQUE (category);


--
-- Name: shop_categories shop_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_pkey PRIMARY KEY (id);


--
-- Name: shop_messages shop_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_messages
    ADD CONSTRAINT shop_messages_pkey PRIMARY KEY (id);


--
-- Name: store_stats store_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_stats
    ADD CONSTRAINT store_stats_pkey PRIMARY KEY (id);


--
-- Name: store_stats store_stats_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_stats
    ADD CONSTRAINT store_stats_store_id_key UNIQUE (store_id);


--
-- Name: stores stores_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_custom_domain_key UNIQUE (custom_domain);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_slug_key UNIQUE (slug);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: suspension_logs suspension_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspension_logs
    ADD CONSTRAINT suspension_logs_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: transaction_ratings transaction_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_pkey PRIMARY KEY (id);


--
-- Name: transaction_ratings transaction_ratings_purchase_id_rater_id_rating_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_purchase_id_rater_id_rating_type_key UNIQUE (purchase_id, rater_id, rating_type);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: treasury_ledger treasury_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treasury_ledger
    ADD CONSTRAINT treasury_ledger_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_user_id_device_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_device_fingerprint_key UNIQUE (user_id, device_fingerprint);


--
-- Name: usb_purchases usb_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usb_purchases
    ADD CONSTRAINT usb_purchases_pkey PRIMARY KEY (id);


--
-- Name: user_2fa_settings user_2fa_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_2fa_settings
    ADD CONSTRAINT user_2fa_settings_pkey PRIMARY KEY (user_id);


--
-- Name: user_rating_summaries user_rating_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rating_summaries
    ADD CONSTRAINT user_rating_summaries_pkey PRIMARY KEY (user_id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_totp user_totp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_totp
    ADD CONSTRAINT user_totp_pkey PRIMARY KEY (id);


--
-- Name: user_totp user_totp_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_totp
    ADD CONSTRAINT user_totp_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: idx_affiliate_invites_affiliate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affiliate_invites_affiliate ON public.affiliate_invites USING btree (affiliate_id);


--
-- Name: idx_affiliate_invites_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affiliate_invites_code ON public.affiliate_invites USING btree (code);


--
-- Name: idx_appointments_appointment_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_appointment_time ON public.appointments USING btree (appointment_time);


--
-- Name: idx_appointments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_user_id ON public.appointments USING btree (user_id);


--
-- Name: idx_auction_bids_bidder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auction_bids_bidder_id ON public.auction_bids USING btree (bidder_id);


--
-- Name: idx_auction_bids_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auction_bids_listing_id ON public.auction_bids USING btree (listing_id);


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs USING btree (admin_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_bids_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_status ON public.bids USING btree (status);


--
-- Name: idx_bids_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_user_id ON public.bids USING btree (user_id);


--
-- Name: idx_carts_guest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carts_guest ON public.carts USING btree (guest_token);


--
-- Name: idx_category_translations_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_translations_category ON public.category_translations USING btree (category);


--
-- Name: idx_category_translations_lang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_translations_lang ON public.category_translations USING btree (language_code);


--
-- Name: idx_conversations_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_buyer_id ON public.conversations USING btree (buyer_id);


--
-- Name: idx_conversations_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_seller_id ON public.conversations USING btree (seller_id);


--
-- Name: idx_currency_serials_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_currency_serials_currency ON public.currency_serials USING btree (currency);


--
-- Name: idx_currency_serials_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_currency_serials_number ON public.currency_serials USING btree (serial_number);


--
-- Name: idx_currency_serials_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_currency_serials_owner ON public.currency_serials USING btree (owner_id);


--
-- Name: idx_disputes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);


--
-- Name: idx_disputes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_user_id ON public.disputes USING btree (user_id);


--
-- Name: idx_listing_translations_lang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_translations_lang ON public.listing_translations USING btree (language_code);


--
-- Name: idx_listing_translations_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_translations_listing ON public.listing_translations USING btree (listing_id);


--
-- Name: idx_listings_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_expires_at ON public.listings USING btree (expires_at);


--
-- Name: idx_listings_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_seller_id ON public.listings USING btree (seller_id);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_status ON public.listings USING btree (status);


--
-- Name: idx_listings_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_type ON public.listings USING btree (type);


--
-- Name: idx_login_verification_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_verification_codes_expires_at ON public.login_verification_codes USING btree (expires_at);


--
-- Name: idx_login_verification_codes_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_verification_codes_session_id ON public.login_verification_codes USING btree (session_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_promotions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_active ON public.promotions USING btree (is_active);


--
-- Name: idx_promotions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_code ON public.promotions USING btree (code);


--
-- Name: idx_promotions_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_seller_id ON public.promotions USING btree (seller_id);


--
-- Name: idx_refresh_tokens_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_family ON public.refresh_tokens USING btree (token_family);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_shop_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shop_messages_conversation_id ON public.shop_messages USING btree (conversation_id);


--
-- Name: idx_shop_messages_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shop_messages_is_read ON public.shop_messages USING btree (is_read);


--
-- Name: idx_shop_messages_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shop_messages_sender_id ON public.shop_messages USING btree (sender_id);


--
-- Name: idx_suspension_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suspension_logs_user_id ON public.suspension_logs USING btree (user_id);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);


--
-- Name: idx_translations_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translations_search ON public.listing_translations USING gin (search_vector);


--
-- Name: idx_treasury_ledger_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treasury_ledger_action ON public.treasury_ledger USING btree (action);


--
-- Name: idx_treasury_ledger_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treasury_ledger_created ON public.treasury_ledger USING btree (created_at);


--
-- Name: shop_categories add_other_subcategory_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER add_other_subcategory_trigger AFTER INSERT ON public.shop_categories FOR EACH ROW EXECUTE FUNCTION public.add_other_subcategory();


--
-- Name: listing_translations trg_translation_search_vector; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_translation_search_vector BEFORE INSERT OR UPDATE ON public.listing_translations FOR EACH ROW EXECUTE FUNCTION public.update_translation_search_vector();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bids update_bids_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: disputes update_disputes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: exchange_rates update_exchange_rates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON public.exchange_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: wallets update_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: active_loans active_loans_loan_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_loans
    ADD CONSTRAINT active_loans_loan_request_id_fkey FOREIGN KEY (loan_request_id) REFERENCES public.loan_requests(id);


--
-- Name: active_loans active_loans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_loans
    ADD CONSTRAINT active_loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: admin_availability admin_availability_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_availability
    ADD CONSTRAINT admin_availability_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: affiliate_commissions affiliate_commissions_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.users(id);


--
-- Name: affiliate_commissions affiliate_commissions_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- Name: affiliate_invites affiliate_invites_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_invites
    ADD CONSTRAINT affiliate_invites_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: affiliate_invites affiliate_invites_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_invites
    ADD CONSTRAINT affiliate_invites_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.users(id);


--
-- Name: affiliate_payouts affiliate_payouts_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_payouts
    ADD CONSTRAINT affiliate_payouts_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.users(id);


--
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: auction_bids auction_bids_bidder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auction_bids
    ADD CONSTRAINT auction_bids_bidder_id_fkey FOREIGN KEY (bidder_id) REFERENCES public.users(id);


--
-- Name: auction_bids auction_bids_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auction_bids
    ADD CONSTRAINT auction_bids_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bids bids_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: carts carts_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: category_suggestions category_suggestions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_suggestions
    ADD CONSTRAINT category_suggestions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: category_suggestions category_suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_suggestions
    ADD CONSTRAINT category_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: competitor_insights competitor_insights_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitor_insights
    ADD CONSTRAINT competitor_insights_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: currency_serials currency_serials_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_serials
    ADD CONSTRAINT currency_serials_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.paper_currency_orders(id);


--
-- Name: currency_serials currency_serials_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_serials
    ADD CONSTRAINT currency_serials_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: dispute_evidence dispute_evidence_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;


--
-- Name: dispute_evidence dispute_evidence_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dispute_messages dispute_messages_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;


--
-- Name: dispute_messages dispute_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: disputes disputes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: disputes disputes_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: disputes disputes_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


--
-- Name: disputes disputes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: donations donations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: escrow_transactions escrow_transactions_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: exchange_rates exchange_rates_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: gift_card_transactions gift_card_transactions_gift_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT gift_card_transactions_gift_card_id_fkey FOREIGN KEY (gift_card_id) REFERENCES public.gift_cards(id) ON DELETE CASCADE;


--
-- Name: gift_card_transactions gift_card_transactions_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT gift_card_transactions_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE SET NULL;


--
-- Name: gift_cards gift_cards_purchaser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_purchaser_id_fkey FOREIGN KEY (purchaser_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gift_cards gift_cards_redeemed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: help_articles help_articles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_articles
    ADD CONSTRAINT help_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: listing_translations listing_translations_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_translations
    ADD CONSTRAINT listing_translations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listing_views listing_views_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_views
    ADD CONSTRAINT listing_views_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: listing_views listing_views_viewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_views
    ADD CONSTRAINT listing_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id);


--
-- Name: listings listings_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: listings listings_current_bidder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_current_bidder_id_fkey FOREIGN KEY (current_bidder_id) REFERENCES public.users(id);


--
-- Name: listings listings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listings listings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;


--
-- Name: loan_repayments loan_repayments_active_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT loan_repayments_active_loan_id_fkey FOREIGN KEY (active_loan_id) REFERENCES public.active_loans(id);


--
-- Name: loan_repayments loan_repayments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT loan_repayments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: loan_requests loan_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_requests
    ADD CONSTRAINT loan_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: loan_requests loan_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_requests
    ADD CONSTRAINT loan_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: login_verification_codes login_verification_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_verification_codes
    ADD CONSTRAINT login_verification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lottery_draws lottery_draws_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_draws
    ADD CONSTRAINT lottery_draws_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.promo_campaigns(id);


--
-- Name: lottery_winners lottery_winners_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_winners
    ADD CONSTRAINT lottery_winners_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.lottery_draws(id);


--
-- Name: lottery_winners lottery_winners_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_winners
    ADD CONSTRAINT lottery_winners_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.promo_entries(id);


--
-- Name: messages messages_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: minting_logs minting_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.minting_logs
    ADD CONSTRAINT minting_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: offers offers_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: offers offers_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: paper_currency_orders paper_currency_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paper_currency_orders
    ADD CONSTRAINT paper_currency_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: platform_settings platform_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: procurement_matches procurement_matches_matching_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_matching_listing_id_fkey FOREIGN KEY (matching_listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: procurement_matches procurement_matches_procurement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_procurement_id_fkey FOREIGN KEY (procurement_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: promo_campaigns promo_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_campaigns
    ADD CONSTRAINT promo_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: promo_entries promo_entries_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_entries
    ADD CONSTRAINT promo_entries_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.promo_campaigns(id);


--
-- Name: promo_entries promo_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_entries
    ADD CONSTRAINT promo_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: promotion_usage promotion_usage_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: promotion_usage promotion_usage_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- Name: promotion_usage promotion_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: purchases purchases_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: purchases purchases_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: purchases purchases_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: ratings ratings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: ratings ratings_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.users(id);


--
-- Name: ratings ratings_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: referrals referrals_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.users(id);


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sales_history sales_history_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: sales_history sales_history_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: saved_searches saved_searches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: search_matches search_matches_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: search_matches search_matches_saved_search_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_saved_search_id_fkey FOREIGN KEY (saved_search_id) REFERENCES public.saved_searches(id) ON DELETE CASCADE;


--
-- Name: seller_analytics seller_analytics_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_analytics
    ADD CONSTRAINT seller_analytics_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: seller_ratings_summary seller_ratings_summary_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_ratings_summary
    ADD CONSTRAINT seller_ratings_summary_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: seller_verifications seller_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_verifications
    ADD CONSTRAINT seller_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: seller_verifications seller_verifications_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_verifications
    ADD CONSTRAINT seller_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: shop_admins shop_admins_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: shop_admins shop_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shop_messages shop_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_messages
    ADD CONSTRAINT shop_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: shop_messages shop_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_messages
    ADD CONSTRAINT shop_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: store_stats store_stats_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_stats
    ADD CONSTRAINT store_stats_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: stores stores_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_promo_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_promo_campaign_id_fkey FOREIGN KEY (promo_campaign_id) REFERENCES public.promo_campaigns(id);


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: support_tickets support_tickets_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: suspension_logs suspension_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspension_logs
    ADD CONSTRAINT suspension_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: suspension_logs suspension_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspension_logs
    ADD CONSTRAINT suspension_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_ratee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_ratee_id_fkey FOREIGN KEY (ratee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_rater_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_rater_id_fkey FOREIGN KEY (rater_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: treasury_ledger treasury_ledger_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treasury_ledger
    ADD CONSTRAINT treasury_ledger_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: trusted_devices trusted_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: usb_purchases usb_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usb_purchases
    ADD CONSTRAINT usb_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_2fa_settings user_2fa_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_2fa_settings
    ADD CONSTRAINT user_2fa_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_rating_summaries user_rating_summaries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rating_summaries
    ADD CONSTRAINT user_rating_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_totp user_totp_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_totp
    ADD CONSTRAINT user_totp_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id);


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict bGgkqBcJQvXJNcBHDX168liiaSIsaLtI17tVErEuPnJ46NZrvOQDPX0cHxQHIEa

