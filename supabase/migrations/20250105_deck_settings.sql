-- Migration: Add deck-specific settings with inheritance from global settings
-- Date: 2025-01-05
-- Description: Create deck_settings table to allow per-deck setting overrides

-- ============================================================================
-- STEP 1: Create deck_settings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS deck_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Daily limits (NULL = inherit from global settings)
  new_cards_per_day INTEGER CHECK (new_cards_per_day IS NULL OR (new_cards_per_day >= 1 AND new_cards_per_day <= 9999)),
  max_reviews_per_day INTEGER CHECK (max_reviews_per_day IS NULL OR (max_reviews_per_day >= 1 AND max_reviews_per_day <= 9999)),

  -- Learning settings (NULL = inherit from global settings)
  learning_mode TEXT CHECK (learning_mode IS NULL OR learning_mode IN ('fast', 'normal', 'deep')),

  -- Error settings (NULL = inherit from global settings)
  again_delay_minutes INTEGER CHECK (again_delay_minutes IS NULL OR (again_delay_minutes >= 1 AND again_delay_minutes <= 1440)),

  -- Study settings (NULL = inherit from global settings)
  review_order TEXT CHECK (review_order IS NULL OR review_order IN ('mixed', 'oldFirst', 'newFirst')),

  -- Advanced scheduler settings (NULL = inherit from global settings)
  learning_steps TEXT,
  relearning_steps TEXT,
  graduating_interval_days INTEGER CHECK (graduating_interval_days IS NULL OR graduating_interval_days >= 1),
  easy_interval_days INTEGER CHECK (easy_interval_days IS NULL OR easy_interval_days >= 1),
  starting_ease DECIMAL(3,2) CHECK (starting_ease IS NULL OR (starting_ease >= 1.30 AND starting_ease <= 5.00)),
  easy_bonus DECIMAL(3,2) CHECK (easy_bonus IS NULL OR (easy_bonus >= 1.00 AND easy_bonus <= 3.00)),
  hard_interval DECIMAL(3,2) CHECK (hard_interval IS NULL OR (hard_interval >= 0.50 AND hard_interval <= 1.50)),
  interval_modifier DECIMAL(3,2) CHECK (interval_modifier IS NULL OR (interval_modifier >= 0.50 AND interval_modifier <= 2.00)),
  new_interval_multiplier DECIMAL(3,2) CHECK (new_interval_multiplier IS NULL OR (new_interval_multiplier >= 0.00 AND new_interval_multiplier <= 1.00)),
  minimum_interval_days INTEGER CHECK (minimum_interval_days IS NULL OR minimum_interval_days >= 1),
  maximum_interval_days INTEGER CHECK (maximum_interval_days IS NULL OR maximum_interval_days >= 1),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each deck can only have one settings row per user
  UNIQUE(user_id, deck_id)
);

-- ============================================================================
-- STEP 2: Add indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_deck_settings_user_id ON deck_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_settings_deck_id ON deck_settings(deck_id);

-- ============================================================================
-- STEP 3: Add RLS policies
-- ============================================================================

ALTER TABLE deck_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own deck settings
CREATE POLICY deck_settings_select_own ON deck_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own deck settings
CREATE POLICY deck_settings_insert_own ON deck_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own deck settings
CREATE POLICY deck_settings_update_own ON deck_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own deck settings
CREATE POLICY deck_settings_delete_own ON deck_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: Add updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_deck_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deck_settings_updated_at
  BEFORE UPDATE ON deck_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_settings_updated_at();
