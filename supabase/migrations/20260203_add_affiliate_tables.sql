-- ============================================================================
-- Migration: Add affiliate tracking tables
-- Date: 2026-02-03
-- Purpose: Enable influencer promo code attribution and commission tracking
-- ============================================================================

-- Table: affiliates
-- Stores influencer information and their promo codes
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  stripe_promotion_code_id TEXT UNIQUE,  -- e.g., "promo_xxx" from Stripe
  promotion_code TEXT NOT NULL UNIQUE,   -- e.g., "MARIE20" (human-readable)
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: affiliate_conversions
-- Records each conversion (subscription) attributed to an affiliate
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,  -- References profiles(id) but flexible for edge cases
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,  -- Prevents duplicates (idempotency)
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  amount_paid_cents INTEGER NOT NULL,               -- Amount after discount
  discount_cents INTEGER NOT NULL DEFAULT 0,        -- Discount amount
  commission_percent NUMERIC(5,2) NOT NULL,         -- Snapshot at conversion time
  commission_cents INTEGER NOT NULL,                -- Calculated commission
  commission_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  paid_reference TEXT,                              -- e.g., "PayPal txn 123" or "Bank transfer 2024-02-03"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_affiliates_promotion_code
  ON affiliates(promotion_code);

CREATE INDEX IF NOT EXISTS idx_affiliates_stripe_promo_id
  ON affiliates(stripe_promotion_code_id)
  WHERE stripe_promotion_code_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversions_affiliate_id
  ON affiliate_conversions(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_conversions_unpaid
  ON affiliate_conversions(affiliate_id)
  WHERE commission_paid = FALSE;

CREATE INDEX IF NOT EXISTS idx_conversions_created_at
  ON affiliate_conversions(created_at);

-- RLS: Only service role can access these tables (admin-only)
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- No public policies - these tables are accessed via service role only
-- (webhook runs with service role key)

-- ============================================================================
-- ADMIN QUERIES (for manual use)
-- ============================================================================

-- Query 1: View all affiliates
-- SELECT * FROM affiliates ORDER BY created_at DESC;

-- Query 2: View recent conversions with affiliate info
-- SELECT
--   c.id,
--   a.name AS affiliate_name,
--   a.promotion_code,
--   c.amount_paid_cents / 100.0 AS amount_paid_eur,
--   c.commission_cents / 100.0 AS commission_eur,
--   c.commission_paid,
--   c.created_at
-- FROM affiliate_conversions c
-- JOIN affiliates a ON a.id = c.affiliate_id
-- ORDER BY c.created_at DESC
-- LIMIT 50;

-- Query 3: Unpaid commissions summary (for payout calculation)
-- SELECT
--   a.id AS affiliate_id,
--   a.name,
--   a.email,
--   COUNT(c.id) AS conversions,
--   SUM(c.commission_cents) AS total_commission_cents,
--   ROUND(SUM(c.commission_cents) / 100.0, 2) AS total_commission_eur
-- FROM affiliates a
-- JOIN affiliate_conversions c ON c.affiliate_id = a.id
-- WHERE c.commission_paid = FALSE
-- GROUP BY a.id, a.name, a.email
-- ORDER BY total_commission_cents DESC;

-- Query 4: Mark conversions as paid (after manual payout)
-- UPDATE affiliate_conversions
-- SET
--   commission_paid = TRUE,
--   paid_at = NOW(),
--   paid_reference = 'PayPal transfer 2026-02-03'
-- WHERE affiliate_id = '<AFFILIATE_UUID>'
--   AND commission_paid = FALSE;
