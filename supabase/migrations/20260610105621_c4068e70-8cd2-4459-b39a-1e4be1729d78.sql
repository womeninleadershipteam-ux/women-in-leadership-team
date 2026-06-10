DROP POLICY IF EXISTS "Anyone can submit messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit valid messages"
  ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 254
    AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    AND length(btrim(message)) BETWEEN 1 AND 5000
  );

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can submit valid newsletter email"
  ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(email) BETWEEN 3 AND 254
    AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    AND (source IS NULL OR length(source) <= 80)
  );

REVOKE EXECUTE ON FUNCTION public.claim_initial_admin() FROM PUBLIC, anon, authenticated;