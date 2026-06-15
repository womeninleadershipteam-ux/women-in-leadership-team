
-- =========================================================================
-- 1) Slug helper: lower + dasherize, then ensure unique within a table+column
-- =========================================================================
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' FROM regexp_replace(lower(coalesce(_input,'')), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.unique_slug(_table regclass, _column text, _base text, _self_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  base text := nullif(public.slugify(_base), '');
  candidate text;
  n int := 1;
  exists_row boolean;
BEGIN
  IF base IS NULL THEN base := 'item'; END IF;
  candidate := base;
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s WHERE %I = $1 AND ($2 IS NULL OR id <> $2))', _table, _column)
      INTO exists_row USING candidate, _self_id;
    EXIT WHEN NOT exists_row;
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  RETURN candidate;
END $$;

-- =========================================================================
-- 2) EVENTS: slug
-- =========================================================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.events_set_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := public.unique_slug('public.events'::regclass, 'slug', NEW.title, NEW.id);
  ELSE
    NEW.slug := public.unique_slug('public.events'::regclass, 'slug', NEW.slug, NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS events_set_slug_trg ON public.events;
CREATE TRIGGER events_set_slug_trg
BEFORE INSERT OR UPDATE OF slug, title ON public.events
FOR EACH ROW EXECUTE FUNCTION public.events_set_slug();

-- Backfill
UPDATE public.events SET slug = public.unique_slug('public.events'::regclass, 'slug', title, id)
WHERE slug IS NULL OR length(trim(slug)) = 0;

ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_key ON public.events(slug);

-- =========================================================================
-- 3) EVENT_SPEAKERS: slug + gender
-- =========================================================================
ALTER TABLE public.event_speakers ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.event_speakers ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'female';

-- Validate gender via trigger (CHECK constraint works too, but trigger is consistent w/ project style)
CREATE OR REPLACE FUNCTION public.event_speakers_set_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.gender NOT IN ('female','male','unspecified') THEN
    NEW.gender := 'female';
  END IF;
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := public.unique_slug('public.event_speakers'::regclass, 'slug', NEW.name, NEW.id);
  ELSE
    NEW.slug := public.unique_slug('public.event_speakers'::regclass, 'slug', NEW.slug, NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS event_speakers_set_slug_trg ON public.event_speakers;
CREATE TRIGGER event_speakers_set_slug_trg
BEFORE INSERT OR UPDATE OF slug, name, gender ON public.event_speakers
FOR EACH ROW EXECUTE FUNCTION public.event_speakers_set_slug();

UPDATE public.event_speakers SET slug = public.unique_slug('public.event_speakers'::regclass, 'slug', name, id)
WHERE slug IS NULL OR length(trim(slug)) = 0;

ALTER TABLE public.event_speakers ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS event_speakers_slug_key ON public.event_speakers(slug);

-- =========================================================================
-- 4) NEWSLETTER_SUBSCRIBERS: first_name
-- =========================================================================
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS first_name text;

-- =========================================================================
-- 5) NEWSLETTER_DRAFTS table (admin-only)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  preview_text text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  audience jsonb NOT NULL DEFAULT '{"mode":"all"}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  recipient_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_drafts TO authenticated;
GRANT ALL ON public.newsletter_drafts TO service_role;

ALTER TABLE public.newsletter_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage newsletter drafts" ON public.newsletter_drafts;
CREATE POLICY "admins manage newsletter drafts"
ON public.newsletter_drafts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS newsletter_drafts_touch ON public.newsletter_drafts;
CREATE TRIGGER newsletter_drafts_touch
BEFORE UPDATE ON public.newsletter_drafts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
