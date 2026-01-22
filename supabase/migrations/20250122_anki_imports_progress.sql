-- Migration: Add anki_imports table for tracking Anki import progress
-- This table is SEPARATE from the existing 'imports' table (used for PDF/images)
-- to avoid breaking any existing functionality.

-- Anki imports progress tracking table
CREATE TABLE anki_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
  total_cards INTEGER NOT NULL DEFAULT 0,
  imported_cards INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_anki_imports_user_id ON anki_imports(user_id);

-- Index for finding active imports
CREATE INDEX idx_anki_imports_status ON anki_imports(status);

-- Enable Row Level Security
ALTER TABLE anki_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anki_imports
CREATE POLICY "Users can view their own anki_imports"
  ON anki_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own anki_imports"
  ON anki_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anki_imports"
  ON anki_imports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anki_imports"
  ON anki_imports FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for this table (for live progress updates)
ALTER PUBLICATION supabase_realtime ADD TABLE anki_imports;
