-- Migration Script: Demandes de Paiement

-- Créer la table payment_requests pour suivre les paiements manuels
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    plan_type text not null,
    amount numeric not null,
    phone_used text not null,
    status text default 'pending', -- 'pending', 'approved', 'rejected'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activer RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Les utilisateurs peuvent voir leurs propres demandes." ON public.payment_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres demandes." ON public.payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seul un admin (ou avec des droits spécifiques) pourrait modifier le statut, 
-- pour l'instant on laisse les updates bloqués pour les utilisateurs normaux.
