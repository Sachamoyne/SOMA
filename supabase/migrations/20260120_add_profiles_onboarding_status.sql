-- Add onboarding_status to profiles
-- Goal:
-- - FREE users: onboarding_status = 'active' (email confirmation enforced at login/app guard)
-- - PAID users: onboarding_status = 'pending_payment' until Stripe webhook sets 'active'

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT;

-- Constrain values (allow NULL for legacy rows until backfilled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_onboarding_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_onboarding_status_check
      CHECK (onboarding_status IS NULL OR onboarding_status IN ('pending_payment', 'active'));
  END IF;
END $$;

-- Backfill existing rows safely
UPDATE public.profiles
SET onboarding_status = 'active'
WHERE onboarding_status IS NULL;

-- Default for new rows (free is the safe default)
ALTER TABLE public.profiles
  ALTER COLUMN onboarding_status SET DEFAULT 'active';

