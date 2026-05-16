--
-- PostgreSQL database dump
--

\restrict FxBvXxKxUnbJBKPeSckMxwt5smAFz9l54BE2WfskhgA1srKC4qgPhLGkqclpeDK

-- Dumped from database version 15.16 (Debian 15.16-0+deb12u1)
-- Dumped by pg_dump version 15.16 (Debian 15.16-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: add_other_subcategory(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_other_subcategory() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only add 'Other' for main categories (level 1) or when explicitly requested
    IF NEW.level = 1 THEN
        INSERT INTO shop_categories (category, display_name, parent_category, icon, full_path, level, is_active)
        VALUES (
            NEW.category || '_other',
            'Other',
            NEW.category,
            '📦',
            NEW.full_path || '/other',
            2,
            true
        ) ON CONFLICT (category) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.add_other_subcategory() OWNER TO postgres;

--
-- Name: cleanup_expired_listings(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.cleanup_expired_listings() OWNER TO postgres;

--
-- Name: rebuild_category_paths(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.rebuild_category_paths() OWNER TO postgres;

--
-- Name: update_translation_search_vector(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.update_translation_search_vector() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: affiliate_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    setting_key character varying(50) NOT NULL,
    setting_value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.affiliate_settings OWNER TO postgres;

--
-- Name: analytics_daily; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.analytics_daily OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: heavenslive
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


ALTER TABLE public.appointments OWNER TO heavenslive;

--
-- Name: auction_bids; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.auction_bids OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: bids; Type: TABLE; Schema: public; Owner: heavenslive
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


ALTER TABLE public.bids OWNER TO heavenslive;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: postgres
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
    reminder_count integer DEFAULT 0
);


ALTER TABLE public.carts OWNER TO postgres;

--
-- Name: category_analytics; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.category_analytics OWNER TO postgres;

--
-- Name: category_suggestions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.category_suggestions OWNER TO postgres;

--
-- Name: category_translations; Type: TABLE; Schema: public; Owner: heavenslive
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


ALTER TABLE public.category_translations OWNER TO heavenslive;

--
-- Name: competitor_insights; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.competitor_insights OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: dispute_evidence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispute_evidence (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dispute_id uuid NOT NULL,
    uploaded_by uuid NOT NULL,
    file_url text NOT NULL,
    file_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dispute_evidence OWNER TO postgres;

--
-- Name: dispute_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispute_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dispute_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    is_admin_message boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dispute_messages OWNER TO postgres;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: heavenslive
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


ALTER TABLE public.disputes OWNER TO heavenslive;

--
-- Name: escrow_transactions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.escrow_transactions OWNER TO postgres;

--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.exchange_rates OWNER TO postgres;

--
-- Name: fee_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid,
    amount_cents bigint NOT NULL,
    fee_percent numeric(5,2) NOT NULL,
    collected_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fee_transactions OWNER TO postgres;

--
-- Name: gift_card_transactions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.gift_card_transactions OWNER TO postgres;

--
-- Name: gift_cards; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.gift_cards OWNER TO postgres;

--
-- Name: help_articles; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.help_articles OWNER TO postgres;

--
-- Name: listing_translations; Type: TABLE; Schema: public; Owner: heavenslive
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


ALTER TABLE public.listing_translations OWNER TO heavenslive;

--
-- Name: listing_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listing_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid NOT NULL,
    viewer_id uuid,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.listing_views OWNER TO postgres;

--
-- Name: listings; Type: TABLE; Schema: public; Owner: postgres
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
    is_featured boolean DEFAULT false
);


ALTER TABLE public.listings OWNER TO postgres;

--
-- Name: login_verification_codes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.login_verification_codes OWNER TO postgres;

--
-- Name: market_trends; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.market_trends OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: minting_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.minting_logs OWNER TO postgres;

--
-- Name: offers; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.offers OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    listing_id uuid,
    listing_type character varying(50),
    seller_id uuid,
    escrow_status character varying(50) DEFAULT 'pending'::character varying,
    escrow_release_date timestamp without time zone,
    escrow_id uuid
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value jsonb NOT NULL,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.platform_settings OWNER TO postgres;

--
-- Name: price_predictions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.price_predictions OWNER TO postgres;

--
-- Name: procurement_matches; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.procurement_matches OWNER TO postgres;

--
-- Name: promotion_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_usage (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    promotion_id uuid NOT NULL,
    user_id uuid NOT NULL,
    purchase_id uuid,
    discount_cents bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.promotion_usage OWNER TO postgres;

--
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.promotions OWNER TO postgres;

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: postgres
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
    seller_role character varying(20) DEFAULT 'seller'::character varying
);


ALTER TABLE public.purchases OWNER TO postgres;

--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: sales_history; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.sales_history OWNER TO postgres;

--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.saved_searches OWNER TO postgres;

--
-- Name: search_matches; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.search_matches OWNER TO postgres;

--
-- Name: seasonal_trends; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seasonal_trends (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category character varying(100) NOT NULL,
    month integer NOT NULL,
    demand_multiplier numeric(3,2) DEFAULT 1.0,
    price_multiplier numeric(3,2) DEFAULT 1.0,
    keywords text[]
);


ALTER TABLE public.seasonal_trends OWNER TO postgres;

--
-- Name: seller_analytics; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.seller_analytics OWNER TO postgres;

--
-- Name: seller_ratings_summary; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.seller_ratings_summary OWNER TO postgres;

--
-- Name: shop_admins; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.shop_admins OWNER TO postgres;

--
-- Name: shop_categories; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.shop_categories OWNER TO postgres;

--
-- Name: shop_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shop_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shop_messages OWNER TO postgres;

--
-- Name: store_stats; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.store_stats OWNER TO postgres;

--
-- Name: stores; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.stores OWNER TO postgres;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: suspension_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.suspension_logs OWNER TO postgres;

--
-- Name: testing_disclaimer; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.testing_disclaimer AS
 SELECT 'THIS IS A TESTING SYSTEM ONLY. No real currency or financial instruments are being offered. All clone currency transactions are mock/simulated. Regulatory approval is being sought.'::text AS disclaimer;


ALTER TABLE public.testing_disclaimer OWNER TO postgres;

--
-- Name: transaction_ratings; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.transaction_ratings OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: heavenslive
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


ALTER TABLE public.transactions OWNER TO heavenslive;

--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.trusted_devices OWNER TO postgres;

--
-- Name: user_rating_summaries; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.user_rating_summaries OWNER TO postgres;

--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_subscriptions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: heavenslive
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
    last_mandatory_2fa timestamp without time zone,
    is_active boolean DEFAULT true,
    paypal_email character varying(255),
    referral_code character varying(20),
    referred_by uuid,
    affiliate_balance_cents bigint DEFAULT 0,
    total_referrals integer DEFAULT 0,
    total_affiliate_earned_cents bigint DEFAULT 0,
    max_listings integer DEFAULT 10,
    max_images_per_listing integer DEFAULT 3,
    can_use_bulk_import boolean DEFAULT false,
    can_create_promotions boolean DEFAULT false,
    can_customize_store boolean DEFAULT false,
    can_view_analytics boolean DEFAULT false,
    featured_listings_count integer DEFAULT 0,
    priority_support boolean DEFAULT false,
    current_plan_id uuid
);


ALTER TABLE public.users OWNER TO heavenslive;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: heavenslive
--

CREATE TABLE public.wallets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    balance_cents bigint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wallets OWNER TO heavenslive;

--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wishlists OWNER TO postgres;

--
-- Name: affiliate_settings affiliate_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_settings
    ADD CONSTRAINT affiliate_settings_pkey PRIMARY KEY (id);


--
-- Name: affiliate_settings affiliate_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_settings
    ADD CONSTRAINT affiliate_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: analytics_daily analytics_daily_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_daily
    ADD CONSTRAINT analytics_daily_date_key UNIQUE (date);


--
-- Name: analytics_daily analytics_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_daily
    ADD CONSTRAINT analytics_daily_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: auction_bids auction_bids_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bids
    ADD CONSTRAINT auction_bids_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: category_analytics category_analytics_date_category_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_analytics
    ADD CONSTRAINT category_analytics_date_category_key UNIQUE (date, category);


--
-- Name: category_analytics category_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_analytics
    ADD CONSTRAINT category_analytics_pkey PRIMARY KEY (id);


--
-- Name: category_suggestions category_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_suggestions
    ADD CONSTRAINT category_suggestions_pkey PRIMARY KEY (id);


--
-- Name: category_translations category_translations_category_language_code_key; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.category_translations
    ADD CONSTRAINT category_translations_category_language_code_key UNIQUE (category, language_code);


--
-- Name: category_translations category_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.category_translations
    ADD CONSTRAINT category_translations_pkey PRIMARY KEY (id);


--
-- Name: competitor_insights competitor_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitor_insights
    ADD CONSTRAINT competitor_insights_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_listing_id_buyer_id_seller_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_listing_id_buyer_id_seller_id_key UNIQUE (listing_id, buyer_id, seller_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: dispute_evidence dispute_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_pkey PRIMARY KEY (id);


--
-- Name: dispute_messages dispute_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: escrow_transactions escrow_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_from_currency_to_currency_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_from_currency_to_currency_key UNIQUE (from_currency, to_currency);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: fee_transactions fee_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_transactions
    ADD CONSTRAINT fee_transactions_pkey PRIMARY KEY (id);


--
-- Name: gift_card_transactions gift_card_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT gift_card_transactions_pkey PRIMARY KEY (id);


--
-- Name: gift_cards gift_cards_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_code_key UNIQUE (code);


--
-- Name: gift_cards gift_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_pkey PRIMARY KEY (id);


--
-- Name: help_articles help_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_articles
    ADD CONSTRAINT help_articles_pkey PRIMARY KEY (id);


--
-- Name: help_articles help_articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_articles
    ADD CONSTRAINT help_articles_slug_key UNIQUE (slug);


--
-- Name: listing_translations listing_translations_listing_id_language_code_key; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.listing_translations
    ADD CONSTRAINT listing_translations_listing_id_language_code_key UNIQUE (listing_id, language_code);


--
-- Name: listing_translations listing_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.listing_translations
    ADD CONSTRAINT listing_translations_pkey PRIMARY KEY (id);


--
-- Name: listing_views listing_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_views
    ADD CONSTRAINT listing_views_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: login_verification_codes login_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_verification_codes
    ADD CONSTRAINT login_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: market_trends market_trends_category_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_trends
    ADD CONSTRAINT market_trends_category_date_key UNIQUE (category, date);


--
-- Name: market_trends market_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_trends
    ADD CONSTRAINT market_trends_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: minting_logs minting_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.minting_logs
    ADD CONSTRAINT minting_logs_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: price_predictions price_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_predictions
    ADD CONSTRAINT price_predictions_pkey PRIMARY KEY (id);


--
-- Name: procurement_matches procurement_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_pkey PRIMARY KEY (id);


--
-- Name: procurement_matches procurement_matches_procurement_id_matching_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_procurement_id_matching_listing_id_key UNIQUE (procurement_id, matching_listing_id);


--
-- Name: promotion_usage promotion_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_code_key UNIQUE (code);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_order_id_reviewer_id_reviewee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_order_id_reviewer_id_reviewee_id_key UNIQUE (order_id, reviewer_id, reviewee_id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: sales_history sales_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_pkey PRIMARY KEY (id);


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);


--
-- Name: search_matches search_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_pkey PRIMARY KEY (id);


--
-- Name: search_matches search_matches_saved_search_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_saved_search_id_listing_id_key UNIQUE (saved_search_id, listing_id);


--
-- Name: seasonal_trends seasonal_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seasonal_trends
    ADD CONSTRAINT seasonal_trends_pkey PRIMARY KEY (id);


--
-- Name: seller_analytics seller_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_analytics
    ADD CONSTRAINT seller_analytics_pkey PRIMARY KEY (id);


--
-- Name: seller_analytics seller_analytics_seller_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_analytics
    ADD CONSTRAINT seller_analytics_seller_id_date_key UNIQUE (seller_id, date);


--
-- Name: seller_ratings_summary seller_ratings_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_ratings_summary
    ADD CONSTRAINT seller_ratings_summary_pkey PRIMARY KEY (seller_id);


--
-- Name: shop_admins shop_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_pkey PRIMARY KEY (id);


--
-- Name: shop_admins shop_admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_user_id_key UNIQUE (user_id);


--
-- Name: shop_categories shop_categories_category_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_category_key UNIQUE (category);


--
-- Name: shop_categories shop_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_pkey PRIMARY KEY (id);


--
-- Name: shop_messages shop_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_messages
    ADD CONSTRAINT shop_messages_pkey PRIMARY KEY (id);


--
-- Name: store_stats store_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_stats
    ADD CONSTRAINT store_stats_pkey PRIMARY KEY (id);


--
-- Name: store_stats store_stats_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_stats
    ADD CONSTRAINT store_stats_store_id_key UNIQUE (store_id);


--
-- Name: stores stores_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_custom_domain_key UNIQUE (custom_domain);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_slug_key UNIQUE (slug);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: suspension_logs suspension_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspension_logs
    ADD CONSTRAINT suspension_logs_pkey PRIMARY KEY (id);


--
-- Name: transaction_ratings transaction_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_pkey PRIMARY KEY (id);


--
-- Name: transaction_ratings transaction_ratings_purchase_id_rater_id_rating_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_purchase_id_rater_id_rating_type_key UNIQUE (purchase_id, rater_id, rating_type);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_user_id_device_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_device_fingerprint_key UNIQUE (user_id, device_fingerprint);


--
-- Name: user_rating_summaries user_rating_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_rating_summaries
    ADD CONSTRAINT user_rating_summaries_pkey PRIMARY KEY (user_id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: idx_appointments_appointment_time; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_appointments_appointment_time ON public.appointments USING btree (appointment_time);


--
-- Name: idx_appointments_user_id; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_appointments_user_id ON public.appointments USING btree (user_id);


--
-- Name: idx_auction_bids_bidder_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_bids_bidder_id ON public.auction_bids USING btree (bidder_id);


--
-- Name: idx_auction_bids_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_bids_listing_id ON public.auction_bids USING btree (listing_id);


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs USING btree (admin_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_bids_status; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_bids_status ON public.bids USING btree (status);


--
-- Name: idx_bids_user_id; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_bids_user_id ON public.bids USING btree (user_id);


--
-- Name: idx_category_translations_category; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_category_translations_category ON public.category_translations USING btree (category);


--
-- Name: idx_category_translations_lang; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_category_translations_lang ON public.category_translations USING btree (language_code);


--
-- Name: idx_conversations_buyer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_buyer_id ON public.conversations USING btree (buyer_id);


--
-- Name: idx_conversations_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_seller_id ON public.conversations USING btree (seller_id);


--
-- Name: idx_disputes_status; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);


--
-- Name: idx_disputes_user_id; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_disputes_user_id ON public.disputes USING btree (user_id);


--
-- Name: idx_listing_translations_lang; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_listing_translations_lang ON public.listing_translations USING btree (language_code);


--
-- Name: idx_listing_translations_listing; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_listing_translations_listing ON public.listing_translations USING btree (listing_id);


--
-- Name: idx_listings_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_expires_at ON public.listings USING btree (expires_at);


--
-- Name: idx_listings_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_seller_id ON public.listings USING btree (seller_id);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_status ON public.listings USING btree (status);


--
-- Name: idx_listings_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_type ON public.listings USING btree (type);


--
-- Name: idx_login_verification_codes_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_verification_codes_expires_at ON public.login_verification_codes USING btree (expires_at);


--
-- Name: idx_login_verification_codes_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_verification_codes_session_id ON public.login_verification_codes USING btree (session_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_promotions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promotions_active ON public.promotions USING btree (is_active);


--
-- Name: idx_promotions_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promotions_code ON public.promotions USING btree (code);


--
-- Name: idx_promotions_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promotions_seller_id ON public.promotions USING btree (seller_id);


--
-- Name: idx_shop_messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shop_messages_conversation_id ON public.shop_messages USING btree (conversation_id);


--
-- Name: idx_shop_messages_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shop_messages_is_read ON public.shop_messages USING btree (is_read);


--
-- Name: idx_shop_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shop_messages_sender_id ON public.shop_messages USING btree (sender_id);


--
-- Name: idx_suspension_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suspension_logs_user_id ON public.suspension_logs USING btree (user_id);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);


--
-- Name: idx_translations_search; Type: INDEX; Schema: public; Owner: heavenslive
--

CREATE INDEX idx_translations_search ON public.listing_translations USING gin (search_vector);


--
-- Name: shop_categories add_other_subcategory_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER add_other_subcategory_trigger AFTER INSERT ON public.shop_categories FOR EACH ROW EXECUTE FUNCTION public.add_other_subcategory();


--
-- Name: listing_translations trg_translation_search_vector; Type: TRIGGER; Schema: public; Owner: heavenslive
--

CREATE TRIGGER trg_translation_search_vector BEFORE INSERT OR UPDATE ON public.listing_translations FOR EACH ROW EXECUTE FUNCTION public.update_translation_search_vector();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: heavenslive
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bids update_bids_updated_at; Type: TRIGGER; Schema: public; Owner: heavenslive
--

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: disputes update_disputes_updated_at; Type: TRIGGER; Schema: public; Owner: heavenslive
--

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: exchange_rates update_exchange_rates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON public.exchange_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: heavenslive
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: wallets update_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: heavenslive
--

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: auction_bids auction_bids_bidder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bids
    ADD CONSTRAINT auction_bids_bidder_id_fkey FOREIGN KEY (bidder_id) REFERENCES public.users(id);


--
-- Name: auction_bids auction_bids_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bids
    ADD CONSTRAINT auction_bids_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bids bids_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: carts carts_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: category_suggestions category_suggestions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_suggestions
    ADD CONSTRAINT category_suggestions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: category_suggestions category_suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_suggestions
    ADD CONSTRAINT category_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: competitor_insights competitor_insights_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitor_insights
    ADD CONSTRAINT competitor_insights_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dispute_evidence dispute_evidence_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;


--
-- Name: dispute_evidence dispute_evidence_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dispute_messages dispute_messages_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;


--
-- Name: dispute_messages dispute_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispute_messages
    ADD CONSTRAINT dispute_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: disputes disputes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: disputes disputes_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: disputes disputes_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


--
-- Name: disputes disputes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: escrow_transactions escrow_transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: escrow_transactions escrow_transactions_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.users(id);


--
-- Name: escrow_transactions escrow_transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: exchange_rates exchange_rates_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: gift_card_transactions gift_card_transactions_gift_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT gift_card_transactions_gift_card_id_fkey FOREIGN KEY (gift_card_id) REFERENCES public.gift_cards(id) ON DELETE CASCADE;


--
-- Name: gift_card_transactions gift_card_transactions_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT gift_card_transactions_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE SET NULL;


--
-- Name: gift_cards gift_cards_purchaser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_purchaser_id_fkey FOREIGN KEY (purchaser_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gift_cards gift_cards_redeemed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: help_articles help_articles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_articles
    ADD CONSTRAINT help_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: listing_translations listing_translations_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.listing_translations
    ADD CONSTRAINT listing_translations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listing_views listing_views_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_views
    ADD CONSTRAINT listing_views_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: listing_views listing_views_viewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_views
    ADD CONSTRAINT listing_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id);


--
-- Name: listings listings_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: listings listings_current_bidder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_current_bidder_id_fkey FOREIGN KEY (current_bidder_id) REFERENCES public.users(id);


--
-- Name: listings listings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listings listings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;


--
-- Name: login_verification_codes login_verification_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_verification_codes
    ADD CONSTRAINT login_verification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: minting_logs minting_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.minting_logs
    ADD CONSTRAINT minting_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: offers offers_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: offers offers_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: orders orders_escrow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_escrow_id_fkey FOREIGN KEY (escrow_id) REFERENCES public.escrow_transactions(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: platform_settings platform_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: procurement_matches procurement_matches_matching_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_matching_listing_id_fkey FOREIGN KEY (matching_listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: procurement_matches procurement_matches_procurement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_procurement_id_fkey FOREIGN KEY (procurement_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: promotion_usage promotion_usage_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: promotion_usage promotion_usage_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- Name: promotion_usage promotion_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: purchases purchases_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: purchases purchases_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: purchases purchases_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: ratings ratings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: ratings ratings_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.users(id);


--
-- Name: ratings ratings_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: sales_history sales_history_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: sales_history sales_history_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_history
    ADD CONSTRAINT sales_history_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: saved_searches saved_searches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: search_matches search_matches_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: search_matches search_matches_saved_search_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_matches
    ADD CONSTRAINT search_matches_saved_search_id_fkey FOREIGN KEY (saved_search_id) REFERENCES public.saved_searches(id) ON DELETE CASCADE;


--
-- Name: seller_analytics seller_analytics_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_analytics
    ADD CONSTRAINT seller_analytics_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: seller_ratings_summary seller_ratings_summary_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_ratings_summary
    ADD CONSTRAINT seller_ratings_summary_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shop_admins shop_admins_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: shop_admins shop_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_admins
    ADD CONSTRAINT shop_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shop_messages shop_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_messages
    ADD CONSTRAINT shop_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: shop_messages shop_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_messages
    ADD CONSTRAINT shop_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: store_stats store_stats_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_stats
    ADD CONSTRAINT store_stats_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: stores stores_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: suspension_logs suspension_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspension_logs
    ADD CONSTRAINT suspension_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: suspension_logs suspension_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspension_logs
    ADD CONSTRAINT suspension_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_ratee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_ratee_id_fkey FOREIGN KEY (ratee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transaction_ratings transaction_ratings_rater_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ratings
    ADD CONSTRAINT transaction_ratings_rater_id_fkey FOREIGN KEY (rater_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trusted_devices trusted_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_rating_summaries user_rating_summaries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_rating_summaries
    ADD CONSTRAINT user_rating_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_current_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_current_plan_id_fkey FOREIGN KEY (current_plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: users users_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id);


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: heavenslive
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO heavenslive;


--
-- Name: TABLE affiliate_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.affiliate_settings TO heavenslive;


--
-- Name: TABLE analytics_daily; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.analytics_daily TO heavenslive;


--
-- Name: TABLE auction_bids; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.auction_bids TO heavenslive;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO heavenslive;


--
-- Name: TABLE carts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.carts TO heavenslive;


--
-- Name: TABLE category_analytics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.category_analytics TO heavenslive;


--
-- Name: TABLE category_suggestions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.category_suggestions TO heavenslive;


--
-- Name: TABLE competitor_insights; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.competitor_insights TO heavenslive;


--
-- Name: TABLE conversations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.conversations TO heavenslive;


--
-- Name: TABLE dispute_evidence; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dispute_evidence TO heavenslive;


--
-- Name: TABLE dispute_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dispute_messages TO heavenslive;


--
-- Name: TABLE escrow_transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.escrow_transactions TO heavenslive;


--
-- Name: TABLE exchange_rates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exchange_rates TO heavenslive;


--
-- Name: TABLE fee_transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.fee_transactions TO heavenslive;


--
-- Name: TABLE gift_card_transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gift_card_transactions TO heavenslive;


--
-- Name: TABLE gift_cards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gift_cards TO heavenslive;


--
-- Name: TABLE help_articles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.help_articles TO heavenslive;


--
-- Name: TABLE listing_views; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.listing_views TO heavenslive;


--
-- Name: TABLE listings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.listings TO heavenslive;


--
-- Name: TABLE login_verification_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.login_verification_codes TO heavenslive;


--
-- Name: TABLE market_trends; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.market_trends TO heavenslive;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO heavenslive;


--
-- Name: TABLE minting_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.minting_logs TO heavenslive;


--
-- Name: TABLE offers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.offers TO heavenslive;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO heavenslive;


--
-- Name: TABLE platform_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.platform_settings TO heavenslive;


--
-- Name: TABLE price_predictions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.price_predictions TO heavenslive;


--
-- Name: TABLE procurement_matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.procurement_matches TO heavenslive;


--
-- Name: TABLE promotion_usage; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.promotion_usage TO heavenslive;


--
-- Name: TABLE promotions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.promotions TO heavenslive;


--
-- Name: TABLE purchases; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.purchases TO heavenslive;


--
-- Name: TABLE ratings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ratings TO heavenslive;


--
-- Name: TABLE sales_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sales_history TO heavenslive;


--
-- Name: TABLE saved_searches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.saved_searches TO heavenslive;


--
-- Name: TABLE search_matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.search_matches TO heavenslive;


--
-- Name: TABLE seasonal_trends; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.seasonal_trends TO heavenslive;


--
-- Name: TABLE seller_analytics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.seller_analytics TO heavenslive;


--
-- Name: TABLE seller_ratings_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.seller_ratings_summary TO heavenslive;


--
-- Name: TABLE shop_admins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.shop_admins TO heavenslive;


--
-- Name: TABLE shop_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.shop_categories TO heavenslive;


--
-- Name: TABLE shop_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.shop_messages TO heavenslive;


--
-- Name: TABLE store_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.store_stats TO heavenslive;


--
-- Name: TABLE stores; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.stores TO heavenslive;


--
-- Name: TABLE subscription_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.subscription_plans TO heavenslive;


--
-- Name: TABLE support_tickets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_tickets TO heavenslive;


--
-- Name: TABLE suspension_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.suspension_logs TO heavenslive;


--
-- Name: TABLE testing_disclaimer; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.testing_disclaimer TO heavenslive;


--
-- Name: TABLE transaction_ratings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transaction_ratings TO heavenslive;


--
-- Name: TABLE trusted_devices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trusted_devices TO heavenslive;


--
-- Name: TABLE user_rating_summaries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_rating_summaries TO heavenslive;


--
-- Name: TABLE user_subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_subscriptions TO heavenslive;


--
-- Name: TABLE wishlists; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wishlists TO heavenslive;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO heavenslive;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO heavenslive;


--
-- PostgreSQL database dump complete
--

\unrestrict FxBvXxKxUnbJBKPeSckMxwt5smAFz9l54BE2WfskhgA1srKC4qgPhLGkqclpeDK

