-- ══════════════════════════════════════════════════════════════════════════════
-- COLOBANE MARKET — CORRECTIONS SÉCURITÉ POST-AUDIT
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- Date : 14 août 2026
-- ══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX #1 : Sécuriser le bucket certification-requests
-- Les photos d'identité (CNI, passeport, selfies) étaient publiquement accessibles
-- ═══════════════════════════════════════════════════════════════════════════

-- Rendre le bucket privé
UPDATE storage.buckets SET public = false WHERE id = 'certification-requests';

-- Supprimer l'ancienne politique publique
DROP POLICY IF EXISTS "Certification images are publicly accessible." ON storage.objects;

-- Nouvelle politique : seul le propriétaire peut uploader ses fichiers de certification
CREATE POLICY "Users upload own certification files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certification-requests'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Nouvelle politique : seul le propriétaire + admins peuvent lire les fichiers
CREATE POLICY "Users and admins read certification files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certification-requests'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
);

-- Nouvelle politique : seul le propriétaire peut supprimer ses fichiers
CREATE POLICY "Users delete own certification files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'certification-requests'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FIX #2 : Corriger la politique RLS INSERT sur products
-- Tout utilisateur authentifié pouvait créer un produit au nom d'un autre vendeur
-- ═══════════════════════════════════════════════════════════════════════════

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Les utilisateurs connectés peuvent créer des produits" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;

-- Nouvelle politique : un utilisateur ne peut insérer que SES propres produits
CREATE POLICY "Users can only insert their own products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (auth.uid() = seller_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- FIX #3 : Protéger les colonnes sensibles des profils (email, phone)
-- La table profiles était lisible par les anonymes (fuite via lookup téléphone)
-- ═══════════════════════════════════════════════════════════════════════════

-- ATTENTION : Les pages boutique publiques ont besoin d'accéder aux profils
-- On crée une vue publique avec seulement les colonnes non sensibles
-- puis on restreint l'accès direct à la table profiles

-- 1. Créer une vue publique sécurisée pour les pages boutique
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  boutique_name,
  boutique_description,
  banner_url,
  business_hours,
  location,
  account_type,
  is_verified,
  subscription_plan,
  subscription_status,
  created_at
FROM public.profiles;

-- Donner accès à la vue aux anonymes
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. Restreindre l'accès SELECT sur la table profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Les profils sont visibles par tous" ON public.profiles;

-- Les utilisateurs authentifiés peuvent voir tous les profils
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- FIX #5 : Renforcer les politiques admin
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users or admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
