
ALTER FUNCTION public.slugify(text) SET search_path = public;
ALTER FUNCTION public.unique_slug(regclass, text, text, uuid) SET search_path = public;
ALTER FUNCTION public.events_set_slug() SET search_path = public;
ALTER FUNCTION public.event_speakers_set_slug() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.slugify(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unique_slug(regclass, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.events_set_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_speakers_set_slug() FROM PUBLIC, anon, authenticated;
