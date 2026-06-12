-- Structured location on events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS location_type text NOT NULL DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS location_details jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Per-event speakers
CREATE TABLE public.event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  bio text,
  photo_url text,
  social_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_speakers_name_len CHECK (char_length(name) BETWEEN 1 AND 200),
  CONSTRAINT event_speakers_title_len CHECK (title IS NULL OR char_length(title) <= 300),
  CONSTRAINT event_speakers_bio_len CHECK (bio IS NULL OR char_length(bio) <= 2000)
);

GRANT SELECT ON public.event_speakers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_speakers TO authenticated;
GRANT ALL ON public.event_speakers TO service_role;

ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event speakers"
  ON public.event_speakers FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert event speakers"
  ON public.event_speakers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event speakers"
  ON public.event_speakers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event speakers"
  ON public.event_speakers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_event_speakers_updated_at
  BEFORE UPDATE ON public.event_speakers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage policies for the private event-images bucket
CREATE POLICY "Admins can upload event images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read event images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-images');

CREATE POLICY "Admins can update event images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));