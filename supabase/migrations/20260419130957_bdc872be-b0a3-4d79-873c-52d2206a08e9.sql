-- Fix WARN 1: restrict activity_logs INSERT to authenticated users only
DROP POLICY IF EXISTS "System inserts logs" ON public.activity_logs;
CREATE POLICY "Authenticated insert logs" ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL);

-- Fix WARN 2: replace broad SELECT with object-level access (no listing)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
-- Public can read individual files by URL but cannot list the bucket
-- (Supabase serves public buckets via /object/public/<bucket>/<path> which works without SELECT policy)
-- We keep no SELECT policy = no listing, but admin can still list
CREATE POLICY "Admins list product images" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));