
-- Newsletter images: admin upload/read; we'll embed via signed URLs in blast HTML.
DROP POLICY IF EXISTS "Admins can upload newsletter images" ON storage.objects;
CREATE POLICY "Admins can upload newsletter images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'newsletter-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read newsletter images" ON storage.objects;
CREATE POLICY "Admins can read newsletter images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'newsletter-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete newsletter images" ON storage.objects;
CREATE POLICY "Admins can delete newsletter images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'newsletter-images' AND public.has_role(auth.uid(), 'admin'));
