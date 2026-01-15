-- Add subscription-related fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS ai_cards_limit INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_cards_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON profiles(subscription_status)
  WHERE subscription_status IS NOT NULL;
