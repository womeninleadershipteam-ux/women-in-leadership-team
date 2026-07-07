ALTER FUNCTION public.events_set_slug() SECURITY DEFINER;
ALTER FUNCTION public.event_speakers_set_slug() SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.slugify(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unique_slug(regclass, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.events_set_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_speakers_set_slug() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.slugify(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.unique_slug(regclass, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.events_set_slug() TO service_role;
GRANT EXECUTE ON FUNCTION public.event_speakers_set_slug() TO service_role;