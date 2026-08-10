-- Migration Script: Ajout des permissions Administrateur

-- 1. Ajouter la colonne is_admin à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Créer une politique pour permettre aux admins de voir toutes les requêtes de paiement
DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can view all payment requests" ON public.payment_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. Créer une politique pour permettre aux admins de modifier les requêtes de paiement
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
CREATE POLICY "Admins can update payment requests" ON public.payment_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 4. Créer une politique pour permettre aux admins de modifier n'importe quel profil (ex: pour mettre à jour l'abonnement)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 6. Créer une politique pour permettre aux admins de modifier n'importe quel produit (ex: pour le booster)
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
CREATE POLICY "Admins can update all products" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
