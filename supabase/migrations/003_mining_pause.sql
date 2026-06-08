-- Add time_remaining column to track paused mining sessions
-- time_remaining: seconds left in the current cycle when mining was paused
-- NULL = not mining / no active session
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS time_remaining INTEGER DEFAULT NULL;
