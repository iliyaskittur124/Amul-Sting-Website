-- ============================================================================
-- GCMMF (AMUL) × STING ROSE - ENTERPRISE SUPABASE DATABASE MIGRATION
-- Project: Amul Sting Animation & Beverage Innovation Platform
-- Schema Version: 2.8.0-ENTERPRISE
-- Target Engine: PostgreSQL 15+ / Supabase
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'DISPATCH_CONFIRMED',
        'EN_ROUTE_REEFER',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_status_type AS ENUM (
        'COMPLETED',
        'ACTIVE',
        'PENDING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. TABLE: ai_creations (Neural Sensory Formula Engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_code VARCHAR(32) NOT NULL UNIQUE,          -- e.g. 'AMUL-AI-001'
    edition_name VARCHAR(120) NOT NULL,                -- e.g. 'Neon Damask Overdrive'
    mood VARCHAR(80) NOT NULL,                         -- e.g. 'Late Night Coding Marathon'
    caffeine_pct SMALLINT NOT NULL CHECK (caffeine_pct BETWEEN 0 AND 100),
    dairy_pct SMALLINT NOT NULL CHECK (dairy_pct BETWEEN 0 AND 100),
    rose_pct SMALLINT NOT NULL CHECK (rose_pct BETWEEN 0 AND 100),
    chill_temp NUMERIC(4, 1) NOT NULL DEFAULT 4.0,     -- Serving temp in °C
    carbonation VARCHAR(60) NOT NULL DEFAULT 'Moderate Carbonation',
    caffeine_mg SMALLINT NOT NULL DEFAULT 75,
    color_glow VARCHAR(16) NOT NULL DEFAULT '#ff2d87',
    tagline TEXT,
    flavor_notes TEXT[] DEFAULT '{}',                  -- Array of sensory notes
    sensory_profile JSONB DEFAULT '{}'::jsonb,         -- {topNote, heartHarmony, finish}
    sommelier_review TEXT,
    recommended_tempo VARCHAR(60),                     -- e.g. '128 BPM Synthwave'
    ideal_moment TEXT,
    custom_prompt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 4. TABLE: orders (Cold-Chain Dispatch & Pre-Order Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(32) NOT NULL UNIQUE,              -- e.g. 'AMUL-STG-891024'
    dispatch_code VARCHAR(40) NOT NULL UNIQUE,         -- e.g. 'CND-4C-ANAND01'
    cust_name VARCHAR(150) NOT NULL,
    cust_address TEXT NOT NULL,
    pack_name VARCHAR(100) NOT NULL DEFAULT 'Single 120ml Can',
    pack_price NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    custom_formula_name VARCHAR(150) DEFAULT 'Amul × Sting Rose (Standard Blend)',
    custom_formula_id VARCHAR(32),                     -- References ai_creations.formula_code
    status order_status_type NOT NULL DEFAULT 'DISPATCH_CONFIRMED',
    cold_chain_temp VARCHAR(30) NOT NULL DEFAULT '3.8 °C Verified',
    carrier VARCHAR(120) NOT NULL DEFAULT 'Amul Anand Reefer Express Fleet Logistics',
    estimated_delivery_hours SMALLINT NOT NULL DEFAULT 24,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 5. TABLE: order_milestones (GPS Cold-Chain Live Timeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(32) NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    step_sequence SMALLINT NOT NULL,
    time_offset VARCHAR(20) NOT NULL,                  -- e.g. 'T+00m', 'T+15m'
    milestone_title TEXT NOT NULL,
    status milestone_status_type NOT NULL DEFAULT 'PENDING',
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 6. TABLE: coldchain_telemetry (Anand Plant #4 IoT Telemetry Logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coldchain_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(150) NOT NULL DEFAULT 'Amul Dairy Central Complex, Anand, Gujarat',
    fssai_license VARCHAR(20) NOT NULL DEFAULT '10012021000071',
    vat_temperature NUMERIC(4, 2) NOT NULL DEFAULT 3.80,
    vat_status VARCHAR(40) NOT NULL DEFAULT 'OPTIMAL FRESHNESS',
    target_temperature NUMERIC(4, 2) NOT NULL DEFAULT 4.00,
    carbonation_pressure_psi NUMERIC(4, 1) NOT NULL DEFAULT 42.2,
    nitrogen_seal_integrity NUMERIC(5, 2) NOT NULL DEFAULT 99.94,
    milk_fat_content VARCHAR(60) NOT NULL DEFAULT '3.15% (Standardized Anand Toned)',
    active_reefer_trucks SMALLINT NOT NULL DEFAULT 148,
    dairy_batch_number VARCHAR(40) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_code ON public.orders(dispatch_code);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON public.orders(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_creations_formula_code ON public.ai_creations(formula_code);
CREATE INDEX IF NOT EXISTS idx_ai_creations_created_at ON public.ai_creations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_milestones_order_id ON public.order_milestones(order_id);
CREATE INDEX IF NOT EXISTS idx_coldchain_telemetry_recorded_at ON public.coldchain_telemetry(recorded_at DESC);

-- ============================================================================
-- 8. AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp_column();

-- ============================================================================
-- 9. EXECUTIVE ANALYTICS VIEW (GCMMF Dashboard Aggregator)
-- ============================================================================
CREATE OR REPLACE VIEW public.v_executive_analytics AS
SELECT
    COUNT(*)::INT AS total_orders,
    COALESCE(SUM(pack_price), 0)::NUMERIC(12, 2) AS gross_revenue_inr,
    COALESCE(ROUND(AVG(pack_price), 2), 0) AS average_order_value_inr,
    COUNT(*) FILTER (WHERE custom_formula_name NOT LIKE '%Standard%')::INT AS ai_custom_formula_orders,
    ROUND(
        (COUNT(*) FILTER (WHERE custom_formula_name NOT LIKE '%Standard%')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        1
    ) AS ai_formula_adoption_rate_pct,
    '100.0% (Sub-4°C Guaranteed)' AS cold_chain_purity_rate,
    '10012021000071' AS fssai_license
FROM public.orders;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.ai_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coldchain_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public users to read all public community creations
CREATE POLICY "Public Read Access for AI Creations"
    ON public.ai_creations FOR SELECT
    USING (true);

-- Allow users to insert new AI formulations
CREATE POLICY "Public Insert Access for AI Creations"
    ON public.ai_creations FOR INSERT
    WITH CHECK (true);

-- Allow public users to view orders (read-only for tracking & drawer)
CREATE POLICY "Public Read Access for Orders"
    ON public.orders FOR SELECT
    USING (true);

-- Allow customers to place new pre-orders
CREATE POLICY "Public Insert Access for Orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

-- Allow customers to read order milestones for tracking
CREATE POLICY "Public Read Access for Order Milestones"
    ON public.order_milestones FOR SELECT
    USING (true);

-- Allow public telemetry dashboard reads
CREATE POLICY "Public Read Access for Telemetry"
    ON public.coldchain_telemetry FOR SELECT
    USING (true);

-- ============================================================================
-- 11. OFFICIAL GCMMF SEED DATA
-- ============================================================================

-- Insert AI Creations Seed Data
INSERT INTO public.ai_creations (
    formula_code, edition_name, mood, caffeine_pct, dairy_pct, rose_pct, chill_temp, carbonation, caffeine_mg, color_glow, tagline, flavor_notes, sensory_profile, sommelier_review, recommended_tempo, ideal_moment
) VALUES 
(
    'AMUL-AI-001',
    'Neon Damask Overdrive',
    'Late Night Coding Marathon',
    85, 70, 90, 2.0, 'High Fizz', 88, '#ff2d87',
    'Hyper-focused cognitive surge wrapped in velvety dairy calm.',
    ARRAY['Crisp Pink Petals', 'Silken Milk Foam', 'Citrus Zing', 'Electrifying Taurine Kick'],
    '{"topNote": "Crisp sparkling floral shock", "heartHarmony": "Subtle toned milk cushion", "finish": "Long clean focus pulse"}'::jsonb,
    'Hyper-refined balance. Buffers high-stimulant crash with rich homogenized dairy whey.',
    '130 BPM Synthwave',
    'Deep engineering sprints & nocturnal flow states'
),
(
    'AMUL-AI-002',
    'Himalayan Silk Recharge',
    'Post-Workout Beast Mode',
    72, 95, 60, 3.0, 'Velvet Smooth', 75, '#ffbe3b',
    'High-protein milk emulsion engineered for instant glycogen replenishment.',
    ARRAY['Creamy Anand Toned Milk', 'Wild Mountain Rose', 'Electrolyte Saline Finish'],
    '{"topNote": "Gentle floral aroma", "heartHarmony": "Lush anabolic milk protein", "finish": "Zero-acidity replenishment"}'::jsonb,
    'Engineered for rapid cellular recovery with milk peptides and cellular electrolytes.',
    '95 BPM Chilled Lo-Fi',
    'Immediate post-resistance training recovery'
),
(
    'AMUL-AI-003',
    'Monsoon Velvet Euphoria',
    'Chilled Sunset Vibe',
    55, 85, 100, 4.0, 'Micro-Bubbles', 60, '#ff4071',
    'A luxurious floral meditation with a subtle awakening spark.',
    ARRAY['Double-Distilled Damask Attar', 'Sweet Condensed Dairy Silk', 'Cardamom Mist'],
    '{"topNote": "Pure Kannauj rose mist", "heartHarmony": "Silken condensed dairy harmony", "finish": "Serene lingering warmth"}'::jsonb,
    'A sensory masterpiece invoking heritage royal rose sherbet with electric vitality.',
    '85 BPM Acoustic Flow',
    'Golden-hour rooftop unwinding'
)
ON CONFLICT (formula_code) DO NOTHING;

-- Insert Orders Seed Data
INSERT INTO public.orders (
    order_id, dispatch_code, cust_name, cust_address, pack_name, pack_price, custom_formula_name, custom_formula_id, status, cold_chain_temp, carrier, estimated_delivery_hours
) VALUES
(
    'AMUL-STG-891024',
    'CND-4C-ANAND01',
    'Dr. R. K. Patel (GCMMF HQ)',
    'Amul Dairy Road, Anand - 388001, Gujarat',
    'Limited Vault Box (24 Cans)',
    399.00,
    'Amul × Sting Silken Reserve: Anabolic Silk Edition',
    'AMUL-AI-002',
    'OUT_FOR_DELIVERY',
    '3.8 °C Verified',
    'Amul Anand Reefer Express Fleet #14',
    4
),
(
    'AMUL-STG-742918',
    'CND-4C-MUM892',
    'Aarav Sharma',
    'Hill Road, Bandra West, Mumbai - 400050',
    'Collector''s 6-Pack Box',
    110.00,
    'Amul × Sting HyperDrive: Neon Byte Edition',
    'AMUL-AI-001',
    'EN_ROUTE_REEFER',
    '3.9 °C Verified',
    'Amul Western Cold-Corridor Logistics',
    12
),
(
    'AMUL-STG-639105',
    'CND-4C-BLR331',
    'Priya Iyer',
    '100ft Road, Indiranagar, Bengaluru - 560038',
    'Single 120ml Can',
    20.00,
    'Amul × Sting Rose (Standard Blend)',
    NULL,
    'DISPATCH_CONFIRMED',
    '3.7 °C Verified',
    'Amul South Cold-Chain Transit',
    24
)
ON CONFLICT (order_id) DO NOTHING;

-- Insert Order Tracking Milestones
INSERT INTO public.order_milestones (order_id, step_sequence, time_offset, milestone_title, status) VALUES
('AMUL-STG-891024', 1, 'T+00m', 'Order Authenticated & Registered by GCMMF Anand', 'COMPLETED'),
('AMUL-STG-891024', 2, 'T+15m', 'Anand Plant #4 Can Allocation & 3.8°C Pre-Chilling', 'COMPLETED'),
('AMUL-STG-891024', 3, 'T+45m', 'Loaded onto Amul Anand Reefer Express Fleet #14 (Insulated Reefer)', 'COMPLETED'),
('AMUL-STG-891024', 4, 'T+02h', 'GPS Highway Corridor Dispatch towards Anand - 388001', 'COMPLETED'),
('AMUL-STG-891024', 5, 'T+04h', 'Guaranteed 4°C Handover to Customer', 'ACTIVE');

-- Insert Initial IoT Cold-Chain Telemetry Log
INSERT INTO public.coldchain_telemetry (
    vat_temperature, vat_status, target_temperature, carbonation_pressure_psi, nitrogen_seal_integrity, milk_fat_content, active_reefer_trucks, dairy_batch_number
) VALUES 
(
    3.82, 'OPTIMAL FRESHNESS', 4.00, 42.2, 99.94, '3.15% (Standardized Anand Toned)', 148, 'AML-STG-2026-8491'
);
