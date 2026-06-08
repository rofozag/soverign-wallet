-- ── Referral system ────────────────────────────────────────────────────────────

-- Add referral_code: unique code per user, auto-generated on signup.
-- Add referred_by:   points to the profile that referred this user.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- Generate referral codes for any existing users that don't have one yet.
UPDATE public.profiles
SET referral_code = 'SW' || UPPER(REPLACE(SUBSTRING(id::text FROM 1 FOR 8), '-', ''))
WHERE referral_code IS NULL;

-- Update the signup trigger to auto-generate a referral code for every new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      SPLIT_PART(new.email, '@', 1)
    ),
    -- e.g. SWA3F8C2D1  (SW + first 8 hex chars of the UUID)
    'SW' || UPPER(REPLACE(SUBSTRING(new.id::text FROM 1 FOR 8), '-', ''))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: users can read their own referral_code + referred_by (already covered
-- by the existing "Users read own profile" policy — no extra policy needed).
