-- ============================================================
-- ÉTAPE 2 : Tout le reste (à exécuter APRÈS la migration 1)
-- ============================================================

-- 1. Permettre la suppression d'un produit même s'il a des order_items
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

-- 2. Fonction : vérifier si un user est super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin');
$$;

-- 3. has_role : super_admin hérite de tous les droits admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND (role = _role OR role = 'super_admin')
  );
$$;

-- 4. Politique user_roles : seul super_admin peut gérer les lignes super_admin
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    AND (role != 'super_admin' OR public.is_super_admin(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND (role != 'super_admin' OR public.is_super_admin(auth.uid()))
  );

-- 5. Attribuer super_admin à adjogblebernard229@gmail.com s'il existe déjà
DO $$
DECLARE v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'adjogblebernard229@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = v_uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'super_admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'super_admin attribué (uid: %)', v_uid;
  ELSE
    RAISE NOTICE 'Email pas encore enregistré, sera géré par trigger au premier login';
  END IF;
END $$;

-- 6. Trigger handle_new_user amélioré (Google OAuth + super_admin auto)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_full_name TEXT;
  v_phone     TEXT;
  v_country   TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    ''
  );
  v_phone   := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_country := COALESCE(NEW.raw_user_meta_data->>'country_code', 'XX');

  INSERT INTO public.profiles (user_id, email, full_name, phone, country_code)
  VALUES (NEW.id, NEW.email, v_full_name, v_phone, v_country)
  ON CONFLICT (user_id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  IF NEW.email = 'adjogblebernard229@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Politique order_items INSERT (product_id peut être null maintenant)
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );
