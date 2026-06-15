-- 1. Création de la table des avis de boutiques
CREATE TABLE IF NOT EXISTS public.boutique_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_id uuid REFERENCES public.profiles(id) NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Un utilisateur ne peut laisser qu'un seul avis par boutique
  UNIQUE(boutique_id, reviewer_id)
);

-- 2. Activer la sécurité RLS (Row Level Security)
ALTER TABLE public.boutique_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Politiques d'accès (Policies)
-- Tout le monde peut voir les avis
CREATE POLICY "Les avis sont visibles par tous" 
  ON public.boutique_reviews FOR SELECT 
  USING (true);

-- Seuls les utilisateurs connectés peuvent laisser un avis
CREATE POLICY "Les utilisateurs connectés peuvent laisser un avis" 
  ON public.boutique_reviews FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Les utilisateurs peuvent modifier leur propre avis
CREATE POLICY "Les utilisateurs peuvent modifier leur propre avis" 
  ON public.boutique_reviews FOR UPDATE 
  USING (auth.uid() = reviewer_id);

-- Les utilisateurs peuvent supprimer leur propre avis
CREATE POLICY "Les utilisateurs peuvent supprimer leur propre avis" 
  ON public.boutique_reviews FOR DELETE 
  USING (auth.uid() = reviewer_id);
