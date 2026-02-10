-- Push notification device tokens for iOS (APNs)
-- Stores one token per device per user. No destructive changes to existing tables.

CREATE TABLE IF NOT EXISTS push_devices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token text NOT NULL,
  platform    text NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios', 'android')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_token)
);

-- Index for the daily cron query: "get all tokens for users with due cards"
CREATE INDEX IF NOT EXISTS idx_push_devices_user_id ON push_devices(user_id);

-- RLS: users can only manage their own tokens
ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own device tokens"
  ON push_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens"
  ON push_devices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens"
  ON push_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Users can read their own tokens (needed for upsert conflict detection)
CREATE POLICY "Users can read their own device tokens"
  ON push_devices FOR SELECT
  USING (auth.uid() = user_id);
