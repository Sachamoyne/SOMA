-- Migration: Add 'suspended' state to cards table
-- Date: 2025-01-04
-- Description: Add 'suspended' as a valid card state to properly handle suspended/buried cards from Anki
--
-- Context: Anki cards can be suspended (queue = -1, -2, -3), which means they should NOT appear
-- in study sessions, stats, or due counts. Previously, these cards were incorrectly mapped to
-- 'review' state, causing them to appear in statistics.
--
-- Solution: Add 'suspended' as a valid state and update all queries to filter it out.

-- ============================================================================
-- STEP 1: Update cards table to allow 'suspended' state
-- ============================================================================

-- Drop existing constraint
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_state_check;

-- Add new constraint with 'suspended' state
ALTER TABLE cards ADD CONSTRAINT cards_state_check
  CHECK (state IN ('new', 'learning', 'review', 'relearning', 'suspended'));

-- ============================================================================
-- STEP 2: Update existing suspended cards
-- ============================================================================

-- Update cards that are marked as suspended but have a different state
-- Set their state to 'suspended' to be consistent
UPDATE cards
SET state = 'suspended'
WHERE suspended = true
  AND state != 'suspended';

-- ============================================================================
-- STEP 3: Update index to exclude suspended cards
-- ============================================================================

-- The existing index already excludes suspended cards via WHERE NOT suspended
-- This is correct and will work for both suspended=true and state='suspended'

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT cards_state_check ON cards IS 'Valid SRS states: new, learning, review, relearning, suspended. Suspended cards are not shown in study sessions or stats.';
