-- Migration SQL : Déblocage RLS pour l'administration des demandes de paiement
-- À exécuter dans le SQL Editor du dashboard Supabase

-- 1. Autoriser les administrateurs à voir TOUTES les demandes de paiement
DROP POLICY IF EXISTS "Admins can select all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can select all payment requests" ON public.payment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 2. Autoriser les administrateurs à valider / rejeter les demandes de paiement
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
CREATE POLICY "Admins can update payment requests" ON public.payment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 3. Autoriser les administrateurs à supprimer des demandes si nécessaire
DROP POLICY IF EXISTS "Admins can delete payment requests" ON public.payment_requests;
CREATE POLICY "Admins can delete payment requests" ON public.payment_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
