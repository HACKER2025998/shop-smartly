BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD CONSTRAINT product_gallery_limit CHECK (cardinality(image_urls) <= 8);
UPDATE public.products SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND cardinality(image_urls) = 0;
UPDATE storage.buckets SET file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'] WHERE id = 'product-images';
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') AND
 (NEW.plan IS DISTINCT FROM OLD.plan OR NEW.purchase_count IS DISTINCT FROM OLD.purchase_count OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email) THEN
 RAISE EXCEPTION 'Protected profile fields cannot be changed by this user';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_privileges() FROM PUBLIC;
CREATE TRIGGER protect_profile_privileges BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();
COMMIT;
