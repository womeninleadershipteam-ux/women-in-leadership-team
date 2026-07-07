CREATE OR REPLACE FUNCTION public.events_set_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
      NEW.slug := public.unique_slug('public.events'::regclass, 'slug', NEW.title, NEW.id);
    ELSE
      NEW.slug := public.unique_slug('public.events'::regclass, 'slug', NEW.slug, NEW.id);
    END IF;
  ELSIF NEW.title IS DISTINCT FROM OLD.title THEN
    NEW.slug := public.unique_slug('public.events'::regclass, 'slug', NEW.title, NEW.id);
  ELSIF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := public.unique_slug('public.events'::regclass, 'slug', NEW.title, NEW.id);
  ELSE
    NEW.slug := public.unique_slug('public.events'::regclass, 'slug', NEW.slug, NEW.id);
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.event_speakers_set_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.gender NOT IN ('female','male','unspecified') THEN
    NEW.gender := 'female';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
      NEW.slug := public.unique_slug('public.event_speakers'::regclass, 'slug', NEW.name, NEW.id);
    ELSE
      NEW.slug := public.unique_slug('public.event_speakers'::regclass, 'slug', NEW.slug, NEW.id);
    END IF;
  ELSIF NEW.name IS DISTINCT FROM OLD.name THEN
    NEW.slug := public.unique_slug('public.event_speakers'::regclass, 'slug', NEW.name, NEW.id);
  ELSIF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := public.unique_slug('public.event_speakers'::regclass, 'slug', NEW.name, NEW.id);
  ELSE
    NEW.slug := public.unique_slug('public.event_speakers'::regclass, 'slug', NEW.slug, NEW.id);
  END IF;
  RETURN NEW;
END $function$;

REVOKE EXECUTE ON FUNCTION public.slugify(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unique_slug(regclass, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.events_set_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_speakers_set_slug() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.slugify(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.unique_slug(regclass, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.events_set_slug() TO service_role;
GRANT EXECUTE ON FUNCTION public.event_speakers_set_slug() TO service_role;