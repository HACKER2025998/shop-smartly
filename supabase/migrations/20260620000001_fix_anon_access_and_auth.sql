-- ============================================================
-- FIX CRITIQUE : restaurer l'accès anonyme (visiteurs non connectés)
-- ============================================================
-- Cause du bug "produits ne se chargent plus sur mobile" :
-- une migration précédente a révoqué EXECUTE sur has_role() pour le rôle "anon".
-- Or la policy SELECT sur "products" appelle has_role() pour TOUT visiteur
-- (connecté ou pas). Sans ce droit, la requête échoue silencieusement
-- côté RLS et la boutique reste vide pour les visiteurs non connectés
-- ou dont la session a expiré (fréquent sur mobile).

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon;

-- Sécurité : ces fonctions sont SECURITY DEFINER + STABLE, elles ne font
-- que lire user_roles en lecture, donc aucun risque à les ouvrir à anon.
-- Elles renvoient simplement "false" si l'utilisateur n'est pas connecté.

-- ============================================================
-- Vérification : s'assurer que le compte admin a bien son rôle
-- ============================================================
DO $$
DECLARE v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'adjogblebernard229@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'super_admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'super_admin confirmé pour uid: %', v_uid;
  END IF;
END $$;
