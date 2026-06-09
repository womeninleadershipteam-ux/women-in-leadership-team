ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS topic text;