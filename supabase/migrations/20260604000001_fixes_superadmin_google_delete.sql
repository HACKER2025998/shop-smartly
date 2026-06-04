-- ============================================================
-- ÉTAPE 1 : Ajouter la valeur super_admin à l'enum
-- (doit être commitée seule avant utilisation)
-- ============================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
