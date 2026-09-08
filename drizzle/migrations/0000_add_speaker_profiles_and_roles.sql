CREATE TABLE public.speaker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.speaker_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaker_profiles TO authenticated;
GRANT ALL ON public.speaker_profiles TO service_role;

ALTER TABLE public.speaker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view speaker profiles"
  ON public.speaker_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert speaker profiles"
  ON public.speaker_profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update speaker profiles"
  ON public.speaker_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete speaker profiles"
  ON public.speaker_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.event_speakers
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.speaker_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS speaker_profiles_normalized_name_idx
  ON public.speaker_profiles(normalized_name);
CREATE INDEX IF NOT EXISTS event_speakers_profile_id_idx
  ON public.event_speakers(profile_id);

INSERT INTO public.speaker_profiles (canonical_name, normalized_name)
SELECT DISTINCT ON (lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '', 'g')))
  trim(name),
  lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '', 'g'))
FROM public.event_speakers
WHERE length(trim(name)) > 0
ORDER BY lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '', 'g')), length(trim(name)), id;

UPDATE public.event_speakers AS es
SET profile_id = sp.id
FROM public.speaker_profiles AS sp
WHERE es.profile_id IS NULL
  AND sp.normalized_name = lower(regexp_replace(trim(es.name), '[^a-zA-Z0-9]+', '', 'g'));

CREATE TRIGGER touch_speaker_profiles_updated_at
  BEFORE UPDATE ON public.speaker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();