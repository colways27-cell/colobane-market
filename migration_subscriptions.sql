-- Migration Script: Abonnements et Limites

-- Mettre à jour la table profiles avec les nouvelles colonnes d'abonnement
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Mettre à jour la table products avec les dates de boost
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS boost_end_date timestamp with time zone;
